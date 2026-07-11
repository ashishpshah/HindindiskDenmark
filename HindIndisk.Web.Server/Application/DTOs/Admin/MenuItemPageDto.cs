namespace HindIndisk.Api.Application.DTOs.Admin;

public record MenuItemPageDto(
    IReadOnlyList<AdminMenuItemDto> Items,
    int Total
);
