using HindIndisk.Api.Application.DTOs.Location;
using HindIndisk.Api.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace HindIndisk.Api.Controllers;

[ApiController]
[Route("api/locations")]
public class LocationsController : ControllerBase
{
    private readonly ILocationService _locations;

    public LocationsController(ILocationService locations) => _locations = locations;

    /// <summary>All restaurant branches with address, hours, and contact details.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<BranchDto>), 200)]
    public async Task<IActionResult> GetBranches()
        => Ok(await _locations.GetBranchesAsync());
}
