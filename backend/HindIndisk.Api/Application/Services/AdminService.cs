using HindIndisk.Api.Application.DTOs.Admin;
using HindIndisk.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace HindIndisk.Api.Application.Services;

public class AdminService : IAdminService
{
    private static readonly HashSet<string> ValidOrderStatuses =
        ["Placed", "Accepted", "Preparing", "Ready", "OutForDelivery", "Completed", "Cancelled"];

    private static readonly HashSet<string> ValidReservationStatuses =
        ["Pending", "Confirmed", "Cancelled"];

    private readonly ApplicationDbContext _db;
    private readonly IEmailService _email;

    public AdminService(ApplicationDbContext db, IEmailService email)
    {
        _db    = db;
        _email = email;
    }

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
        var totalRevenue   = await _db.Orders
                                .Where(o => o.Status != "Cancelled")
                                .SumAsync(o => (decimal?)o.Total) ?? 0m;

        return new AdminDashboardDto(todayOrders, todayRevenue, pendingOrders, todayReservations, totalOrders, totalRevenue);
    }

    // ── Orders ────────────────────────────────────────────────────────────────

    public async Task<IReadOnlyList<AdminOrderDto>> GetOrdersAsync(string? status, long? branchId)
    {
        var q = _db.Orders
            .Include(o => o.Branch)
            .Include(o => o.User)
            .Include(o => o.OrderItems).ThenInclude(i => i.MenuItem)
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
            .Include(o => o.OrderItems).ThenInclude(i => i.MenuItem)
            .Include(o => o.AppliedOffers).ThenInclude(a => a.Offer)
            .FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new KeyNotFoundException($"Order {orderId} not found.");

        order.Status = status;
        await _db.SaveChangesAsync();

        // Notify customer of status change
        var email = order.User?.Email ?? order.ContactEmail;
        if (!string.IsNullOrWhiteSpace(email))
        {
            var name = string.IsNullOrWhiteSpace(order.ContactName) ? "Customer" : order.ContactName;
            _ = _email.SendOrderStatusUpdateAsync(email, name, order.Id, status);
        }

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

        // Notify customer of status change
        if (!string.IsNullOrWhiteSpace(r.ContactEmail))
            _ = _email.SendReservationStatusUpdateAsync(
                r.ContactEmail, r.ContactName,
                r.Id, r.Branch.Name,
                r.Date.ToString("yyyy-MM-dd"), r.TimeSlot, r.GuestCount,
                status);

        return ToAdminReservationDto(r);
    }

    // ── Menus (categories) ───────────────────────────────────────────────────

    private async Task<Domain.Entities.Menu> LoadFullMenuAsync(long menuId) =>
        await _db.Menus
            .Include(m => m.MenuItemsMappings).ThenInclude(mm => mm.MenuItem)
                .ThenInclude(i => i.BranchMenuItemPrices)
            .Include(m => m.BranchMenus)
            .FirstAsync(m => m.Id == menuId);

    private void SyncBranchMenus(Domain.Entities.Menu menu, IEnumerable<long> requestedIds)
    {
        var desired = new HashSet<long>(requestedIds);
        var current = menu.BranchMenus.Select(bm => bm.BranchId).ToHashSet();

        foreach (var remove in current.Except(desired))
        {
            var bm = menu.BranchMenus.First(x => x.BranchId == remove);
            _db.Set<Domain.Entities.BranchMenu>().Remove(bm);
        }
        foreach (var add in desired.Except(current))
        {
            _db.Set<Domain.Entities.BranchMenu>().Add(
                new Domain.Entities.BranchMenu { BranchId = add, MenuId = menu.Id });
        }
    }

    public async Task<IReadOnlyList<AdminMenuDto>> GetMenusAsync()
    {
        var menus = await _db.Menus
            .Include(m => m.MenuItemsMappings).ThenInclude(mm => mm.MenuItem)
                .ThenInclude(i => i.BranchMenuItemPrices)
            .Include(m => m.BranchMenus)
            .AsNoTracking()
            .OrderBy(m => m.Name)
            .ToListAsync();

        return menus.Select(ToAdminMenuDto).ToList();
    }

    public async Task<AdminMenuDto> CreateMenuAsync(CreateMenuRequest request)
    {
        var menu = new Domain.Entities.Menu
        {
            Name          = request.Name.Trim(),
            NameDa        = request.NameDa?.Trim() ?? string.Empty,
            Description   = request.Description?.Trim() ?? string.Empty,
            DescriptionDa = request.DescriptionDa?.Trim() ?? string.Empty,
            IsActive      = true,
        };
        _db.Menus.Add(menu);
        await _db.SaveChangesAsync();

        foreach (var branchId in request.BranchIds.Distinct())
            _db.Set<Domain.Entities.BranchMenu>().Add(
                new Domain.Entities.BranchMenu { BranchId = branchId, MenuId = menu.Id });
        await _db.SaveChangesAsync();

        return ToAdminMenuDto(await LoadFullMenuAsync(menu.Id));
    }

    public async Task<AdminMenuDto> UpdateMenuAsync(long menuId, UpdateMenuRequest request)
    {
        var menu = await _db.Menus
            .Include(m => m.MenuItemsMappings).ThenInclude(mm => mm.MenuItem)
                .ThenInclude(i => i.BranchMenuItemPrices)
            .Include(m => m.BranchMenus)
            .FirstOrDefaultAsync(m => m.Id == menuId)
            ?? throw new KeyNotFoundException($"Menu {menuId} not found.");

        menu.Name          = request.Name.Trim();
        menu.NameDa        = request.NameDa?.Trim() ?? string.Empty;
        menu.Description   = request.Description?.Trim() ?? string.Empty;
        menu.DescriptionDa = request.DescriptionDa?.Trim() ?? string.Empty;
        SyncBranchMenus(menu, request.BranchIds);
        await _db.SaveChangesAsync();
        return ToAdminMenuDto(menu);
    }

    public async Task<AdminMenuDto> ToggleMenuAsync(long menuId)
    {
        var menu = await _db.Menus
            .Include(m => m.MenuItemsMappings).ThenInclude(mm => mm.MenuItem)
                .ThenInclude(i => i.BranchMenuItemPrices)
            .Include(m => m.BranchMenus)
            .FirstOrDefaultAsync(m => m.Id == menuId)
            ?? throw new KeyNotFoundException($"Menu {menuId} not found.");

        menu.IsActive = !menu.IsActive;
        await _db.SaveChangesAsync();
        return ToAdminMenuDto(menu);
    }

    public async Task DeleteMenuAsync(long menuId)
    {
        var menu = await _db.Menus.FindAsync(menuId)
            ?? throw new KeyNotFoundException($"Menu {menuId} not found.");
        _db.Menus.Remove(menu);
        await _db.SaveChangesAsync();
    }

    public async Task<AdminMenuDto> AddItemToMenuAsync(long menuId, long itemId)
    {
        var exists = await _db.MenuItemsMappings
            .AnyAsync(m => m.MenuId == menuId && m.MenuItemId == itemId);

        if (!exists)
        {
            var maxSort = await _db.MenuItemsMappings
                .Where(m => m.MenuId == menuId)
                .Select(m => (int?)m.SortOrder)
                .MaxAsync() ?? 0;

            _db.MenuItemsMappings.Add(new Domain.Entities.MenuItemsMapping
            {
                MenuId     = menuId,
                MenuItemId = itemId,
                SortOrder  = maxSort + 1,
            });
            await _db.SaveChangesAsync();
        }

        return ToAdminMenuDto(await LoadFullMenuAsync(menuId));
    }

    public async Task<AdminMenuDto> RemoveItemFromMenuAsync(long menuId, long itemId)
    {
        var mapping = await _db.MenuItemsMappings
            .FirstOrDefaultAsync(m => m.MenuId == menuId && m.MenuItemId == itemId);

        if (mapping is not null)
        {
            _db.MenuItemsMappings.Remove(mapping);
            await _db.SaveChangesAsync();
        }

        return ToAdminMenuDto(await LoadFullMenuAsync(menuId));
    }

    public async Task<AdminMenuDto> ReorderMenuItemsAsync(long menuId, ReorderMenuItemsRequest request)
    {
        var mappings = await _db.MenuItemsMappings
            .Where(m => m.MenuId == menuId)
            .ToListAsync();

        foreach (var entry in request.Items)
        {
            var mapping = mappings.FirstOrDefault(m => m.MenuItemId == entry.ItemId);
            if (mapping is not null)
                mapping.SortOrder = entry.SortOrder;
        }

        await _db.SaveChangesAsync();
        return ToAdminMenuDto(await LoadFullMenuAsync(menuId));
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

    public async Task<AdminMenuItemDto> CreateMenuItemAsync(CreateMenuItemRequest request)
    {
        var item = new Domain.Entities.MenuItem
        {
            Name          = request.Name.Trim(),
            NameDa        = request.NameDa?.Trim() ?? string.Empty,
            Description   = request.Description?.Trim() ?? string.Empty,
            DescriptionDa = request.DescriptionDa?.Trim() ?? string.Empty,
            ImageUrl      = request.ImageUrl?.Trim() ?? string.Empty,
            SpicyLevel    = request.SpicyLevel,
        };
        _db.MenuItems.Add(item);
        await _db.SaveChangesAsync();

        // Link to menus
        foreach (var menuId in request.MenuIds.Distinct())
        {
            _db.MenuItemsMappings.Add(new Domain.Entities.MenuItemsMapping
            {
                MenuId     = menuId,
                MenuItemId = item.Id,
            });
        }

        // Set branch prices
        foreach (var p in request.Prices)
        {
            _db.BranchMenuItemPrices.Add(new Domain.Entities.BranchMenuItemPrice
            {
                BranchId   = p.BranchId,
                MenuItemId = item.Id,
                Price      = p.Price,
            });
        }

        await _db.SaveChangesAsync();

        // Reload with all includes for the response DTO
        var saved = await _db.MenuItems
            .Include(i => i.MenuItemLabels).ThenInclude(l => l.Label)
            .Include(i => i.MenuItemsMappings).ThenInclude(m => m.Menu)
            .Include(i => i.BranchMenuItemPrices).ThenInclude(p => p.Branch)
            .AsNoTracking()
            .FirstAsync(i => i.Id == item.Id);

        return ToAdminMenuItemDto(saved);
    }

    public async Task<AdminMenuItemDto> UpdateMenuItemAsync(long itemId, UpdateMenuItemRequest request)
    {
        var item = await _db.MenuItems
            .Include(i => i.MenuItemLabels).ThenInclude(l => l.Label)
            .Include(i => i.MenuItemsMappings).ThenInclude(m => m.Menu)
            .Include(i => i.BranchMenuItemPrices).ThenInclude(p => p.Branch)
            .FirstOrDefaultAsync(i => i.Id == itemId)
            ?? throw new KeyNotFoundException($"Menu item {itemId} not found.");

        item.Name          = request.Name;
        item.NameDa        = request.NameDa;
        item.Description   = request.Description;
        item.DescriptionDa = request.DescriptionDa;
        item.ImageUrl      = request.ImageUrl;
        item.SpicyLevel    = request.SpicyLevel;
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

    public async Task DeleteMenuItemAsync(long itemId)
    {
        var item = await _db.MenuItems.FindAsync(itemId)
            ?? throw new KeyNotFoundException($"Menu item {itemId} not found.");
        _db.MenuItems.Remove(item);
        await _db.SaveChangesAsync();
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
            IsFirstOrderOnly   = request.IsFirstOrderOnly,
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
        offer.OfferType          = string.IsNullOrWhiteSpace(request.CouponCode) ? "Direct" : "Coupon";
        offer.DiscountType       = request.DiscountType;
        offer.DiscountValue      = request.DiscountValue;
        offer.CouponCode         = string.IsNullOrWhiteSpace(request.CouponCode) ? null : request.CouponCode.Trim().ToUpper();
        offer.MinimumOrderAmount = request.MinimumOrderAmount;
        offer.IsFirstOrderOnly   = request.IsFirstOrderOnly;
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

    public async Task DeleteOfferAsync(long offerId)
    {
        var offer = await _db.Offers.FindAsync(offerId)
            ?? throw new KeyNotFoundException($"Offer {offerId} not found.");

        _db.Offers.Remove(offer);
        await _db.SaveChangesAsync();
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private static AdminMenuDto ToAdminMenuDto(Domain.Entities.Menu m)
    {
        var items = m.MenuItemsMappings
            .Select(mm =>
            {
                var firstPrice = mm.MenuItem.BranchMenuItemPrices.FirstOrDefault()?.Price;
                return new AdminMenuItemSummaryDto(
                    mm.MenuItem.Id,
                    mm.MenuItem.Name,
                    mm.MenuItem.NameDa,
                    mm.MenuItem.ImageUrl,
                    firstPrice,
                    mm.SortOrder);
            })
            .OrderBy(i => i.SortOrder)
            .ThenBy(i => i.Name)
            .ToList();

        var branchIds = m.BranchMenus.Select(bm => bm.BranchId).ToList();

        return new AdminMenuDto(m.Id, m.Name, m.NameDa, m.Description, m.DescriptionDa, m.IsActive, items.Count, items, branchIds);
    }

    private static AdminOrderDto ToAdminOrderDto(Domain.Entities.Order o)
    {
        var coupon       = o.AppliedOffers.FirstOrDefault()?.Offer?.CouponCode;
        var customerName = o.User is not null
            ? $"{o.User.Firstname} {o.User.Lastname}".Trim()
            : o.ContactName;
        var customerEmail = o.User?.Email ?? o.ContactEmail ?? "";
        var items = o.OrderItems
            .Select(i => new AdminOrderItemDto(i.MenuItem.Name, i.Quantity, i.PriceAtPurchase))
            .ToList();

        return new AdminOrderDto(
            o.Id,
            customerName,
            customerEmail,
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
            coupon,
            o.ContactName,
            o.ContactPhone,
            o.ContactEmail,
            o.DeliveryAddress,
            o.PaymentMethod,
            items
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
            i.Id, i.Name, i.NameDa, i.Description, i.DescriptionDa,
            i.ImageUrl, i.SpicyLevel, labels, labels.Contains("Vegetarian"), categories, prices);
    }

    private static AdminOfferDto ToAdminOfferDto(Domain.Entities.Offer o) =>
        new(o.Id, o.Title, o.Description, o.OfferType, o.DiscountType,
            o.DiscountValue, o.CouponCode, o.MinimumOrderAmount,
            o.IsAutoApply, o.IsFirstOrderOnly, o.UsageLimit, o.UsageCount,
            o.StartDate, o.EndDate, o.IsActive);

    // ── Branches ─────────────────────────────────────────────────────────────

    public async Task<IReadOnlyList<AdminBranchDto>> GetBranchesAsync()
    {
        var branches = await _db.Branches.OrderBy(b => b.Name).ToListAsync();
        return branches.Select(ToAdminBranchDto).ToList();
    }

    public async Task<AdminBranchDto> CreateBranchAsync(CreateBranchRequest request)
    {
        var branch = new Domain.Entities.Branch
        {
            Name             = request.Name,
            AddressLine1     = request.AddressLine1,
            AddressLine2     = request.AddressLine2,
            City             = request.City,
            PostalCode       = request.PostalCode,
            Country          = request.Country,
            Phone            = request.Phone,
            Email            = request.Email,
            GoogleMapsLink   = request.GoogleMapsLink,
            WeekdayOpenTime  = TimeOnly.Parse(request.WeekdayOpen),
            WeekdayCloseTime = TimeOnly.Parse(request.WeekdayClose),
            WeekendOpenTime  = TimeOnly.Parse(request.WeekendOpen),
            WeekendCloseTime = TimeOnly.Parse(request.WeekendClose),
        };

        _db.Branches.Add(branch);
        await _db.SaveChangesAsync();
        return ToAdminBranchDto(branch);
    }

    public async Task<AdminBranchDto> UpdateBranchAsync(long branchId, UpdateBranchRequest request)
    {
        var branch = await _db.Branches.FindAsync(branchId)
            ?? throw new KeyNotFoundException($"Branch {branchId} not found.");

        branch.Name            = request.Name;
        branch.AddressLine1    = request.AddressLine1;
        branch.AddressLine2    = request.AddressLine2;
        branch.City            = request.City;
        branch.PostalCode      = request.PostalCode;
        branch.Country         = request.Country;
        branch.Phone           = request.Phone;
        branch.Email           = request.Email;
        branch.GoogleMapsLink  = request.GoogleMapsLink;
        branch.WeekdayOpenTime  = TimeOnly.Parse(request.WeekdayOpen);
        branch.WeekdayCloseTime = TimeOnly.Parse(request.WeekdayClose);
        branch.WeekendOpenTime  = TimeOnly.Parse(request.WeekendOpen);
        branch.WeekendCloseTime = TimeOnly.Parse(request.WeekendClose);

        await _db.SaveChangesAsync();
        return ToAdminBranchDto(branch);
    }

    private static AdminBranchDto ToAdminBranchDto(Domain.Entities.Branch b) =>
        new(b.Id, b.Name, b.AddressLine1, b.AddressLine2, b.City, b.PostalCode, b.Country,
            b.Phone, b.Email, b.GoogleMapsLink,
            b.WeekdayOpenTime.ToString("HH\\:mm"),  b.WeekdayCloseTime.ToString("HH\\:mm"),
            b.WeekendOpenTime.ToString("HH\\:mm"), b.WeekendCloseTime.ToString("HH\\:mm"));

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
                (u.Email ?? "").ToLower().Contains(lower));
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
                u.Email ?? "",
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
            .Include(o => o.OrderItems).ThenInclude(oi => oi.MenuItem)
            .Where(o => o.UserId == customerId)
            .OrderByDescending(o => o.CreatedAt)
            .AsNoTracking()
            .ToListAsync();

        var reservations = await _db.Reservations
            .Include(r => r.Branch)
            .Where(r => r.UserId == customerId)
            .OrderByDescending(r => r.CreatedAt)
            .AsNoTracking()
            .ToListAsync();

        var totalSpend = orders
            .Where(o => o.Status != "Cancelled")
            .Sum(o => o.Total);

        var customerDto = new AdminCustomerDto(
            user.Id,
            $"{user.Firstname} {user.Lastname}".Trim(),
            user.Email ?? "",
            user.Phone,
            user.CreatedAt,
            orders.Count,
            reservations.Count,
            totalSpend
        );

        var orderDtos = orders.Select(o => new AdminCustomerOrderDto(
            o.Id, o.Branch.Name, o.OrderType, o.Total, o.Status, o.CreatedAt,
            o.OrderItems.Sum(i => i.Quantity),
            o.OrderItems.Select(oi => new AdminCustomerOrderItemDto(
                oi.MenuItem.Name, oi.Quantity, oi.PriceAtPurchase
            )).ToList()
        )).ToList();

        var reservationDtos = reservations.Select(r => new AdminCustomerReservationDto(
            r.Id, r.Branch.Name,
            r.Date.ToString("yyyy-MM-dd"), r.TimeSlot,
            r.GuestCount, r.Status, r.CreatedAt, r.SpecialRequests
        )).ToList();

        return new AdminCustomerDetailDto(customerDto, orderDtos, reservationDtos);
    }
}
