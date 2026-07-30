using HindIndisk.Api.Application.DTOs.Footer;
using HindIndisk.Api.Domain.Entities;
using HindIndisk.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace HindIndisk.Api.Application.Services;

public class FooterSettingsService(ApplicationDbContext db) : IFooterSettingsService
{
    public async Task<FooterSettingsDto> GetAsync()
    {
        var s = await db.FooterSettings.AsNoTracking().FirstOrDefaultAsync();
        return s is null ? Empty() : Map(s);
    }

    public async Task<FooterSettingsDto> UpdateAsync(UpdateFooterSettingsRequest req)
    {
        var s = await db.FooterSettings.FirstOrDefaultAsync();
        if (s is null)
        {
            s = new FooterSettings { Id = 1 };
            db.FooterSettings.Add(s);
        }
        if (req.Copyright   is not null) s.Copyright   = req.Copyright;
        if (req.CopyrightDa is not null) s.CopyrightDa = req.CopyrightDa;
        await db.SaveChangesAsync();
        return Map(s);
    }

    private static FooterSettingsDto Map(FooterSettings s) =>
        new(s.Copyright, s.CopyrightDa);

    private static FooterSettingsDto Empty() =>
        new(string.Empty, string.Empty);
}
