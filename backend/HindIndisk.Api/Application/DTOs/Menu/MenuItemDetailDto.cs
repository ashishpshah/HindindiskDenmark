namespace HindIndisk.Api.Application.DTOs.Menu;

public record MenuItemDetailDto(
    MenuItemDto                 Item,
    IReadOnlyList<MenuItemDto>  RelatedItems
);
