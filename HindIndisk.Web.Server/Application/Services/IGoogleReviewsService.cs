using HindIndisk.Api.Application.DTOs.Reviews;

namespace HindIndisk.Api.Application.Services;

public interface IGoogleReviewsService
{
    Task<PlaceReviewsDto> GetReviewsAsync();
}
