namespace HindIndisk.Api.Application.DTOs.Location;

/// <summary>A per-branch Food Control ("Smiley") report link, sourced from appsettings.json.</summary>
public record FoodControlReportDto(
    string Branch,
    string Text,
    string TextDa,
    string Url,
    bool   IsActive
);
