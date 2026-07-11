namespace HindIndisk.Api.Application.DTOs.Admin;

public record MenuPageDto(
    IReadOnlyList<AdminMenuDto> Items,
    int Total
);
