using HindIndisk.Api.Application.DTOs.Gallery;
using HindIndisk.Api.Domain.Entities;
using HindIndisk.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace HindIndisk.Api.Application.Services;

public class GalleryImageService(ApplicationDbContext db) : IGalleryImageService
{
    public async Task<IReadOnlyList<GalleryImageDto>> GetAllAsync()
    {
        var images = await db.GalleryImages
            .AsNoTracking()
            .OrderBy(g => g.SortOrder)
            .ThenBy(g => g.CreatedAt)
            .ToListAsync();

        return images.Select(Map).ToList();
    }

    public async Task<IReadOnlyList<GalleryImageDto>> GetActiveAsync()
    {
        var images = await db.GalleryImages
            .AsNoTracking()
            .Where(g => g.IsActive)
            .OrderBy(g => g.SortOrder)
            .ThenBy(g => g.CreatedAt)
            .ToListAsync();

        return images.Select(Map).ToList();
    }

    public async Task<GalleryImageDto> CreateAsync(CreateGalleryImageRequest request)
    {
        var image = new GalleryImage
        {
            Url       = request.Url,
            Caption   = request.Caption,
            CaptionDa = request.CaptionDa,
            SortOrder = request.SortOrder,
            IsActive  = request.IsActive,
            CreatedAt = DenmarkTime.Now,
        };

        db.GalleryImages.Add(image);
        await db.SaveChangesAsync();
        return Map(image);
    }

    public async Task<GalleryImageDto> UpdateAsync(long id, UpdateGalleryImageRequest request)
    {
        var image = await db.GalleryImages.FirstOrDefaultAsync(g => g.Id == id)
            ?? throw new KeyNotFoundException($"Gallery image {id} not found.");

        if (request.Caption   is not null) image.Caption   = request.Caption;
        if (request.CaptionDa is not null) image.CaptionDa = request.CaptionDa;
        if (request.IsActive  is not null) image.IsActive  = request.IsActive.Value;
        if (request.SortOrder is not null) image.SortOrder = request.SortOrder.Value;

        await db.SaveChangesAsync();
        return Map(image);
    }

    public async Task<bool> DeleteAsync(long id)
    {
        var image = await db.GalleryImages.FirstOrDefaultAsync(g => g.Id == id);
        if (image is null) return false;

        db.GalleryImages.Remove(image);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<GalleryImageDto> ReorderAsync(long id, int newSortOrder)
    {
        var image = await db.GalleryImages.FirstOrDefaultAsync(g => g.Id == id)
            ?? throw new KeyNotFoundException($"Gallery image {id} not found.");

        image.SortOrder = newSortOrder;
        await db.SaveChangesAsync();
        return Map(image);
    }

    private static GalleryImageDto Map(GalleryImage g) =>
        new(g.Id, g.Url, g.Caption, g.CaptionDa, g.SortOrder, g.IsActive, g.CreatedAt);
}
