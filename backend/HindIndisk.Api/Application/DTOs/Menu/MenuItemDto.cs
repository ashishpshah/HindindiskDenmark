namespace HindIndisk.Api.Application.DTOs.Menu;

public record MenuItemDto(
    long                    Id,
    string                  Name,
    string                  NameDa,
    string                  Description,
    string                  DescriptionDa,
    string                  ImageUrl,
    int                     SpicyLevel,
    decimal                 Price,
    string                  Category,
    string                  CategoryDa,
    long                    CategoryId,
    bool                    IsVegetarian,
    IReadOnlyList<string>   Labels
);
