using HindIndisk.Api.Application.DTOs.HeroSlide;

namespace HindIndisk.Api.Application.Services;

public interface IHeroSlideService
{
    Task<IReadOnlyList<HeroSlideDto>> GetAllAsync();
    Task<HeroSlideDto?>               GetByIdAsync(long id);
    Task<HeroSlideDto>                CreateAsync(CreateHeroSlideRequest request);
    Task<HeroSlideDto>                UpdateAsync(long id, UpdateHeroSlideRequest request);
    Task<bool>                        DeleteAsync(long id);
    Task<HeroSlideDto>                ReorderAsync(long id, int newSortOrder);
    Task<IReadOnlyList<HeroSlideDto>> GetActiveAsync();
}