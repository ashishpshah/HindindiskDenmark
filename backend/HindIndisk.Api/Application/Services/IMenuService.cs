using HindIndisk.Api.Application.DTOs.Menu;

namespace HindIndisk.Api.Application.Services;

public interface IMenuService
{
    Task<IReadOnlyList<MenuCategoryDto>> GetCategoriesAsync();
    Task<IReadOnlyList<MenuItemDto>>     GetItemsAsync(string? category, string? q, bool? veg, long? branchId);
    Task<MenuItemDetailDto>              GetItemByNameAsync(string name, long? branchId);
}
