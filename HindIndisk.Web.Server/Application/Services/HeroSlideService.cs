using HindIndisk.Api.Application.DTOs.HeroSlide;
using HindIndisk.Api.Domain.Entities;
using HindIndisk.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace HindIndisk.Api.Application.Services;

public class HeroSlideService(ApplicationDbContext db) : IHeroSlideService
{
    private static readonly JsonSerializerOptions JsonOpts = new() { WriteIndented = false };

    public async Task<IReadOnlyList<HeroSlideDto>> GetAllAsync()
    {
        var slides = await db.HeroSlides
            .AsNoTracking()
            .OrderBy(s => s.SortOrder)
            .ThenBy(s => s.CreatedAt)
            .ToListAsync();

        return slides.Select(MapToDto).ToList();
    }

    public async Task<HeroSlideDto?> GetByIdAsync(long id)
    {
        var slide = await db.HeroSlides.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id);
        return slide is null ? null : MapToDto(slide);
    }

    public async Task<HeroSlideDto> CreateAsync(CreateHeroSlideRequest request)
    {
        var slide = new HeroSlide
        {
            Title      = request.Title,
            TitleDa    = request.TitleDa,
            Subtitle   = request.Subtitle,
            SubtitleDa = request.SubtitleDa,
            Tagline    = request.Tagline,
            TaglineDa  = request.TaglineDa,
            ImageUrl   = request.ImageUrl,
            IsActive   = request.IsActive,
            SortOrder  = request.SortOrder,
            CtaData    = JsonSerializer.Serialize(request.Ctas ?? [], JsonOpts),
            CreatedAt  = DenmarkTime.Now,
        };

        db.HeroSlides.Add(slide);
        await db.SaveChangesAsync();

        return MapToDto(slide);
    }

    public async Task<HeroSlideDto> UpdateAsync(long id, UpdateHeroSlideRequest request)
    {
        var slide = await db.HeroSlides.FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new KeyNotFoundException($"Hero slide {id} not found.");

        if (request.Title       is not null) slide.Title       = request.Title;
        if (request.TitleDa     is not null) slide.TitleDa     = request.TitleDa;
        if (request.Subtitle    is not null) slide.Subtitle    = request.Subtitle;
        if (request.SubtitleDa  is not null) slide.SubtitleDa  = request.SubtitleDa;
        if (request.Tagline     is not null) slide.Tagline     = request.Tagline;
        if (request.TaglineDa   is not null) slide.TaglineDa   = request.TaglineDa;
        if (request.ImageUrl    is not null) slide.ImageUrl    = request.ImageUrl;
        if (request.IsActive    is not null) slide.IsActive    = request.IsActive.Value;
        if (request.SortOrder   is not null) slide.SortOrder   = request.SortOrder.Value;
        if (request.Ctas        is not null) slide.CtaData     = JsonSerializer.Serialize(request.Ctas, JsonOpts);

        slide.UpdatedAt = DenmarkTime.Now;

        await db.SaveChangesAsync();

        return MapToDto(slide);
    }

    public async Task<bool> DeleteAsync(long id)
    {
        var slide = await db.HeroSlides.FirstOrDefaultAsync(s => s.Id == id);
        if (slide is null) return false;

        db.HeroSlides.Remove(slide);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<HeroSlideDto> ReorderAsync(long id, int newSortOrder)
    {
        var slide = await db.HeroSlides.FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new KeyNotFoundException($"Hero slide {id} not found.");

        slide.SortOrder  = newSortOrder;
        slide.UpdatedAt  = DenmarkTime.Now;

        await db.SaveChangesAsync();
        return MapToDto(slide);
    }

    public async Task<IReadOnlyList<HeroSlideDto>> GetActiveAsync()
    {
        var slides = await db.HeroSlides
            .AsNoTracking()
            .Where(s => s.IsActive)
            .OrderBy(s => s.SortOrder)
            .ThenBy(s => s.CreatedAt)
            .ToListAsync();

        return slides.Select(MapToDto).ToList();
    }

    private static HeroSlideDto MapToDto(HeroSlide s)
    {
        var ctas = JsonSerializer.Deserialize<CtaDto[]>(s.CtaData, JsonOpts) ?? [];
        return new HeroSlideDto(
            s.Id, s.Title, s.TitleDa, s.Subtitle, s.SubtitleDa,
            s.Tagline, s.TaglineDa,
            s.ImageUrl, s.IsActive, s.SortOrder,
            ctas, s.CreatedAt, s.UpdatedAt
        );
    }
}