using HindIndisk.Api.Application.DTOs.Admin;
using HindIndisk.Api.Domain.Entities;
using HindIndisk.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace HindIndisk.Api.Application.Services;

public class EmailSettingsService : IEmailSettingsService
{
    private readonly ApplicationDbContext _db;

    public EmailSettingsService(ApplicationDbContext db) => _db = db;

    public async Task<EmailSettingsDto> GetAsync()
    {
        var cfg = await GetEntityAsync();
        return ToDto(cfg);
    }

    public async Task<EmailSettingsDto> UpdateAsync(UpdateEmailSettingsRequest request)
    {
        var cfg = await GetEntityAsync();

        cfg.SmtpHost    = request.SmtpHost;
        cfg.SmtpPort    = request.SmtpPort;
        cfg.SmtpUser    = request.SmtpUser;
        cfg.FromName    = request.FromName;
        cfg.FromAddress = request.FromAddress;
        cfg.AdminToMail = request.AdminToMail;
        cfg.CC          = request.CC;
        cfg.BCC         = request.BCC;
        cfg.Enabled     = request.Enabled;

        if (!string.IsNullOrWhiteSpace(request.SmtpPass))
            cfg.SmtpPass = request.SmtpPass;

        await _db.SaveChangesAsync();
        return ToDto(cfg);
    }

    public async Task<EmailConfig> GetEntityAsync()
    {
        var cfg = await _db.EmailConfigs.FirstOrDefaultAsync();
        if (cfg is null)
        {
            cfg = new EmailConfig { Id = 1 };
            _db.EmailConfigs.Add(cfg);
            await _db.SaveChangesAsync();
        }
        return cfg;
    }

    private static EmailSettingsDto ToDto(EmailConfig cfg) => new(
        cfg.SmtpHost, cfg.SmtpPort, cfg.SmtpUser,
        cfg.FromName, cfg.FromAddress,
        cfg.AdminToMail, cfg.CC, cfg.BCC, cfg.Enabled);
}
