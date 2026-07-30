namespace HindIndisk.Api.Application.DTOs.Footer;

public record FooterSettingsDto(
    string Copyright,
    string CopyrightDa
);

public record UpdateFooterSettingsRequest(
    string? Copyright,
    string? CopyrightDa
);
