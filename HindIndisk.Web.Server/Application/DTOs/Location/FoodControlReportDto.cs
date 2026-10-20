namespace HindIndisk.Api.Application.DTOs.Location;

/// <summary>A per-branch Food Control ("Smiley") report link, sourced from appsettings.json.</summary>
/// <param name="Branch">Short suburb key of the branch the report belongs to (e.g. "Vesterbro").</param>
/// <param name="Text">Label (EN) shown next to the report link.</param>
/// <param name="TextDa">Label (DA) shown next to the report link.</param>
/// <param name="Url">Public URL of the report PDF itself (served from wwwroot).</param>
/// <param name="SmileyUrl">Public link to the branch's profile on findsmiley.dk — the external
/// "Smiley" page. Empty when no link is configured for the branch.</param>
/// <param name="IsActive">Whether the entry is shown to the public.</param>
public record FoodControlReportDto(
    string Branch,
    string Text,
    string TextDa,
    string Url,
    string SmileyUrl,
    bool   IsActive
);
