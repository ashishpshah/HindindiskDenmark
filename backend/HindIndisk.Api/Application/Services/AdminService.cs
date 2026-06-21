using HindIndisk.Api.Application.DTOs.Admin;
using HindIndisk.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace HindIndisk.Api.Application.Services;

public class AdminService : IAdminService
{
    private static readonly HashSet<string> ValidOrderStatuses =
        ["Placed", "Accepted", "Preparing", "Ready", "OutForDelivery", "Completed", "Cancelled"];

    private static readonly HashSet<string> ValidReservationStatuses =
        ["Confirmed", "Cancelled"];

    private readonly ApplicationDbContext _db;

    public AdminService(ApplicationDbContext db) => _db = db;

    // ── Dashboard ─────────────────────────────────────────────────────────────

    public async Task<AdminDashboardDto> GetDashboardAsync()
    {
        var today      = DateTime.UtcNow.Date;
        var tomorrow   = today.AddDays(1);

        var todayOrders    = await _db.Orders.CountAsync(o => o.CreatedAt >= today && o.CreatedAt < tomorrow);
        var todayRevenue   = await _db.Orders
                                .Where(o => o.CreatedAt >= today && o.CreatedAt < tomorrow && o.Status != "Cancelled")
                                .SumAsync(o => (decimal?)o.Total) ?? 0m;
        var pendingOrders  = await _db.Orders.CountAsync(o =>
                                o.Status == "Placed" || o.Status == "Accepted" || o.Status == "Preparing");
        var todayReservations = await _db.Reservations
                                    .CountAsync(r => r.Date >= today && r.Date < tomorrow);
        var totalOrders    = await _db.Orders.CountAsync();

        return new AdminDashboardDto(todayOrders, todayRevenue, pendingOrders, todayReservations, totalOrders);
    }

    // ── Orders ────────────────────────────────────────────────────────────────

    public async Task<IReadOnlyList<AdminOrderDto>> GetOrdersAsync(string? status, long? branchId)
    {
        var q = _db.Orders
            .Include(o => o.Branch)
            .Include(o => o.User)
            .Include(o => o.OrderItems)
            .Include(o => o.AppliedOffers).ThenInclude(a => a.Offer)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            q = q.Where(o => o.Status == status);

        if (branchId.HasValue)
            q = q.Where(o => o.BranchId == branchId.Value);

        var orders = await q.OrderByDescending(o => o.CreatedAt).ToListAsync();
        return orders.Select(ToAdminOrderDto).ToList();
    }

    public async Task<AdminOrderDto> UpdateOrderStatusAsync(long orderId, string status)
    {
        if (!ValidOrderStatuses.Contains(status))
            throw new InvalidOperationException($"Invalid status '{status}'.");

        var order = await _db.Orders
            .Include(o => o.Branch)
            .Include(o => o.User)
            .Include(o => o.OrderItems)
            .Include(o => o.AppliedOffers).ThenInclude(a => a.Offer)
            .FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new KeyNotFoundException($"Order {orderId} not found.");

        order.Status = status;
        await _db.SaveChangesAsync();
        return ToAdminOrderDto(order);
    }

    // ── Reservations ──────────────────────────────────────────────────────────

    public async Task<IReadOnlyList<AdminReservationDto>> GetReservationsAsync(string? status, long? branchId, string? date)
    {
        var q = _db.Reservations
            .Include(r => r.Branch)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            q = q.Where(r => r.Status == status);

        if (branchId.HasValue)
            q = q.Where(r => r.BranchId == branchId.Value);

        if (!string.IsNullOrWhiteSpace(date) && DateTime.TryParse(date, out var parsedDate))
            q = q.Where(r => r.Date.Date == parsedDate.Date);

        var reservations = await q.OrderByDescending(r => r.CreatedAt).ToListAsync();
        return reservations.Select(ToAdminReservationDto).ToList();
    }

    public async Task<AdminReservationDto> UpdateReservationStatusAsync(long reservationId, string status)
    {
        if (!ValidReservationStatuses.Contains(status))
            throw new InvalidOperationException($"Invalid status '{status}'.");

        var r = await _db.Reservations
            .Include(r => r.Branch)
            .FirstOrDefaultAsync(r => r.Id == reservationId)
            ?? throw new KeyNotFoundException($"Reservation {reservationId} not found.");

        r.Status = status;
        await _db.SaveChangesAsync();
        return ToAdminReservationDto(r);
    }

    // ── Menu items ────────────────────────────────────────────────────────────

    public async Task<IReadOnlyList<AdminMenuItemDto>> GetMenuItemsAsync()
    {
        var items = await _db.MenuItems
            .Include(i => i.MenuItemLabels).ThenInclude(l => l.Label)
            .Include(i => i.MenuItemsMappings).ThenInclude(m => m.Menu)
            .Include(i => i.BranchMenuItemPrices).ThenInclude(p => p.Branch)
            .AsNoTracking()
            .OrderBy(i => i.Name)
            .ToListAsync();

        return items.Select(ToAdminMenuItemDto).ToList();
    }

    public async Task<AdminMenuItemDto> UpdateMenuItemAsync(long itemId, UpdateMenuItemRequest request)
    {
        var item = await _db.MenuItems
            .Include(i => i.MenuItemLabels).ThenInclude(l => l.Label)
            .Include(i => i.MenuItemsMappings).ThenInclude(m => m.Menu)
            .Include(i => i.BranchMenuItemPrices).ThenInclude(p => p.Branch)
            .FirstOrDefaultAsync(i => i.Id == itemId)
            ?? throw new KeyNotFoundException($"Menu item {itemId} not found.");

        item.Name        = request.Name;
        item.Description = request.Description;
        item.ImageUrl    = request.ImageUrl;
        item.SpicyLevel  = request.SpicyLevel;
        await _db.SaveChangesAsync();

        return ToAdminMenuItemDto(item);
    }

    public async Task<AdminMenuItemDto> UpdateMenuItemPricesAsync(long itemId, UpdateMenuItemPricesRequest request)
    {
        var item = await _db.MenuItems
            .Include(i => i.MenuItemLabels).ThenInclude(l => l.Label)
            .Include(i => i.MenuItemsMappings).ThenInclude(m => m.Menu)
            .Include(i => i.BranchMenuItemPrices).ThenInclude(p => p.Branch)
            .FirstOrDefaultAsync(i => i.Id == itemId)
            ?? throw new KeyNotFoundException($"Menu item {itemId} not found.");

        foreach (var input in request.Prices)
        {
            var existing = item.BranchMenuItemPrices
                .FirstOrDefault(p => p.BranchId == input.BranchId);

            if (existing is not null)
                existing.Price = input.Price;
            else
                item.BranchMenuItemPrices.Add(new Domain.Entities.BranchMenuItemPrice
                {
                    BranchId   = input.BranchId,
                    MenuItemId = itemId,
                    Price      = input.Price,
                });
        }

        await _db.SaveChangesAsync();
        return ToAdminMenuItemDto(item);
    }

    // ── Offers ────────────────────────────────────────────────────────────────

    public async Task<IReadOnlyList<AdminOfferDto>> GetOffersAsync()
    {
        var offers = await _db.Offers
            .AsNoTracking()
            .OrderByDescending(o => o.StartDate)
            .ToListAsync();

        return offers.Select(ToAdminOfferDto).ToList();
    }

    public async Task<AdminOfferDto> CreateOfferAsync(CreateOfferRequest request)
    {
        var offer = new Domain.Entities.Offer
        {
            Title              = request.Title,
            Description        = request.Description,
            OfferType          = string.IsNullOrWhiteSpace(request.CouponCode) ? "Direct" : "Coupon",
            DiscountType       = request.DiscountType,
            DiscountValue      = request.DiscountValue,
            CouponCode         = request.CouponCode?.Trim().ToUpper(),
            MinimumOrderAmount = request.MinimumOrderAmount,
            UsageLimit         = request.UsageLimit,
            StartDate          = request.StartDate,
            EndDate            = request.EndDate,
            IsActive           = true,
        };

        _db.Offers.Add(offer);
        await _db.SaveChangesAsync();
        return ToAdminOfferDto(offer);
    }

    public async Task<AdminOfferDto> UpdateOfferAsync(long offerId, UpdateOfferRequest request)
    {
        var offer = await _db.Offers.FindAsync(offerId)
            ?? throw new KeyNotFoundException($"Offer {offerId} not found.");

        offer.Title              = request.Title;
        offer.Description        = request.Description;
        offer.DiscountType       = request.DiscountType;
        offer.DiscountValue      = request.DiscountValue;
        offer.CouponCode         = request.CouponCode?.Trim().ToUpper();
        offer.MinimumOrderAmount = request.MinimumOrderAmount;
        offer.UsageLimit         = request.UsageLimit;
        offer.StartDate          = request.StartDate;
        offer.EndDate            = request.EndDate;

        await _db.SaveChangesAsync();
        return ToAdminOfferDto(offer);
    }

    public async Task<AdminOfferDto> ToggleOfferAsync(long offerId)
    {
        var offer = await _db.Offers.FindAsync(offerId)
            ?? throw new KeyNotFoundException($"Offer {offerId} not found.");

        offer.IsActive = !offer.IsActive;
        await _db.SaveChangesAsync();
        return ToAdminOfferDto(offer);
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private static AdminOrderDto ToAdminOrderDto(Domain.Entities.Order o)
    {
        var coupon = o.AppliedOffers.FirstOrDefault()?.Offer.CouponCode;
        return new AdminOrderDto(
            o.Id,
            $"{o.User.Firstname} {o.User.Lastname}".Trim(),
            o.User.Email,
            o.OrderType,
            o.Branch.Name,
            o.Subtotal,
            o.DeliveryFee,
            o.Discount,
            o.Tax,
            o.Total,
            o.Status,
            o.CreatedAt,
            o.OrderItems.Sum(i => i.Quantity),
            coupon
        );
    }

    private static AdminReservationDto ToAdminReservationDto(Domain.Entities.Reservation r) =>
        new(
            r.Id,
            r.Branch.Name,
            r.Date.ToString("yyyy-MM-dd"),
            r.TimeSlot,
            r.GuestCount,
            r.ContactName,
            r.ContactPhone,
            r.ContactEmail,
            r.SpecialRequests,
            r.Status,
            r.CreatedAt,
            r.UserId.HasValue
        );

    private static AdminMenuItemDto ToAdminMenuItemDto(Domain.Entities.MenuItem i)
    {
        var labels     = i.MenuItemLabels.Select(l => l.Label.Name).ToList();
        var categories = i.MenuItemsMappings.Select(m => m.Menu.Name).Distinct().ToList();
        var prices     = i.BranchMenuItemPrices
                          .Select(p => new AdminBranchPriceDto(p.BranchId, p.Branch.Name, p.Price))
                          .ToList();
        return new AdminMenuItemDto(
            i.Id, i.Name, i.Description, i.ImageUrl, i.SpicyLevel,
            labels, labels.Contains("Vegetarian"), categories, prices);
    }

    private static AdminOfferDto ToAdminOfferDto(Domain.Entities.Offer o) =>
        new(o.Id, o.Title, o.Description, o.OfferType, o.DiscountType,
            o.DiscountValue, o.CouponCode, o.MinimumOrderAmount,
            o.IsAutoApply, o.UsageLimit, o.UsageCount,
            o.StartDate, o.EndDate, o.IsActive);

    // ── Customers ─────────────────────────────────────────────────────────────

    public async Task<IReadOnlyList<AdminCustomerDto>> GetCustomersAsync(string? q)
    {
        var query = _db.Users
            .Include(u => u.Role)
            .Where(u => u.Role.Name == "Customer")
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var lower = q.ToLower();
            query = query.Where(u =>
                u.Firstname.ToLower().Contains(lower) ||
                u.Lastname.ToLower().Contains(lower)  ||
                u.Email.ToLower().Contains(lower));
        }

        var users = await query.AsNoTracking().OrderByDescending(u => u.CreatedAt).ToListAsync();
        var userIds = users.Select(u => u.Id).ToList();

        var orderStats = await _db.Orders
            .Where(o => userIds.Contains(o.UserId))
            .GroupBy(o => o.UserId)
            .Select(g => new
            {
                UserId     = g.Key,
                Count      = g.Count(),
                TotalSpend = g.Where(o => o.Status != "Cancelled").Sum(o => (decimal?)o.Total) ?? 0m,
            })
            .AsNoTracking()
            .ToDictionaryAsync(x => x.UserId);

        var reservationCounts = await _db.Reservations
            .Where(r => r.UserId.HasValue && userIds.Contains(r.UserId!.Value))
            .GroupBy(r => r.UserId!.Value)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .AsNoTracking()
            .ToDictionaryAsync(x => x.UserId);

        return users.Select(u =>
        {
            var os = orderStats.GetValueOrDefault(u.Id);
            var rs = reservationCounts.GetValueOrDefault(u.Id);
            return new AdminCustomerDto(
                u.Id,
                $"{u.Firstname} {u.Lastname}".Trim(),
                u.Email,
                u.Phone,
                u.CreatedAt,
                os?.Count ?? 0,
                rs?.Count ?? 0,
                os?.TotalSpend ?? 0m
            );
        }).ToList();
    }

    public async Task<AdminCustomerDetailDto> GetCustomerDetailAsync(long customerId)
    {
        var user = await _db.Users
            .Include(u => u.Role)
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == customerId)
            ?? throw new KeyNotFoundException($"Customer {customerId} not found.");

        var orders = await _db.Orders
            .Include(o => o.Branch)
            .Include(o => o.OrderItems)
            .Where(o => o.UserId == customerId)
            .OrderByDescending(o => o.CreatedAt)
            .AsNoTracking()
            .ToListAsync();

        var reservationCount = await _db.Reservations
            .CountAsync(r => r.UserId == customerId);

        var totalSpend = orders
            .Where(o => o.Status != "Cancelled")
            .Sum(o => o.Total);

        var customerDto = new AdminCustomerDto(
            user.Id,
            $"{user.Firstname} {user.Lastname}".Trim(),
            user.Email,
            user.Phone,
            user.CreatedAt,
            orders.Count,
            reservationCount,
            totalSpend
        );

        var orderDtos = orders.Select(o => new AdminCustomerOrderDto(
            o.Id, o.Branch.Name, o.OrderType, o.Total, o.Status, o.CreatedAt,
            o.OrderItems.Sum(i => i.Quantity)
        )).ToList();

        return new AdminCustomerDetailDto(customerDto, orderDtos);
    }
}
