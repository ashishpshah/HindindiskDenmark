using HindIndisk.Api.Application.DTOs.Homepage;

namespace HindIndisk.Api.Application.Services;

public interface IHomeStorySectionService
{
    Task<HomeStorySectionDto> GetAsync();
    Task<HomeStorySectionDto> UpdateAsync(UpdateHomeStorySectionRequest req);
}
