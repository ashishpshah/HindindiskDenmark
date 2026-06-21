namespace HindIndisk.Api.Application.DTOs.Admin;

public record AdminMenuItemDto(
    long   Id,
    string Name,
    string Description,
    string ImageUrl,
    int    SpicyLevel,
    IReadOnlyList<string>              Labels,
    bool                               IsVegetarian,
    IReadOnlyList<string>              Categories,
    IReadOnlyList<AdminBranchPriceDto> Prices
);

public record AdminBranchPriceDto(long BranchId, string BranchName, decimal Price);
