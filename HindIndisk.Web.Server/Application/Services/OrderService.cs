using HindIndisk.Api.Application.DTOs.Order;
using HindIndisk.Api.Domain.Entities;
using HindIndisk.Api.Hubs;
using HindIndisk.Api.Infrastructure;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace HindIndisk.Api.Application.Services;

public class OrderService : IOrderService
{
    private readonly ApplicationDbContext _db;
    private readonly IEmailService _email;
    private readonly ICustomerService _customers;
    private readonly BranchClosureService _closures;
    private readonly IHubContext<AdminHub> _adminHub;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<OrderService> _logger;

    public OrderService(ApplicationDbContext db, IEmailService email, ICustomerService customers,
        BranchClosureService closures, IHubContext<AdminHub> adminHub,
        IServiceScopeFactory scopeFactory, ILogger<OrderService> logger)
    {
        _db           = db;
        _email        = email;
        _customers    = customers;
        _closures     = closures;
        _adminHub     = adminHub;
        _scopeFactory = scopeFactory;
        _logger       = logger;
    }

    public async Task<OrderDto> CreateOrderAsync(CreateOrderRequest request, long? loggedInUserId = null)
    {
        long   userId = loggedInUserId ?? 0;
        bool   sendCredentials  = false;
        string? credentialsPwd  = null;
        string? credentialsEmail = null;
        string  credentialsName  = string.Empty;

        // Resolve the name of the admin/staff member who placed this order (if any)
        string? placedByName = null;
        if (loggedInUserId.HasValue)
        {
            var placer =await _db.Users.AsNoTracking()
                .Where(u => u.Id == loggedInUserId.Value)
                .Select(u => new { u.Firstname, u.Lastname })
                .FirstOrDefaultAsync();
            if (placer is not null)
                placedByName = $"{placer.Firstname} {placer.Lastname}".Trim();
        }

        if (request.OrderType == "Delivery" && string.IsNullOrWhiteSpace(request.DeliveryAddress))
            throw new InvalidOperationException("Delivery address is required for delivery orders.");

        var branch = await _db.Branches.AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == request.BranchId)
            ?? throw new InvalidOperationException("Branch not found.");

        if (branch.IsCloseOrder)
            throw new InvalidOperationException("Online orders are temporarily suspended for this branch.");

        var scheduledDateOnly   = DateOnly.Parse(request.ScheduledDate);
        var closureServiceScope = request.OrderType == "Delivery" ? "Delivery" : "Pickup";
        if (await _closures.IsClosedAsync(request.BranchId, scheduledDateOnly, closureServiceScope) is not null)
            throw new InvalidOperationException("The restaurant is closed on the selected date.");


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
                    .AnyAsync(o => o.ContactEmail == request.Email.Trim() && o.Status != "Cancelled");
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

        // Delivery fee (Delivery orders) or bag/pose charge (Pickup orders) — from branch config;
        // FreeShipping coupon waives whichever surcharge applies. Stored in Order.DeliveryFee either way.
        var deliveryFee = request.OrderType == "Delivery"
            ? (branch.DeliveryFeeEnabled ? branch.DeliveryFee : 0m)
            : (branch.BagChargeEnabled  ? branch.BagCharge  : 0m);
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

        // Scheduled/recurring closure for this fulfillment type (also blocks whole-branch closures)
        var closure = await _closures.IsClosedAsync(request.BranchId, scheduledDate, request.OrderType);
        if (closure is not null)
            throw new InvalidOperationException(
                request.OrderType == "Delivery"
                    ? "Delivery is not available on the selected date."
                    : "Pickup is not available on the selected date.");

        var newStatus = await _db.OrderStatuses
            .FirstAsync(s => s.Name == "New" && s.IsActive);

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
            Status          = "New",
            OrderStatusId   = newStatus.Id,
            ContactName     = $"{request.Firstname?.Trim()} {request.Lastname?.Trim()}".Trim(),
            ContactPhone    = request.Phone?.Trim() ?? string.Empty,
            ContactEmail    = request.Email.Trim(),
            DeliveryAddress      = string.IsNullOrWhiteSpace(request.DeliveryAddress) ? null : request.DeliveryAddress.Trim(),
            PaymentMethod        = request.OrderType == "Delivery" ? "CashOnDelivery" : "PayAtStore",
            ScheduledDate        = scheduledDate,
            ScheduledTime        = request.ScheduledTime,
            SpecialInstructions  = string.IsNullOrWhiteSpace(request.SpecialInstructions) ? null : request.SpecialInstructions.Trim(),
            CreatedAt            = DenmarkTime.Now,
            PlacedByUserId       = loggedInUserId,
        };
        _db.Orders.Add(order);
        await _db.SaveChangesAsync(); // generates order.Id

        // Look up menu names and categories for items
        var menuItemMeta = await _db.MenuItems
            .Where(m => itemIds.Contains(m.Id))
            .AsNoTracking()
            .Select(m => new { m.Id, m.Code, m.Name, m.NameDa, m.ImageUrl })
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
            Status    = "New",
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
                    meta?.Code,
                    meta?.Name ?? "Unknown",
                    meta?.NameDa,
                    meta?.ImageUrl ?? "",
                    oi.Quantity,
                    oi.PriceAtPurchase);
            })
            .ToList();

        var dto = new OrderDto(order.Id, order.OrderType, branch.Name, branch.Id,
            order.Subtotal, order.DeliveryFee, order.Tax, order.Discount, order.Total,
            order.Status, newStatus.Color, newStatus.NameDa, order.CreatedAt, itemDtos, appliedOffer?.CouponCode,
            order.ContactName, order.ContactPhone, order.ContactEmail,
            order.DeliveryAddress, order.PaymentMethod,
            order.ScheduledDate, order.ScheduledTime, order.SpecialInstructions,
            order.CancellationReason, placedByName, order.UserId, null);

        // Real-time admin notification — fire-and-forget is safe here (SignalR hub, no scoped services)
        _ = _adminHub.Clients.Group(AdminHub.GroupName)
                .SendAsync("NewOrder", new { order.Id, order.Status, order.ContactName, order.Total });

        // Emails are dispatched on a background task with their own DI scope so the HTTP
        // response isn't blocked on SMTP round-trips. Can't reuse this request's _email/_db —
        // their scope is disposed as soon as this method returns.
        var orderId = order.Id;
        _ = Task.Run(async () =>
        {
            using var scope = _scopeFactory.CreateScope();
            var email = scope.ServiceProvider.GetRequiredService<IEmailService>();
            try
            {
                // Case 3 only: new guest account — credentials arrive before the order confirmation
                if (sendCredentials)
                    await email.SendNewCustomerCredentialsAsync(credentialsEmail!, credentialsName, credentialsPwd!);

                await email.SendOrderConfirmationAsync(order.ContactEmail!, order.ContactName, dto);
                await email.SendAdminOrderNotificationAsync(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background email dispatch failed for order #{OrderId}", orderId);
            }
        });

        return dto;
    }

    public async Task<OrderDto> GetOrderByIdAsync(long orderId, long userId)
    {
        var order = await _db.Orders
            .Include(o => o.Branch)
            .Include(o => o.OrderStatus)
            .Include(o => o.OrderItems).ThenInclude(oi => oi.MenuItem)
            .Include(o => o.AppliedOffers).ThenInclude(ao => ao.Offer)
            .Include(o => o.PlacedByUser)
            .Include(o => o.User)
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId)
            ?? throw new KeyNotFoundException("Order not found.");

        return ToDto(order);
    }

    public async Task<IReadOnlyList<OrderDto>> GetMyOrdersAsync(long userId)
    {
            var userEmail = await _db.Users.AsNoTracking()
                .Where(u => u.Id == userId)
                .Select(u => u.Email)
                .FirstOrDefaultAsync();

        var orders = await _db.Orders
            .Where(o => o.UserId == userId || o.ContactEmail == userEmail)
            .Include(o => o.Branch)
            .Include(o => o.OrderStatus)
            .Include(o => o.OrderItems).ThenInclude(oi => oi.MenuItem)
            .Include(o => o.AppliedOffers).ThenInclude(ao => ao.Offer)
            .Include(o => o.PlacedByUser)
            .Include(o => o.User)
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
                oi.MenuItem.Code,
                oi.MenuItem.Name,
                oi.MenuItem.NameDa,
                oi.MenuItem.ImageUrl,
                oi.Quantity,
                oi.PriceAtPurchase))
            .ToList();

        var placedByName = o.PlacedByUser is null
            ? null
            : $"{o.PlacedByUser.Firstname} {o.PlacedByUser.Lastname}".Trim();

        var ownerName = o.User is null
            ? null
            : $"{o.User.Firstname} {o.User.Lastname}".Trim();

        return new OrderDto(o.Id, o.OrderType, o.Branch.Name, o.BranchId,
            o.Subtotal, o.DeliveryFee, o.Tax, o.Discount, o.Total,
            o.Status, o.OrderStatus?.Color, o.OrderStatus?.NameDa, o.CreatedAt, items, couponCode,
            o.ContactName, o.ContactPhone, o.ContactEmail,
            o.DeliveryAddress, o.PaymentMethod,
            o.ScheduledDate, o.ScheduledTime, o.SpecialInstructions,
            o.CancellationReason, placedByName, o.UserId, ownerName);
    }
}
