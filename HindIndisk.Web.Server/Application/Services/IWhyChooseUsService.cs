using HindIndisk.Api.Application.DTOs.Homepage;

namespace HindIndisk.Api.Application.Services;

public interface IWhyChooseUsService
{
    Task<IReadOnlyList<WhyChooseUsItemDto>> GetAllAsync();
    Task<IReadOnlyList<WhyChooseUsItemDto>> GetActiveAsync();
    Task<WhyChooseUsItemDto> CreateAsync(SaveWhyChooseUsItemRequest req);
    Task<WhyChooseUsItemDto> UpdateAsync(long id, SaveWhyChooseUsItemRequest req);
    Task<bool> DeleteAsync(long id);
}
