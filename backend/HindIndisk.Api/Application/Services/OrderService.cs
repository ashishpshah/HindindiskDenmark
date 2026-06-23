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

    public async Task<OrderDto> CreateOrderAsync(CreateOrderRequest request)
    {
        // Resolve (or create) the customer — UserId always comes from phone lookup
        var customer = await _customers.FindOrCreateAsync(
            request.Firstname, request.Lastname, request.Phone, request.Email);
        var userId = customer.Id;

        if (request.OrderType == "Delivery" && string.IsNullOrWhiteSpace(request.DeliveryAddress))
            throw new InvalidOperationException("Delivery address is required for delivery orders.");

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
                    && o.StartDate <= DateTime.UtcNow && o.EndDate >= DateTime.UtcNow);

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

        // Delivery fee (FreeShipping coupon waives it)
        var deliveryFee = request.OrderType == "Delivery" ? 39m : 0m;
        if (appliedOffer?.DiscountType == "FreeShipping") deliveryFee = 0m;

        // Match CartContext display formula exactly:
        // taxed = subtotal – discount; tax = taxed × 0.25; total = taxed + tax + delivery
        var taxed = Math.Max(subtotal - discount, 0m);
        var tax   = Math.Round(taxed * 0.25m, 2);
        var total = taxed + tax + deliveryFee;

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
            ContactName     = $"{request.Firstname.Trim()} {request.Lastname.Trim()}",
            ContactPhone    = request.Phone.Trim(),
            ContactEmail    = request.Email.Trim(),
            DeliveryAddress = string.IsNullOrWhiteSpace(request.DeliveryAddress) ? null : request.DeliveryAddress.Trim(),
            PaymentMethod   = "CashOnDelivery",
            CreatedAt       = DateTime.UtcNow,
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

        var branch = await _db.Branches
            .Where(b => b.Id == request.BranchId)
            .AsNoTracking()
            .Select(b => b.Name)
            .FirstOrDefaultAsync() ?? "";

        var dto = new OrderDto(order.Id, order.OrderType, branch,
            order.Subtotal, order.DeliveryFee, order.Tax, order.Discount, order.Total,
            order.Status, order.CreatedAt, itemDtos, appliedOffer?.CouponCode,
            order.ContactName, order.ContactPhone, order.ContactEmail,
            order.DeliveryAddress, order.PaymentMethod);

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
            o.DeliveryAddress, o.PaymentMethod);
    }
}
