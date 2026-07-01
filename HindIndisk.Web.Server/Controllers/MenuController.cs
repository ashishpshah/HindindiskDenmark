using HindIndisk.Api.Application.DTOs.Menu;
using HindIndisk.Api.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace HindIndisk.Api.Controllers;

[ApiController]
[Route("api/menu")]
public class MenuController : ControllerBase
{
    private readonly IMenuService _menu;

    public MenuController(IMenuService menu) => _menu = menu;

    /// <summary>All active menu categories with item count.</summary>
    [HttpGet("categories")]
    [ProducesResponseType(typeof(IReadOnlyList<MenuCategoryDto>), 200)]
    public async Task<IActionResult> GetCategories()
        => Ok(await _menu.GetCategoriesAsync());

    /// <summary>
    /// All active menu items. Supports optional filters:
    /// ?category=Starters  ?q=chicken  ?branchId=1
    /// </summary>
    [HttpGet("items")]
    [ProducesResponseType(typeof(IReadOnlyList<MenuItemDto>), 200)]
    public async Task<IActionResult> GetItems(
        [FromQuery] string? category,
        [FromQuery] string? q,
        [FromQuery] long?   branchId,
        [FromQuery] bool?   signature)
        => Ok(await _menu.GetItemsAsync(category, q, branchId, signature));

    /// <summary>Single item detail + related items in the same category.</summary>
    [HttpGet("items/{name}")]
    [ProducesResponseType(typeof(MenuItemDetailDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetItem(string name, [FromQuery] long? branchId)
    {
        try
        {
            return Ok(await _menu.GetItemByNameAsync(name, branchId));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
