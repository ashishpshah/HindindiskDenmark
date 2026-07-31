namespace HindIndisk.Api.Application.DTOs.Admin;

public record UpdateEmailSettingsRequest(
    string  SmtpHost,
    int     SmtpPort,
    string  SmtpUser,
    string? SmtpPass,
    string  FromName,
    string  FromAddress,
    bool    Enabled);
