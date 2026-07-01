using HindIndisk.Api.Application.DTOs.Menu;

namespace HindIndisk.Api.Application.Services;

public interface IMenuService
{
    Task<IReadOnlyList<MenuCategoryDto>> GetCategoriesAsync();
    Task<IReadOnlyList<MenuItemDto>>     GetItemsAsync(string? category, string? q, long? branchId, bool? signature = null);
    Task<MenuItemDetailDto>              GetItemByNameAsync(string name, long? branchId);
}
