namespace HindIndisk.Api.Application.DTOs.Admin;

public record EmailSettingsDto(
    string SmtpHost,
    int    SmtpPort,
    string SmtpUser,
    string FromName,
    string FromAddress,
    bool   Enabled);
