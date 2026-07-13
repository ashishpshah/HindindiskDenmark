using HindIndisk.Api.Application.DTOs.Admin;
using HindIndisk.Api.Domain.Entities;
using HindIndisk.Api.Hubs;
using HindIndisk.Api.Infrastructure;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace HindIndisk.Api.Application.Services;

public class AdminService : IAdminService
{
    private readonly ApplicationDbContext _db;
    private readonly IEmailService _email;
    private readonly IHubContext<CustomerHub> _customerHub;

    public AdminService(ApplicationDbContext db, IEmailService email, IHubContext<CustomerHub> customerHub)
    {
        _db          = db;
        _email       = email;
        _customerHub = customerHub;
    }

    // ── Dashboard ─────────────────────────────────────────────────────────────

    public async Task<AdminDashboardDto> GetDashboardAsync()
    {
        var today      = DenmarkTime.Today.ToDateTime(TimeOnly.MinValue);
        var tomorrow   = today.AddDays(1);

        var todayOrders    = await _db.Orders.CountAsync(o => o.CreatedAt >= today && o.CreatedAt < tomorrow);
        var todayRevenue   = await _db.Orders
                                .Where(o => o.CreatedAt >= today && o.CreatedAt < tomorrow && o.Status != "Cancelled")
                                .SumAsync(o => (decimal?)o.Total) ?? 0m;
        var pendingOrders  = await _db.Orders.CountAsync(o =>
                                !o.OrderStatus.IsTerminal && o.Status != "Cancelled");
        var todayReservations = await _db.Reservations
                                    .CountAsync(r => r.Date >= today && r.Date < tomorrow);
        var totalOrders    = await _db.Orders.CountAsync();
        var totalRevenue   = await _db.Orders
                                .Where(o => o.Status != "Cancelled")
                                .SumAsync(o => (decimal?)o.Total) ?? 0m;

        return new AdminDashboardDto(todayOrders, todayRevenue, pendingOrders, todayReservations, totalOrders, totalRevenue);
    }

    public async Task<AdminTrendDto> GetTrendsAsync()
    {
        var yesterdayStart = DenmarkTime.Today.AddDays(-1).ToDateTime(TimeOnly.MinValue);
        var todayStart     = DenmarkTime.Today.ToDateTime(TimeOnly.MinValue);

        var yesterdayOrders = await _db.Orders
            .CountAsync(o => o.CreatedAt >= yesterdayStart && o.CreatedAt < todayStart);
        var yesterdayRevenue = await _db.Orders
            .Where(o => o.CreatedAt >= yesterdayStart && o.CreatedAt < todayStart && o.Status != "Cancelled")
            .SumAsync(o => (decimal?)o.Total) ?? 0m;
        var yesterdayReservations = await _db.Reservations
            .CountAsync(r => r.Date >= yesterdayStart && r.Date < todayStart);

        return new AdminTrendDto(yesterdayOrders, yesterdayRevenue, yesterdayReservations);
    }

    public async Task<IReadOnlyList<RevenuePointDto>> GetRevenueHistoryAsync(int days)
    {
        var from = DenmarkTime.Today.AddDays(-days + 1).ToDateTime(TimeOnly.MinValue);
        var result = new List<RevenuePointDto>();

        for (var i = 0; i < days; i++)
        {
            var dayStart = from.AddDays(i);
            var dayEnd   = dayStart.AddDays(1);
            var rev = await _db.Orders
                .Where(o => o.CreatedAt >= dayStart && o.CreatedAt < dayEnd && o.Status != "Cancelled")
                .SumAsync(o => (decimal?)o.Total) ?? 0m;
            result.Add(new RevenuePointDto(dayStart.ToString("yyyy-MM-dd"), rev));
        }

        return result;
    }

    public async Task<IReadOnlyList<TopItemDto>> GetTopItemsAsync(int days)
    {
        var since = DenmarkTime.Today.AddDays(-days).ToDateTime(TimeOnly.MinValue);

        return await (
            from oi in _db.OrderItems
            join o in _db.Orders    on oi.OrderId    equals o.Id
            join m in _db.MenuItems on oi.MenuItemId equals m.Id
            where o.CreatedAt >= since && o.Status != "Cancelled"
            group new { oi.Quantity, Revenue = oi.PriceAtPurchase * oi.Quantity } by m.Name into g
            select new TopItemDto(g.Key, g.Sum(x => x.Quantity), g.Sum(x => x.Revenue))
        )
        .OrderByDescending(x => x.Quantity)
        .Take(10)
        .ToListAsync();
    }

    public async Task<IReadOnlyList<BranchOverviewDto>> GetBranchOverviewAsync()
    {
        var todayStart = DenmarkTime.Today.ToDateTime(TimeOnly.MinValue);
        var tomorrow   = todayStart.AddDays(1);

        var branches = await _db.Branches.ToListAsync();
        var result = new List<BranchOverviewDto>();

        foreach (var branch in branches)
        {
            var orders = await _db.Orders
                .CountAsync(o => o.BranchId == branch.Id && o.CreatedAt >= todayStart && o.CreatedAt < tomorrow);
            var revenue = await _db.Orders
                .Where(o => o.BranchId == branch.Id && o.CreatedAt >= todayStart && o.CreatedAt < tomorrow && o.Status != "Cancelled")
                .SumAsync(o => (decimal?)o.Total) ?? 0m;
            result.Add(new BranchOverviewDto(branch.Name, orders, revenue));
        }

        return result;
    }

    public async Task<IReadOnlyList<HourlyVolumeDto>> GetHourlyVolumeAsync(string? date)
    {
        var day = date is not null && DateOnly.TryParse(date, out var parsed)
            ? parsed.ToDateTime(TimeOnly.MinValue)
            : DenmarkTime.Today.ToDateTime(TimeOnly.MinValue);
        var nextDay = day.AddDays(1);

        var raw = await _db.Orders
            .Where(o => o.CreatedAt >= day && o.CreatedAt < nextDay)
            .Select(o => new { o.CreatedAt })
            .ToListAsync();

        var buckets = raw
            .GroupBy(o => o.CreatedAt.Hour)
            .Select(g => new HourlyVolumeDto(g.Key, g.Count()))
            .OrderBy(h => h.Hour)
            .ToList();

        return buckets;
    }

    public async Task<IReadOnlyList<StatusCountDto>> GetOrderCountsByStatusAsync()
    {
        var statuses = await _db.OrderStatuses
            .Where(s => s.IsActive)
            .OrderBy(s => s.DisplayOrder)
            .ToListAsync();

        var result = new List<StatusCountDto>();
        foreach (var s in statuses)
        {
            var count = await _db.Orders.CountAsync(o => o.Status == s.Name);
            result.Add(new StatusCountDto(s.Name, count));
        }

        return result;
    }

    // ── Orders ────────────────────────────────────────────────────────────────

    public async Task<OrderPageDto> GetOrdersAsync(
        int page, int pageSize,
        string? status = null, long? branchId = null, string? search = null,
        string? dateFrom = null, string? dateTo = null)
    {
        IQueryable<Domain.Entities.Order> q = _db.Orders.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            q = q.Where(o => o.Status == status);

        if (!string.IsNullOrWhiteSpace(dateFrom) && DateOnly.TryParse(dateFrom, out var from))
        {
            var fromDt = from.ToDateTime(TimeOnly.MinValue);
            q = q.Where(o =>
                (o.ScheduledDate.HasValue && o.ScheduledDate.Value >= from) ||
                (!o.ScheduledDate.HasValue && o.CreatedAt >= fromDt));
        }

        if (!string.IsNullOrWhiteSpace(dateTo) && DateOnly.TryParse(dateTo, out var to))
        {
            var toDt = to.AddDays(1).ToDateTime(TimeOnly.MinValue);
            q = q.Where(o =>
                (o.ScheduledDate.HasValue && o.ScheduledDate.Value <= to) ||
                (!o.ScheduledDate.HasValue && o.CreatedAt < toDt));
        }

        if (branchId.HasValue)
            q = q.Where(o => o.BranchId == branchId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lower = search.ToLower();
            if (long.TryParse(search.Trim(), out var oid))
                q = q.Where(o => o.Id == oid ||
                                  o.ContactName.ToLower().Contains(lower) ||
                                  (o.ContactEmail != null && o.ContactEmail.ToLower().Contains(lower)) ||
                                  (o.User != null && (
                                      (o.User.Firstname != null && o.User.Firstname.ToLower().Contains(lower)) ||
                                      (o.User.Lastname != null && o.User.Lastname.ToLower().Contains(lower)) ||
                                      (o.User.Email != null && o.User.Email.ToLower().Contains(lower)))));
            else
                q = q.Where(o =>
                    o.ContactName.ToLower().Contains(lower) ||
                    (o.ContactEmail != null && o.ContactEmail.ToLower().Contains(lower)) ||
                    (o.User != null && (
                        (o.User.Firstname != null && o.User.Firstname.ToLower().Contains(lower)) ||
                        (o.User.Lastname != null && o.User.Lastname.ToLower().Contains(lower)) ||
                        (o.User.Email != null && o.User.Email.ToLower().Contains(lower))));
        }

        var total = await q.CountAsync();

        var orders = await q
            .Include(o => o.Branch)
            .Include(o => o.User)
            .Include(o => o.OrderItems).ThenInclude(i => i.MenuItem)
            .Include(o => o.AppliedOffers).ThenInclude(a => a.Offer)
            .Include(o => o.StatusHistories)
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new OrderPageDto(orders.Select(ToAdminOrderDto).ToList(), total);
    }

    public async Task<AdminOrderDto> UpdateOrderStatusAsync(long orderId, string status, string? cancellationReason = null)
    {
        var targetStatus = await _db.OrderStatuses
            .FirstOrDefaultAsync(s => s.Name == status && s.IsActive)
            ?? throw new InvalidOperationException($"Invalid or inactive status '{status}'.");

        var order = await _db.Orders
            .Include(o => o.Branch)
            .Include(o => o.User)
            .Include(o => o.OrderItems).ThenInclude(i => i.MenuItem)
            .Include(o => o.AppliedOffers).ThenInclude(a => a.Offer)
            .Include(o => o.StatusHistories)
            .FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new KeyNotFoundException($"Order {orderId} not found.");

        var transition = await _db.OrderStatusTransitions
            .FirstOrDefaultAsync(t =>
                t.FromStatusId == order.OrderStatusId &&
                t.ToStatusId == targetStatus.Id &&
                (t.ServiceType == "All" || t.ServiceType == order.OrderType))
            ?? throw new InvalidOperationException(
                $"Cannot change order status from '{order.Status}' to '{status}'.");

        order.Status = status;
        order.OrderStatusId = targetStatus.Id;
        if (status == "Cancelled" && !string.IsNullOrWhiteSpace(cancellationReason))
            order.CancellationReason = cancellationReason.Trim();

        _db.OrderStatusHistories.Add(new Domain.Entities.OrderStatusHistory
        {
            OrderId   = order.Id,
            Status    = status,
            ChangedAt = DenmarkTime.Now,
        });
        await _db.SaveChangesAsync();

        // Push real-time update to the customer's browser
        if (order.UserId != 0)
            _ = _customerHub.Clients.Group($"user-{order.UserId}")
                    .SendAsync("OrderStatusChanged", order.Id, status);

        // Notify customer of status change
        var email = order.User?.Email ?? order.ContactEmail;
        if (!string.IsNullOrWhiteSpace(email))
        {
            var name = string.IsNullOrWhiteSpace(order.ContactName) ? "Customer" : order.ContactName;
            if (status == "Cancelled")
                _ = _email.SendOrderCancelledCustomerAsync(email, name, order.Id, order.CancellationReason);
            else
                _ = _email.SendOrderStatusUpdateAsync(email, name, order.Id, status);
        }

        // Notify admin when order is cancelled
        if (status == "Cancelled")
            _ = _email.SendOrderCancelledAdminAsync(
                    order.Id,
                    string.IsNullOrWhiteSpace(order.ContactName) ? "Customer" : order.ContactName,
                    email ?? order.ContactEmail ?? "",
                    order.CancellationReason);

        return ToAdminOrderDto(order);
    }

    // ── Reservations ──────────────────────────────────────────────────────────

    public async Task<IReadOnlyList<AdminReservationDto>> GetReservationsAsync(
        string? status, long? branchId, string? date,
        string? dateFrom = null, string? dateTo = null)
    {
        var q = _db.Reservations
            .Include(r => r.Branch)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            q = q.Where(r => r.Status == status);

        if (branchId.HasValue)
            q = q.Where(r => r.BranchId == branchId.Value);

        if (!string.IsNullOrWhiteSpace(date) && DateTime.TryParse(date, out var parsedDate))
        {
            var dayStart = parsedDate.Date;
            q = q.Where(r => r.Date >= dayStart && r.Date < dayStart.AddDays(1));
        }

        if (!string.IsNullOrWhiteSpace(dateFrom) && DateOnly.TryParse(dateFrom, out var from))
        {
            var fromDt = from.ToDateTime(TimeOnly.MinValue);
            q = q.Where(r => r.Date >= fromDt);
        }

        if (!string.IsNullOrWhiteSpace(dateTo) && DateOnly.TryParse(dateTo, out var to))
        {
            var toDt = to.AddDays(1).ToDateTime(TimeOnly.MinValue);
            q = q.Where(r => r.Date < toDt);
        }

        var reservations = await q.OrderByDescending(r => r.CreatedAt).ToListAsync();
        return reservations.Select(ToAdminReservationDto).ToList();
    }

    public async Task<AdminReservationDto> UpdateReservationStatusAsync(long reservationId, string status, string? cancellationReason = null)
    {
        var valid = new[] { "Pending", "Confirmed", "Cancelled" };
        if (!valid.Contains(status))
            throw new InvalidOperationException($"Invalid status '{status}'.");

        var r = await _db.Reservations
            .Include(r => r.Branch)
            .FirstOrDefaultAsync(r => r.Id == reservationId)
            ?? throw new KeyNotFoundException($"Reservation {reservationId} not found.");

        r.Status = status;
        if (status == "Cancelled" && !string.IsNullOrWhiteSpace(cancellationReason))
            r.CancellationReason = cancellationReason.Trim();
        await _db.SaveChangesAsync();

        // Push real-time update to the customer's browser
        if (r.UserId.HasValue)
            _ = _customerHub.Clients.Group($"user-{r.UserId.Value}")
                    .SendAsync("ReservationStatusChanged", r.Id, status);

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

    public async Task<MenuPageDto> GetMenusAsync(
        int? page = null, int? pageSize = null,
        string? search = null, long? branchId = null)
    {
        IQueryable<Domain.Entities.Menu> q = _db.Menus.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lower = search.ToLower();
            q = q.Where(m =>
                m.Name.ToLower().Contains(lower) ||
                m.NameDa.ToLower().Contains(lower) ||
                m.Description.ToLower().Contains(lower));
        }

        if (branchId.HasValue)
            q = q.Where(m => m.BranchMenus.Any(bm => bm.BranchId == branchId.Value));

        var total = await q.CountAsync();

        IQueryable<Domain.Entities.Menu> dataQ = q
            .Include(m => m.MenuItemsMappings).ThenInclude(mm => mm.MenuItem)
                .ThenInclude(i => i.BranchMenuItemPrices)
            .Include(m => m.BranchMenus)
            .AsNoTracking()
            .OrderBy(m => m.Name);

        if (page.HasValue && pageSize.HasValue)
            dataQ = dataQ.Skip((page.Value - 1) * pageSize.Value).Take(pageSize.Value);

        var menus = await dataQ.ToListAsync();
        return new MenuPageDto(menus.Select(ToAdminMenuDto).ToList(), total);
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

    public async Task<MenuItemPageDto> GetMenuItemsAsync(
        int? page = null, int? pageSize = null,
        string? search = null, long? branchId = null)
    {
        IQueryable<Domain.Entities.MenuItem> q = _db.MenuItems.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lower = search.ToLower();
            q = q.Where(i =>
                i.Name.ToLower().Contains(lower) ||
                i.NameDa.ToLower().Contains(lower) ||
                i.Description.ToLower().Contains(lower));
        }

        if (branchId.HasValue)
            q = q.Where(i => i.BranchMenuItemPrices.Any(p => p.BranchId == branchId.Value));

        var total = await q.CountAsync();

        IQueryable<Domain.Entities.MenuItem> dataQ = q
            .Include(i => i.MenuItemLabels).ThenInclude(l => l.Label)
            .Include(i => i.MenuItemsMappings).ThenInclude(m => m.Menu)
            .Include(i => i.BranchMenuItemPrices).ThenInclude(p => p.Branch)
            .AsNoTracking()
            .OrderBy(i => i.Name);

        if (page.HasValue && pageSize.HasValue)
            dataQ = dataQ.Skip((page.Value - 1) * pageSize.Value).Take(pageSize.Value);

        var items = await dataQ.ToListAsync();
        return new MenuItemPageDto(items.Select(ToAdminMenuItemDto).ToList(), total);
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
            Code          = request.Code,
            SpicyLevel    = request.SpicyLevel,
            IsSignature   = request.IsSignature,
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
        item.Code          = request.Code;
        item.SpicyLevel    = request.SpicyLevel;
        item.IsSignature   = request.IsSignature;
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
            ImageUrl           = request.ImageUrl,
            Badge              = request.Badge,
            Validity           = request.Validity,
            CtaText            = string.IsNullOrWhiteSpace(request.CtaText) ? "View Offer" : request.CtaText,
            CtaLink            = string.IsNullOrWhiteSpace(request.CtaLink) ? "/menu" : request.CtaLink,
            IsShowOnHome       = request.IsShowOnHome,
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
        offer.ImageUrl           = request.ImageUrl;
        offer.Badge              = request.Badge;
        offer.Validity           = request.Validity;
        offer.CtaText            = string.IsNullOrWhiteSpace(request.CtaText) ? "View Offer" : request.CtaText;
        offer.CtaLink            = string.IsNullOrWhiteSpace(request.CtaLink) ? "/menu" : request.CtaLink;
        offer.IsShowOnHome       = request.IsShowOnHome;

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

    // ── Order Status CRUD ────────────────────────────────────────────────────

    public async Task<IReadOnlyList<OrderStatusDto>> GetOrderStatusesAsync()
    {
        var statuses = await _db.OrderStatuses
            .AsNoTracking()
            .OrderBy(s => s.DisplayOrder)
            .ToListAsync();

        return statuses.Select(s => new OrderStatusDto(
            s.Id, s.Name, s.NameDa, s.ServiceType,
            s.DisplayOrder, s.Color, s.IsTerminal, s.IsActive, s.CreatedAt
        )).ToList();
    }

    public async Task<OrderStatusDto> CreateOrderStatusAsync(CreateOrderStatusRequest request)
    {
        var existing = await _db.OrderStatuses.AnyAsync(s => s.Name == request.Name.Trim());
        if (existing)
            throw new InvalidOperationException($"Order status '{request.Name}' already exists.");

        var status = new Domain.Entities.OrderStatus
        {
            Name         = request.Name.Trim(),
            NameDa       = request.NameDa?.Trim(),
            ServiceType  = request.ServiceType,
            DisplayOrder = request.DisplayOrder,
            Color        = request.Color,
            IsTerminal   = false,
            IsActive     = true,
        };
        _db.OrderStatuses.Add(status);
        await _db.SaveChangesAsync();

        return new OrderStatusDto(
            status.Id, status.Name, status.NameDa, status.ServiceType,
            status.DisplayOrder, status.Color, status.IsTerminal, status.IsActive, status.CreatedAt);
    }

    public async Task<OrderStatusDto> UpdateOrderStatusMetaAsync(long id, UpdateOrderStatusMetaRequest request)
    {
        var status = await _db.OrderStatuses.FindAsync(id)
            ?? throw new KeyNotFoundException($"Order status {id} not found.");

        var duplicate = await _db.OrderStatuses.AnyAsync(s => s.Name == request.Name.Trim() && s.Id != id);
        if (duplicate)
            throw new InvalidOperationException($"Order status '{request.Name}' already exists.");

        status.Name         = request.Name.Trim();
        status.NameDa       = request.NameDa?.Trim();
        status.ServiceType  = request.ServiceType;
        status.DisplayOrder = request.DisplayOrder;
        status.Color        = request.Color?.Trim();
        status.IsActive     = request.IsActive;
        await _db.SaveChangesAsync();

        return new OrderStatusDto(
            status.Id, status.Name, status.NameDa, status.ServiceType,
            status.DisplayOrder, status.Color, status.IsTerminal, status.IsActive, status.CreatedAt);
    }

    public async Task DeleteOrderStatusAsync(long id)
    {
        var status = await _db.OrderStatuses.FindAsync(id)
            ?? throw new KeyNotFoundException($"Order status {id} not found.");

        var hasOrders = await _db.Orders.AnyAsync(o => o.OrderStatusId == id);
        if (hasOrders)
            throw new InvalidOperationException(
                $"Cannot delete order status '{status.Name}' because it is in use by existing orders.");

        _db.OrderStatuses.Remove(status);
        await _db.SaveChangesAsync();
    }

    // ── Order Status Transition CRUD ─────────────────────────────────────────

    public async Task<IReadOnlyList<OrderStatusTransitionDto>> GetOrderStatusTransitionsAsync()
    {
        var transitions = await _db.OrderStatusTransitions
            .Include(t => t.FromStatus)
            .Include(t => t.ToStatus)
            .AsNoTracking()
            .OrderBy(t => t.FromStatus.DisplayOrder)
            .ThenBy(t => t.ToStatus.DisplayOrder)
            .ToListAsync();

        return transitions.Select(t => new OrderStatusTransitionDto(
            t.Id, t.FromStatusId, t.ToStatusId, t.ServiceType,
            t.FromStatus.Name, t.ToStatus.Name
        )).ToList();
    }

    public async Task<OrderStatusTransitionDto> CreateOrderStatusTransitionAsync(CreateOrderStatusTransitionRequest request)
    {
        var duplicate = await _db.OrderStatusTransitions.AnyAsync(t =>
            t.FromStatusId == request.FromStatusId &&
            t.ToStatusId == request.ToStatusId &&
            t.ServiceType == request.ServiceType);
        if (duplicate)
            throw new InvalidOperationException("This transition already exists.");

        var transition = new Domain.Entities.OrderStatusTransition
        {
            FromStatusId = request.FromStatusId,
            ToStatusId   = request.ToStatusId,
            ServiceType  = request.ServiceType,
        };
        _db.OrderStatusTransitions.Add(transition);
        await _db.SaveChangesAsync();

        await _db.Entry(transition).Reference(t => t.FromStatus).LoadAsync();
        await _db.Entry(transition).Reference(t => t.ToStatus).LoadAsync();

        return new OrderStatusTransitionDto(
            transition.Id, transition.FromStatusId, transition.ToStatusId, transition.ServiceType,
            transition.FromStatus.Name, transition.ToStatus.Name);
    }

    public async Task DeleteOrderStatusTransitionAsync(long id)
    {
        var transition = await _db.OrderStatusTransitions.FindAsync(id)
            ?? throw new KeyNotFoundException($"Order status transition {id} not found.");

        _db.OrderStatusTransitions.Remove(transition);
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
        var history = o.StatusHistories
            .OrderBy(h => h.ChangedAt)
            .Select(h => new OrderStatusHistoryDto(h.Status, h.ChangedAt))
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
            items,
            o.ScheduledDate,
            o.ScheduledTime,
            history,
            o.CancellationReason
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
            r.UserId.HasValue,
            r.CancellationReason
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
            i.ImageUrl, i.SpicyLevel, labels, categories, prices, i.IsSignature, i.Code);
    }

    private static AdminOfferDto ToAdminOfferDto(Domain.Entities.Offer o) =>
        new(o.Id, o.Title, o.Description, o.OfferType, o.DiscountType,
            o.DiscountValue, o.CouponCode, o.MinimumOrderAmount,
            o.IsAutoApply, o.IsFirstOrderOnly, o.UsageLimit, o.UsageCount,
            o.StartDate, o.EndDate, o.IsActive,
            o.ImageUrl, o.Badge, o.Validity, o.CtaText, o.CtaLink, o.IsShowOnHome);

    // ── Branches ─────────────────────────────────────────────────────────────

    public async Task<IReadOnlyList<AdminBranchDto>> GetBranchesAsync()
    {
        var today = DenmarkTime.Today;

        var branches = await _db.Branches
            .Include(b => b.Closures)
            .Include(b => b.ServiceClosures)
            .OrderBy(b => b.Name)
            .ToListAsync();

        return branches.Select(b => ToAdminBranchDto(b, today)).ToList();
    }

    private static AdminBranchDto ToAdminBranchDto(Branch b, DateOnly today)
    {
        // Active all-day instant closures for Delivery / Pickup (today only)
        var deliveryClosure = b.Closures.FirstOrDefault(c =>
            c.ClosureType == "DateRange" && c.Scope == "Delivery" && c.StartTime == null
            && (c.StartDate ?? today) <= today && (c.EndDate ?? c.StartDate ?? today) >= today);
        var pickupClosure = b.Closures.FirstOrDefault(c =>
            c.ClosureType == "DateRange" && c.Scope == "Pickup" && c.StartTime == null
            && (c.StartDate ?? today) <= today && (c.EndDate ?? c.StartDate ?? today) >= today);

        // Active reservation closure (from BranchServiceClosure)
        var reservationClosure = b.ServiceClosures.FirstOrDefault(c =>
            c.ServiceType == "Reservation" && c.ReopenedAt == null);

        return new AdminBranchDto(
            b.Id, b.Name, b.AddressLine1, b.AddressLine2, b.City, b.PostalCode, b.Country,
            b.Phone, b.Email, b.GoogleMapsLink,
            b.ImageUrl, b.Rating, b.ReviewCount,
            b.DeliveryFee, b.DeliveryFeeEnabled,
            b.IsCloseOrder, b.CloseOrderNote, b.CloseOrderNoteDa,
            reservationClosure != null, reservationClosure?.Note, reservationClosure?.NoteDa,
            deliveryClosure != null, deliveryClosure?.Note, deliveryClosure?.NoteDa,
            pickupClosure != null, pickupClosure?.Note, pickupClosure?.NoteDa,
            b.MaxAdvanceDays);
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
            ImageUrl         = request.ImageUrl,
            Rating           = request.Rating,
            ReviewCount      = request.ReviewCount,
            DeliveryFee        = request.DeliveryFee,
            DeliveryFeeEnabled = request.DeliveryFeeEnabled,
            MaxAdvanceDays     = request.MaxAdvanceDays,
        };

        _db.Branches.Add(branch);
        await _db.SaveChangesAsync();
        return ToAdminBranchDto(branch);
    }

    public async Task<AdminBranchDto> UpdateBranchAsync(long branchId, UpdateBranchRequest request)
    {
        var branch = await _db.Branches.FindAsync(branchId)
            ?? throw new KeyNotFoundException($"Branch {branchId} not found.");

        branch.Name             = request.Name;
        branch.AddressLine1     = request.AddressLine1;
        branch.AddressLine2     = request.AddressLine2;
        branch.City             = request.City;
        branch.PostalCode       = request.PostalCode;
        branch.Country          = request.Country;
        branch.Phone            = request.Phone;
        branch.Email            = request.Email;
        branch.GoogleMapsLink   = request.GoogleMapsLink;
        branch.ImageUrl         = request.ImageUrl;
        branch.Rating           = request.Rating;
        branch.ReviewCount      = request.ReviewCount;
        branch.DeliveryFee        = request.DeliveryFee;
        branch.DeliveryFeeEnabled = request.DeliveryFeeEnabled;
        branch.MaxAdvanceDays     = request.MaxAdvanceDays;

        await _db.SaveChangesAsync();
        return ToAdminBranchDto(branch);
    }

    private static AdminBranchDto ToAdminBranchDto(Domain.Entities.Branch b) =>
        new(b.Id, b.Name, b.AddressLine1, b.AddressLine2, b.City, b.PostalCode, b.Country,
            b.Phone, b.Email, b.GoogleMapsLink,
            b.ImageUrl, b.Rating, b.ReviewCount,
            b.DeliveryFee, b.DeliveryFeeEnabled,
            b.IsCloseOrder, b.CloseOrderNote, b.CloseOrderNoteDa,
            false, null, null,
            false, null, null,
            false, null, null,
            b.MaxAdvanceDays);

    // ── Customers ─────────────────────────────────────────────────────────────

    public async Task<CustomerPageDto> GetCustomersAsync(int page, int pageSize, string? q = null)
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

        var total = await query.CountAsync();

        var users = await query.AsNoTracking().OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
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

        var items = users.Select(u =>
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
        return new CustomerPageDto(items, total);
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
