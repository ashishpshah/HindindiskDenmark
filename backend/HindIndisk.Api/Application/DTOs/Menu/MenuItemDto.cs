namespace HindIndisk.Api.Application.DTOs.Menu;

public record MenuItemDto(
    long                    Id,
    string                  Name,
    string                  Description,
    string                  ImageUrl,
    int                     SpicyLevel,
    decimal                 Price,
    string                  Category,
    long                    CategoryId,
    bool                    IsVegetarian,
    IReadOnlyList<string>   Labels
);
