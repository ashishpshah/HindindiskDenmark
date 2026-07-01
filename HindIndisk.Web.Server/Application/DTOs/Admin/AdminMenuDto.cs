namespace HindIndisk.Api.Application.DTOs.Admin;

public record AdminMenuDto(
    long   Id,
    string Name,
    string NameDa,
    string Description,
    string DescriptionDa,
    bool   IsActive,
    int    ItemCount,
    IReadOnlyList<AdminMenuItemSummaryDto> Items,
    IReadOnlyList<long> BranchIds
);

public record AdminMenuItemSummaryDto(
    long     Id,
    string   Name,
    string   NameDa,
    string   ImageUrl,
    decimal? Price,
    int      SortOrder
);
