namespace HindIndisk.Api.Application.DTOs.Admin;

public record AdminMenuItemDto(
    long   Id,
    string Name,
    string NameDa,
    string Description,
    string DescriptionDa,
    string ImageUrl,
    int    SpicyLevel,
    IReadOnlyList<string>              Labels,
    IReadOnlyList<string>              Categories,
    IReadOnlyList<AdminBranchPriceDto> Prices,
    bool                               IsSignature,
    int                                Code
);

public record AdminBranchPriceDto(long BranchId, string BranchName, decimal Price);
