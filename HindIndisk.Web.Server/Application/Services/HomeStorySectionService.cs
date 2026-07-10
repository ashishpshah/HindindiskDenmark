using HindIndisk.Api.Application.DTOs.Homepage;
using HindIndisk.Api.Domain.Entities;
using HindIndisk.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace HindIndisk.Api.Application.Services;

public class HomeStorySectionService(ApplicationDbContext db) : IHomeStorySectionService
{
    public async Task<HomeStorySectionDto> GetAsync()
    {
        var s = await db.HomeStorySectionSettings.AsNoTracking().FirstOrDefaultAsync();
        return s is null ? Empty() : Map(s);
    }

    public async Task<HomeStorySectionDto> UpdateAsync(UpdateHomeStorySectionRequest req)
    {
        var s = await db.HomeStorySectionSettings.FirstOrDefaultAsync();
        if (s is null)
        {
            s = new HomeStorySectionSettings { Id = 1 };
            db.HomeStorySectionSettings.Add(s);
        }
        if (req.Eyebrow              is not null) s.Eyebrow              = req.Eyebrow;
        if (req.EyebrowDa            is not null) s.EyebrowDa            = req.EyebrowDa;
        if (req.Title                is not null) s.Title                = req.Title;
        if (req.TitleDa              is not null) s.TitleDa              = req.TitleDa;
        if (req.Subtitle             is not null) s.Subtitle             = req.Subtitle;
        if (req.SubtitleDa           is not null) s.SubtitleDa           = req.SubtitleDa;
        if (req.HeritageBadgeLabel   is not null) s.HeritageBadgeLabel   = req.HeritageBadgeLabel;
        if (req.HeritageBadgeLabelDa is not null) s.HeritageBadgeLabelDa = req.HeritageBadgeLabelDa;
        if (req.HeritageBadgeSince   is not null) s.HeritageBadgeSince   = req.HeritageBadgeSince;
        if (req.HeritageBadgeSinceDa is not null) s.HeritageBadgeSinceDa = req.HeritageBadgeSinceDa;
        if (req.ButtonText           is not null) s.ButtonText           = req.ButtonText;
        if (req.ButtonTextDa         is not null) s.ButtonTextDa         = req.ButtonTextDa;
        if (req.ButtonLink           is not null) s.ButtonLink           = req.ButtonLink;
        if (req.MainImage            is not null) s.MainImage            = req.MainImage;
        if (req.OverlayImage         is not null) s.OverlayImage         = req.OverlayImage;
        await db.SaveChangesAsync();
        return Map(s);
    }

    private static HomeStorySectionDto Map(HomeStorySectionSettings s) =>
        new(s.Eyebrow, s.EyebrowDa, s.Title, s.TitleDa,
            s.Subtitle, s.SubtitleDa,
            s.HeritageBadgeLabel, s.HeritageBadgeLabelDa,
            s.HeritageBadgeSince, s.HeritageBadgeSinceDa,
            s.ButtonText, s.ButtonTextDa, s.ButtonLink,
            s.MainImage, s.OverlayImage);

    private static HomeStorySectionDto Empty() =>
        new(string.Empty, string.Empty, string.Empty, string.Empty,
            string.Empty, string.Empty, string.Empty, string.Empty,
            string.Empty, string.Empty, string.Empty, string.Empty,
            string.Empty, string.Empty, string.Empty);
}
