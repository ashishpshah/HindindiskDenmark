using HindIndisk.Api.Application.DTOs.Order;
using HindIndisk.Api.Domain.Entities;
using HindIndisk.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace HindIndisk.Api.Application.Services;

public class OrderService : IOrderService
{
    private readonly ApplicationDbContext _db;
    private readonly IEmailService _email;
    private readonly ICustomerService _customers;

    public OrderService(ApplicationDbContext db, IEmailService email, ICustomerService customers)
    {
        _db        = db;
        _email     = email;
        _customers = customers;
    }

    public async Task<OrderDto> CreateOrderAsync(CreateOrderRequest request, long? loggedInUserId = null)
    {
        long   userId;
        bool   sendCredentials  = false;
        string? credentialsPwd  = null;
        string? credentialsEmail = null;
        string  credentialsName  = string.Empty;

        if (loggedInUserId.HasValue)
        {
            // Cases 1 & 2: authenticated — own the order, no account creation
            userId = loggedInUserId.Value;
        }
        else
        {
            // Cases 3 & 4: guest checkout — find or create by contact details
            var (customer, isNew, pwd) = await _customers.FindOrCreateAsync(
                request.Firstname ?? string.Empty, request.Lastname ?? string.Empty, request.Phone, request.Email);
            userId = customer.Id;

            if (isNew && pwd is not null)
            {
                // Case 3: brand-new account — queue credentials email after order saves
                sendCredentials  = true;
                credentialsPwd   = pwd;
                credentialsEmail = customer.Email!;
                credentialsName  = $"{customer.Firstname} {customer.Lastname}".Trim();
            }
            // Case 4: existing account — no email
        }

        if (request.OrderType == "Delivery" && string.IsNullOrWhiteSpace(request.DeliveryAddress))
            throw new InvalidOperationException("Delivery address is required for delivery orders.");

        var branch = await _db.Branches.AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == request.BranchId)
            ?? throw new InvalidOperationException("Branch not found.");

        if (branch.IsCloseOrder)
            throw new InvalidOperationException("Online orders are temporarily suspended for this branch.");


        var itemIds = request.Items.Select(i => i.MenuItemId).Distinct().ToList();

        // Server recalculates all prices — client totals are never trusted
        var prices = await _db.BranchMenuItemPrices
            .Where(p => p.BranchId == request.BranchId && itemIds.Contains(p.MenuItemId))
            .AsNoTracking()
            .ToDictionaryAsync(p => p.MenuItemId, p => p.Price);

        var missing = itemIds.Except(prices.Keys).ToList();
        if (missing.Count > 0)
            throw new InvalidOperationException(
                $"Items {string.Join(", ", missing)} are not available at the selected branch.");

        var subtotal = request.Items.Sum(i => prices[i.MenuItemId] * i.Quantity);

        // Coupon validation
        decimal discount = 0m;
        Offer? appliedOffer = null;
        if (!string.IsNullOrWhiteSpace(request.CouponCode))
        {
            var code = request.CouponCode.Trim().ToUpper();
            appliedOffer = await _db.Offers
                .FirstOrDefaultAsync(o => o.CouponCode == code && o.IsActive
                    && o.StartDate <= DenmarkTime.Now && o.EndDate >= DenmarkTime.Now);

            if (appliedOffer is null)
                throw new InvalidOperationException("Invalid or expired coupon code.");

            if (appliedOffer.MinimumOrderAmount.HasValue && subtotal < appliedOffer.MinimumOrderAmount.Value)
                throw new InvalidOperationException(
                    $"A minimum order of {appliedOffer.MinimumOrderAmount} DKK is required for this coupon.");

            if (appliedOffer.UsageLimit.HasValue && appliedOffer.UsageCount >= appliedOffer.UsageLimit.Value)
                throw new InvalidOperationException("This coupon has reached its usage limit.");

            if (appliedOffer.IsFirstOrderOnly)
            {
                var hasPriorOrder = await _db.Orders
                    .AnyAsync(o => o.UserId == userId && o.Status != "Cancelled");
                if (hasPriorOrder)
                    throw new InvalidOperationException("This offer is only valid on your first order.");
            }

            discount = appliedOffer.DiscountType switch
            {
                "Percent"     => Math.Round(subtotal * appliedOffer.DiscountValue / 100m, 2),
                "FixedAmount" => appliedOffer.DiscountValue,
                _             => 0m,
            };
        }

        // Delivery fee — from branch config; FreeShipping coupon waives it
        var deliveryFee = (request.OrderType == "Delivery" && branch.DeliveryFeeEnabled) ? branch.DeliveryFee : 0m;
        if (appliedOffer?.DiscountType == "FreeShipping") deliveryFee = 0m;

        var taxed = Math.Max(subtotal - discount, 0m);
        var tax   = 0m;
        var total = taxed + deliveryFee;

        // Resolve scheduled date — validate against today and advance booking window
        var today = DenmarkTime.Today;
        if (!DateOnly.TryParseExact(request.ScheduledDate, "yyyy-MM-dd", out var scheduledDate))
            throw new InvalidOperationException("Invalid ScheduledDate format. Use yyyy-MM-dd.");

        if (scheduledDate < today)
            throw new InvalidOperationException("Scheduled date cannot be in the past.");

        var maxDate = today.AddDays(branch.MaxAdvanceDays);
        if (scheduledDate > maxDate)
            throw new InvalidOperationException(
                $"This branch only accepts advance orders up to {branch.MaxAdvanceDays} day(s) ahead.");

        // Persist order
        var order = new Order
        {
            UserId          = userId,
            BranchId        = request.BranchId,
            OrderType       = request.OrderType,
            Subtotal        = subtotal,
            DeliveryFee     = deliveryFee,
            Tax             = tax,
            Discount        = discount,
            Total           = total,
            Status          = "Placed",
            ContactName     = $"{request.Firstname?.Trim()} {request.Lastname?.Trim()}".Trim(),
            ContactPhone    = request.Phone?.Trim() ?? string.Empty,
            ContactEmail    = request.Email.Trim(),
            DeliveryAddress      = string.IsNullOrWhiteSpace(request.DeliveryAddress) ? null : request.DeliveryAddress.Trim(),
            PaymentMethod        = request.OrderType == "Delivery" ? "CashOnDelivery" : "PayAtStore",
            ScheduledDate        = scheduledDate,
            ScheduledTime        = request.ScheduledTime,
            SpecialInstructions  = string.IsNullOrWhiteSpace(request.SpecialInstructions) ? null : request.SpecialInstructions.Trim(),
            CreatedAt            = DenmarkTime.Now,
        };
        _db.Orders.Add(order);
        await _db.SaveChangesAsync(); // generates order.Id

        // Look up menu names and categories for items
        var menuItemMeta = await _db.MenuItems
            .Where(m => itemIds.Contains(m.Id))
            .AsNoTracking()
            .Select(m => new { m.Id, m.Name, m.ImageUrl })
            .ToDictionaryAsync(m => m.Id);

        // MenuId per item (take first mapping)
        var menuMappings = await _db.MenuItemsMappings
            .Where(m => itemIds.Contains(m.MenuItemId))
            .AsNoTracking()
            .Select(m => new { m.MenuItemId, m.MenuId })
            .ToListAsync();

        var menuIdByItem = menuMappings
            .GroupBy(m => m.MenuItemId)
            .ToDictionary(g => g.Key, g => g.First().MenuId);

        var orderItems = request.Items.Select(i => new OrderItem
        {
            OrderId         = order.Id,
            MenuItemId      = i.MenuItemId,
            MenuId          = menuIdByItem.GetValueOrDefault(i.MenuItemId, 1L),
            Quantity        = i.Quantity,
            PriceAtPurchase = prices[i.MenuItemId],
        }).ToList();

        _db.OrderItems.AddRange(orderItems);

        _db.OrderStatusHistories.Add(new Domain.Entities.OrderStatusHistory
        {
            OrderId   = order.Id,
            Status    = "Placed",
        });

        if (appliedOffer is not null)
        {
            _db.OrderAppliedOffers.Add(new OrderAppliedOffer
            {
                OrderId               = order.Id,
                OfferId               = appliedOffer.Id,
                AppliedDiscountAmount = discount,
            });
            appliedOffer.UsageCount++;
        }

        await _db.SaveChangesAsync();

        var itemDtos = orderItems
            .Select(oi =>
            {
                var meta = menuItemMeta.GetValueOrDefault(oi.MenuItemId);
                return new OrderItemDto(
                    oi.MenuItemId,
                    meta?.Name ?? "Unknown",
                    meta?.ImageUrl ?? "",
                    oi.Quantity,
                    oi.PriceAtPurchase);
            })
            .ToList();

        var dto = new OrderDto(order.Id, order.OrderType, branch.Name,
            order.Subtotal, order.DeliveryFee, order.Tax, order.Discount, order.Total,
            order.Status, order.CreatedAt, itemDtos, appliedOffer?.CouponCode,
            order.ContactName, order.ContactPhone, order.ContactEmail,
            order.DeliveryAddress, order.PaymentMethod,
            order.ScheduledDate, order.ScheduledTime, order.SpecialInstructions,
            order.CancellationReason);

        // Case 3 only: new guest account — credentials arrive before the order confirmation
        if (sendCredentials)
            _ = _email.SendNewCustomerCredentialsAsync(credentialsEmail!, credentialsName, credentialsPwd!);

        // Customer confirmation
        _ = _email.SendOrderConfirmationAsync(order.ContactEmail!, order.ContactName, dto);

        // Admin notification (always — goes to AdminToMail + BCC list)
        _ = _email.SendAdminOrderNotificationAsync(dto);

        return dto;
    }

    public async Task<OrderDto> GetOrderByIdAsync(long orderId, long userId)
    {
        var order = await _db.Orders
            .Include(o => o.Branch)
            .Include(o => o.OrderItems).ThenInclude(oi => oi.MenuItem)
            .Include(o => o.AppliedOffers).ThenInclude(ao => ao.Offer)
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId)
            ?? throw new InvalidOperationException("Order not found.");

        return ToDto(order);
    }

    public async Task<IReadOnlyList<OrderDto>> GetMyOrdersAsync(long userId)
    {
        var orders = await _db.Orders
            .Where(o => o.UserId == userId)
            .Include(o => o.Branch)
            .Include(o => o.OrderItems).ThenInclude(oi => oi.MenuItem)
            .Include(o => o.AppliedOffers).ThenInclude(ao => ao.Offer)
            .OrderByDescending(o => o.CreatedAt)
            .AsNoTracking()
            .ToListAsync();

        return orders.Select(ToDto).ToList();
    }

    private static OrderDto ToDto(Order o)
    {
        var couponCode = o.AppliedOffers.FirstOrDefault()?.Offer?.CouponCode;
        var items = o.OrderItems
            .Select(oi => new OrderItemDto(
                oi.MenuItemId,
                oi.MenuItem.Name,
                oi.MenuItem.ImageUrl,
                oi.Quantity,
                oi.PriceAtPurchase))
            .ToList();

        return new OrderDto(o.Id, o.OrderType, o.Branch.Name,
            o.Subtotal, o.DeliveryFee, o.Tax, o.Discount, o.Total,
            o.Status, o.CreatedAt, items, couponCode,
            o.ContactName, o.ContactPhone, o.ContactEmail,
            o.DeliveryAddress, o.PaymentMethod,
            o.ScheduledDate, o.ScheduledTime, o.SpecialInstructions,
            o.CancellationReason);
    }
}
