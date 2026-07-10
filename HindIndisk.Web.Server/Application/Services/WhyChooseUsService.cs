using HindIndisk.Api.Application.DTOs.Homepage;
using HindIndisk.Api.Domain.Entities;
using HindIndisk.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace HindIndisk.Api.Application.Services;

public class WhyChooseUsService(ApplicationDbContext db) : IWhyChooseUsService
{
    public async Task<IReadOnlyList<WhyChooseUsItemDto>> GetAllAsync()
    {
        var rows = await db.WhyChooseUsItems.AsNoTracking().OrderBy(x => x.SortOrder).ToListAsync();
        return rows.Select(Map).ToList();
    }

    public async Task<IReadOnlyList<WhyChooseUsItemDto>> GetActiveAsync()
    {
        var rows = await db.WhyChooseUsItems.AsNoTracking()
            .Where(x => x.IsActive).OrderBy(x => x.SortOrder).ToListAsync();
        return rows.Select(Map).ToList();
    }

    public async Task<WhyChooseUsItemDto> CreateAsync(SaveWhyChooseUsItemRequest req)
    {
        var e = new WhyChooseUsItem
        {
            Title = req.Title, TitleDa = req.TitleDa,
            Description = req.Description, DescriptionDa = req.DescriptionDa,
            Icon = req.Icon, SortOrder = req.SortOrder, IsActive = req.IsActive,
        };
        db.WhyChooseUsItems.Add(e);
        await db.SaveChangesAsync();
        return Map(e);
    }

    public async Task<WhyChooseUsItemDto> UpdateAsync(long id, SaveWhyChooseUsItemRequest req)
    {
        var e = await db.WhyChooseUsItems.FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new KeyNotFoundException($"WhyChooseUs item {id} not found.");
        e.Title = req.Title; e.TitleDa = req.TitleDa;
        e.Description = req.Description; e.DescriptionDa = req.DescriptionDa;
        e.Icon = req.Icon; e.SortOrder = req.SortOrder; e.IsActive = req.IsActive;
        await db.SaveChangesAsync();
        return Map(e);
    }

    public async Task<bool> DeleteAsync(long id)
    {
        var e = await db.WhyChooseUsItems.FirstOrDefaultAsync(x => x.Id == id);
        if (e is null) return false;
        db.WhyChooseUsItems.Remove(e);
        await db.SaveChangesAsync();
        return true;
    }

    private static WhyChooseUsItemDto Map(WhyChooseUsItem x) =>
        new(x.Id, x.Title, x.TitleDa, x.Description, x.DescriptionDa, x.Icon, x.SortOrder, x.IsActive);
}
