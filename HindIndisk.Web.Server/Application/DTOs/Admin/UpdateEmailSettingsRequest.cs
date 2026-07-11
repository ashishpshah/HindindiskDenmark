namespace HindIndisk.Api.Application.DTOs.Admin;

public record UpdateEmailSettingsRequest(
    string  SmtpHost,
    int     SmtpPort,
    string  SmtpUser,
    string? SmtpPass,
    string  FromName,
    string  FromAddress,
    string  AdminToMail,
    string  CC,
    string  BCC,
    bool    Enabled);
