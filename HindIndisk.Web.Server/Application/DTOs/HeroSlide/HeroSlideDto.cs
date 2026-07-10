namespace HindIndisk.Api.Application.DTOs.HeroSlide;

public record HeroSlideDto(
    long         Id,
    string       Title,
    string       TitleDa,
    string       Subtitle,
    string       SubtitleDa,
    string       Tagline,
    string       TaglineDa,
    string       ImageUrl,
    bool         IsActive,
    int          SortOrder,
    IReadOnlyList<CtaDto> Ctas,
    DateTime     CreatedAt,
    DateTime?    UpdatedAt
);