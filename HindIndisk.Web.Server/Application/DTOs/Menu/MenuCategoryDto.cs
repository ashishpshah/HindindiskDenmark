namespace HindIndisk.Api.Application.DTOs.Menu;

public record MenuCategoryDto(
    long   Id,
    string Name,
    string NameDa,
    string Description,
    string DescriptionDa,
    int    ItemCount
);
