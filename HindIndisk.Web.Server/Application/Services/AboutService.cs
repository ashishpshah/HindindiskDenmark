using HindIndisk.Api.Application.DTOs.About;
using HindIndisk.Api.Domain.Entities;
using HindIndisk.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace HindIndisk.Api.Application.Services;

public class AboutService(ApplicationDbContext db) : IAboutService
{
    // ── Settings ──────────────────────────────────────────────────────────────

    public async Task<AboutPageSettingsDto> GetSettingsAsync()
    {
        var s = await db.AboutPageSettings.AsNoTracking().FirstOrDefaultAsync();
        return s is null
            ? new AboutPageSettingsDto(string.Empty, string.Empty)
            : MapSettings(s);
    }

    public async Task<AboutPageSettingsDto> UpdateSettingsAsync(UpdateAboutSettingsRequest req)
    {
        var s = await db.AboutPageSettings.FirstOrDefaultAsync();
        if (s is null)
        {
            s = new AboutPageSettings { Id = 1 };
            db.AboutPageSettings.Add(s);
        }
        if (req.HeroImage  is not null) s.HeroImage  = req.HeroImage;
        if (req.StoryImage is not null) s.StoryImage = req.StoryImage;
        await db.SaveChangesAsync();
        return MapSettings(s);
    }

    // ── Stats ─────────────────────────────────────────────────────────────────

    public async Task<IReadOnlyList<AboutStatDto>> GetStatsAsync()
    {
        var rows = await db.AboutStats.AsNoTracking().OrderBy(x => x.SortOrder).ToListAsync();
        return rows.Select(MapStat).ToList();
    }

    public async Task<AboutStatDto> CreateStatAsync(SaveAboutStatRequest req)
    {
        var e = new AboutStat { Value = req.Value, Label = req.Label, LabelDa = req.LabelDa, SortOrder = req.SortOrder };
        db.AboutStats.Add(e);
        await db.SaveChangesAsync();
        return MapStat(e);
    }

    public async Task<AboutStatDto> UpdateStatAsync(long id, SaveAboutStatRequest req)
    {
        var e = await db.AboutStats.FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new KeyNotFoundException($"Stat {id} not found.");
        e.Value = req.Value; e.Label = req.Label; e.LabelDa = req.LabelDa; e.SortOrder = req.SortOrder;
        await db.SaveChangesAsync();
        return MapStat(e);
    }

    public async Task<bool> DeleteStatAsync(long id)
    {
        var e = await db.AboutStats.FirstOrDefaultAsync(x => x.Id == id);
        if (e is null) return false;
        db.AboutStats.Remove(e);
        await db.SaveChangesAsync();
        return true;
    }

    // ── MVV ───────────────────────────────────────────────────────────────────

    public async Task<IReadOnlyList<AboutMvvDto>> GetMvvAsync()
    {
        var rows = await db.AboutMvvItems.AsNoTracking().OrderBy(x => x.SortOrder).ToListAsync();
        return rows.Select(MapMvv).ToList();
    }

    public async Task<AboutMvvDto> CreateMvvAsync(SaveAboutMvvRequest req)
    {
        var e = new AboutMvvItem { Title = req.Title, TitleDa = req.TitleDa, Description = req.Description, DescriptionDa = req.DescriptionDa, Icon = req.Icon, SortOrder = req.SortOrder };
        db.AboutMvvItems.Add(e);
        await db.SaveChangesAsync();
        return MapMvv(e);
    }

    public async Task<AboutMvvDto> UpdateMvvAsync(long id, SaveAboutMvvRequest req)
    {
        var e = await db.AboutMvvItems.FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new KeyNotFoundException($"MVV item {id} not found.");
        e.Title = req.Title; e.TitleDa = req.TitleDa; e.Description = req.Description;
        e.DescriptionDa = req.DescriptionDa; e.Icon = req.Icon; e.SortOrder = req.SortOrder;
        await db.SaveChangesAsync();
        return MapMvv(e);
    }

    public async Task<bool> DeleteMvvAsync(long id)
    {
        var e = await db.AboutMvvItems.FirstOrDefaultAsync(x => x.Id == id);
        if (e is null) return false;
        db.AboutMvvItems.Remove(e);
        await db.SaveChangesAsync();
        return true;
    }

    // ── Timeline ──────────────────────────────────────────────────────────────

    public async Task<IReadOnlyList<AboutTimelineDto>> GetTimelineAsync()
    {
        var rows = await db.AboutTimelineItems.AsNoTracking().OrderBy(x => x.SortOrder).ToListAsync();
        return rows.Select(MapTimeline).ToList();
    }

    public async Task<AboutTimelineDto> CreateTimelineItemAsync(SaveAboutTimelineRequest req)
    {
        var e = new AboutTimelineItem { Year = req.Year, Title = req.Title, TitleDa = req.TitleDa, Description = req.Description, DescriptionDa = req.DescriptionDa, SortOrder = req.SortOrder };
        db.AboutTimelineItems.Add(e);
        await db.SaveChangesAsync();
        return MapTimeline(e);
    }

    public async Task<AboutTimelineDto> UpdateTimelineItemAsync(long id, SaveAboutTimelineRequest req)
    {
        var e = await db.AboutTimelineItems.FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new KeyNotFoundException($"Timeline item {id} not found.");
        e.Year = req.Year; e.Title = req.Title; e.TitleDa = req.TitleDa;
        e.Description = req.Description; e.DescriptionDa = req.DescriptionDa; e.SortOrder = req.SortOrder;
        await db.SaveChangesAsync();
        return MapTimeline(e);
    }

    public async Task<bool> DeleteTimelineItemAsync(long id)
    {
        var e = await db.AboutTimelineItems.FirstOrDefaultAsync(x => x.Id == id);
        if (e is null) return false;
        db.AboutTimelineItems.Remove(e);
        await db.SaveChangesAsync();
        return true;
    }

    // ── Team ──────────────────────────────────────────────────────────────────

    public async Task<IReadOnlyList<TeamMemberDto>> GetTeamAsync()
    {
        var rows = await db.TeamMembers.AsNoTracking().OrderBy(x => x.SortOrder).ToListAsync();
        return rows.Select(MapTeam).ToList();
    }

    public async Task<IReadOnlyList<TeamMemberDto>> GetActiveTeamAsync()
    {
        var rows = await db.TeamMembers.AsNoTracking().Where(x => x.IsActive).OrderBy(x => x.SortOrder).ToListAsync();
        return rows.Select(MapTeam).ToList();
    }

    public async Task<TeamMemberDto> CreateTeamMemberAsync(SaveTeamMemberRequest req)
    {
        var e = new TeamMember { Name = req.Name, Role = req.Role, RoleDa = req.RoleDa, Image = req.Image, SortOrder = req.SortOrder, IsActive = req.IsActive };
        db.TeamMembers.Add(e);
        await db.SaveChangesAsync();
        return MapTeam(e);
    }

    public async Task<TeamMemberDto> UpdateTeamMemberAsync(long id, SaveTeamMemberRequest req)
    {
        var e = await db.TeamMembers.FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new KeyNotFoundException($"Team member {id} not found.");
        e.Name = req.Name; e.Role = req.Role; e.RoleDa = req.RoleDa;
        e.Image = req.Image; e.SortOrder = req.SortOrder; e.IsActive = req.IsActive;
        await db.SaveChangesAsync();
        return MapTeam(e);
    }

    public async Task<bool> DeleteTeamMemberAsync(long id)
    {
        var e = await db.TeamMembers.FirstOrDefaultAsync(x => x.Id == id);
        if (e is null) return false;
        db.TeamMembers.Remove(e);
        await db.SaveChangesAsync();
        return true;
    }

    // ── Public aggregate ──────────────────────────────────────────────────────

    public async Task<AboutPageDto> GetPublicPageAsync()
    {
        var settings  = await GetSettingsAsync();
        var stats     = await GetStatsAsync();
        var mvv       = await GetMvvAsync();
        var timeline  = await GetTimelineAsync();
        var team      = await GetActiveTeamAsync();
        return new AboutPageDto(settings, stats, mvv, timeline, team);
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private static AboutPageSettingsDto MapSettings(AboutPageSettings s) =>
        new(s.HeroImage, s.StoryImage);

    private static AboutStatDto MapStat(AboutStat s) =>
        new(s.Id, s.Value, s.Label, s.LabelDa, s.SortOrder);

    private static AboutMvvDto MapMvv(AboutMvvItem m) =>
        new(m.Id, m.Title, m.TitleDa, m.Description, m.DescriptionDa, m.Icon, m.SortOrder);

    private static AboutTimelineDto MapTimeline(AboutTimelineItem t) =>
        new(t.Id, t.Year, t.Title, t.TitleDa, t.Description, t.DescriptionDa, t.SortOrder);

    private static TeamMemberDto MapTeam(TeamMember m) =>
        new(m.Id, m.Name, m.Role, m.RoleDa, m.Image, m.SortOrder, m.IsActive);
}
