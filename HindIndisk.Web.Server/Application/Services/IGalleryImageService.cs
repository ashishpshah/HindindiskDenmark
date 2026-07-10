using HindIndisk.Api.Application.DTOs.Gallery;

namespace HindIndisk.Api.Application.Services;

public interface IGalleryImageService
{
    Task<IReadOnlyList<GalleryImageDto>> GetAllAsync();
    Task<IReadOnlyList<GalleryImageDto>> GetActiveAsync();
    Task<GalleryImageDto>                CreateAsync(CreateGalleryImageRequest request);
    Task<GalleryImageDto>                UpdateAsync(long id, UpdateGalleryImageRequest request);
    Task<bool>                           DeleteAsync(long id);
    Task<GalleryImageDto>                ReorderAsync(long id, int newSortOrder);
}
