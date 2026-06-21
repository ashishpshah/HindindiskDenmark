using HindIndisk.Api.Application.DTOs.Location;

namespace HindIndisk.Api.Application.Services;

public interface ILocationService
{
    Task<IReadOnlyList<BranchDto>> GetBranchesAsync();
}
