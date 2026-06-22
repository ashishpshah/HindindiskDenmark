using HindIndisk.Api.Application.DTOs.Menu;
using HindIndisk.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace HindIndisk.Api.Application.Services;

public class MenuService : IMenuService
{
    private readonly ApplicationDbContext _db;

    public MenuService(ApplicationDbContext db) => _db = db;

    public async Task<IReadOnlyList<MenuCategoryDto>> GetCategoriesAsync()
    {
        return await _db.Menus
            .Where(m => m.IsActive && m.MenuItemsMappings.Any())
            .OrderBy(m => m.Id)
            .Select(m => new MenuCategoryDto(m.Id, m.Name, m.NameDa, m.Description, m.DescriptionDa, m.MenuItemsMappings.Count))
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<IReadOnlyList<MenuItemDto>> GetItemsAsync(
        string? category, string? q, bool? veg, long? branchId)
    {
        var targetBranchId = branchId ?? 1L;

        // Pass 1 — project item + category columns (no collection navigation needed)
        var query = _db.MenuItemsMappings
            .Where(m => m.Menu.IsActive)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(m => m.Menu.Name == category);

        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(m =>
                m.MenuItem.Name.Contains(q) ||
                m.MenuItem.NameDa.Contains(q) ||
                m.MenuItem.Description.Contains(q) ||
                m.MenuItem.DescriptionDa.Contains(q));

        if (veg == true)
            query = query.Where(m =>
                m.MenuItem.MenuItemLabels.Any(l => l.Label.Name == "Vegetarian"));

        var rows = await query
            .Select(m => new
            {
                m.MenuItem.Id,
                m.MenuItem.Name,
                m.MenuItem.NameDa,
                m.MenuItem.Description,
                m.MenuItem.DescriptionDa,
                m.MenuItem.ImageUrl,
                m.MenuItem.SpicyLevel,
                CategoryName = m.Menu.Name,
                CategoryDa   = m.Menu.NameDa,
                CategoryId   = m.Menu.Id,
            })
            .Distinct()
            .ToListAsync();

        var itemIds = rows.Select(r => r.Id).ToList();

        // Pass 2 — labels
        var labelRows = await _db.MenuItemLabels
            .Where(l => itemIds.Contains(l.MenuItemId))
            .Select(l => new { l.MenuItemId, LabelName = l.Label.Name })
            .AsNoTracking()
            .ToListAsync();

        var labelsByItem = labelRows
            .GroupBy(l => l.MenuItemId)
            .ToDictionary(g => g.Key, g => (IReadOnlyList<string>)g.Select(l => l.LabelName).ToList());

        // Pass 3 — branch prices
        var priceMap = await _db.BranchMenuItemPrices
            .Where(p => p.BranchId == targetBranchId && itemIds.Contains(p.MenuItemId))
            .AsNoTracking()
            .ToDictionaryAsync(p => p.MenuItemId, p => p.Price);

        return rows.Select(r =>
        {
            var labels  = labelsByItem.GetValueOrDefault(r.Id, []);
            var isVeg   = labels.Contains("Vegetarian");
            var price   = priceMap.GetValueOrDefault(r.Id, 0m);
            return new MenuItemDto(r.Id, r.Name, r.NameDa, r.Description, r.DescriptionDa,
                r.ImageUrl, r.SpicyLevel, price, r.CategoryName, r.CategoryDa, r.CategoryId, isVeg, labels);
        }).ToList();
    }

    public async Task<MenuItemDetailDto> GetItemByNameAsync(string name, long? branchId)
    {
        var targetBranchId = branchId ?? 1L;

        var row = await _db.MenuItemsMappings
            .Where(m => m.MenuItem.Name.ToLower() == name.ToLower() && m.Menu.IsActive)
            .Select(m => new
            {
                m.MenuItem.Id,
                m.MenuItem.Name,
                m.MenuItem.NameDa,
                m.MenuItem.Description,
                m.MenuItem.DescriptionDa,
                m.MenuItem.ImageUrl,
                m.MenuItem.SpicyLevel,
                CategoryName = m.Menu.Name,
                CategoryDa   = m.Menu.NameDa,
                CategoryId   = m.Menu.Id,
            })
            .AsNoTracking()
            .FirstOrDefaultAsync()
            ?? throw new InvalidOperationException($"Menu item '{name}' not found.");

        // Related items — same category, excluding this one
        var relatedRows = await _db.MenuItemsMappings
            .Where(m => m.Menu.Id == row.CategoryId
                     && m.MenuItem.Id != row.Id
                     && m.Menu.IsActive)
            .Select(m => new
            {
                m.MenuItem.Id,
                m.MenuItem.Name,
                m.MenuItem.NameDa,
                m.MenuItem.Description,
                m.MenuItem.DescriptionDa,
                m.MenuItem.ImageUrl,
                m.MenuItem.SpicyLevel,
                CategoryName = m.Menu.Name,
                CategoryDa   = m.Menu.NameDa,
                CategoryId   = m.Menu.Id,
            })
            .AsNoTracking()
            .ToListAsync();

        // Labels + prices for this item and all related items
        var allIds = relatedRows.Select(r => r.Id).Append(row.Id).ToList();

        var labelRows = await _db.MenuItemLabels
            .Where(l => allIds.Contains(l.MenuItemId))
            .Select(l => new { l.MenuItemId, LabelName = l.Label.Name })
            .AsNoTracking()
            .ToListAsync();

        var labelsByItem = labelRows
            .GroupBy(l => l.MenuItemId)
            .ToDictionary(g => g.Key, g => (IReadOnlyList<string>)g.Select(l => l.LabelName).ToList());

        var priceMap = await _db.BranchMenuItemPrices
            .Where(p => p.BranchId == targetBranchId && allIds.Contains(p.MenuItemId))
            .AsNoTracking()
            .ToDictionaryAsync(p => p.MenuItemId, p => p.Price);

        MenuItemDto ToDto(dynamic r)
        {
            var labels = labelsByItem.GetValueOrDefault((long)r.Id, []);
            return new MenuItemDto(
                (long)r.Id, (string)r.Name, (string)r.NameDa,
                (string)r.Description, (string)r.DescriptionDa,
                (string)r.ImageUrl, (int)r.SpicyLevel,
                priceMap.GetValueOrDefault((long)r.Id, 0m),
                (string)r.CategoryName, (string)r.CategoryDa, (long)r.CategoryId,
                labels.Contains("Vegetarian"), labels);
        }

        return new MenuItemDetailDto(
            ToDto(row),
            relatedRows.Select(r => ToDto(r)).ToList()
        );
    }
}
