namespace HindIndisk.Api.Application.DTOs.HeroSlide;

public record CreateHeroSlideRequest(
    string   Title,
    string   TitleDa,
    string   Subtitle,
    string   SubtitleDa,
    string   Tagline,
    string   TaglineDa,
    string   ImageUrl,
    bool     IsActive,
    int      SortOrder,
    CtaDto[] Ctas
);