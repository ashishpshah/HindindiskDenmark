namespace HindIndisk.Api.Application.DTOs.Homepage;

public record HomeStorySectionDto(
    string Eyebrow,
    string EyebrowDa,
    string Title,
    string TitleDa,
    string Subtitle,
    string SubtitleDa,
    string HeritageBadgeLabel,
    string HeritageBadgeLabelDa,
    string HeritageBadgeSince,
    string HeritageBadgeSinceDa,
    string ButtonText,
    string ButtonTextDa,
    string ButtonLink,
    string MainImage,
    string OverlayImage
);

public record UpdateHomeStorySectionRequest(
    string? Eyebrow,
    string? EyebrowDa,
    string? Title,
    string? TitleDa,
    string? Subtitle,
    string? SubtitleDa,
    string? HeritageBadgeLabel,
    string? HeritageBadgeLabelDa,
    string? HeritageBadgeSince,
    string? HeritageBadgeSinceDa,
    string? ButtonText,
    string? ButtonTextDa,
    string? ButtonLink,
    string? MainImage,
    string? OverlayImage
);
