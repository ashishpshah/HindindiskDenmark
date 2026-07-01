using HindIndisk.Api.Application.DTOs.Location;
using HindIndisk.Api.Application.DTOs.Schedule;
using HindIndisk.Api.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace HindIndisk.Api.Controllers;

[ApiController]
[Route("api/locations")]
public class LocationsController : ControllerBase
{
    private readonly ILocationService _locations;
    private readonly SlotService      _slots;

    public LocationsController(ILocationService locations, SlotService slots)
    {
        _locations = locations;
        _slots     = slots;
    }

    /// <summary>All restaurant branches with address, hours, and contact details.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<BranchDto>), 200)]
    public async Task<IActionResult> GetBranches()
        => Ok(await _locations.GetBranchesAsync());

    /// <summary>Available time slots for a branch on a given date.</summary>
    /// <param name="branchId">Branch ID</param>
    /// <param name="date">Date in YYYY-MM-DD format</param>
    /// <param name="type">reservation | order</param>
    [HttpGet("slots")]
    [ProducesResponseType(typeof(SlotResultDto), 200)]
    public async Task<IActionResult> GetSlots(
        [FromQuery] long   branchId,
        [FromQuery] string date,
        [FromQuery] string type = "reservation")
    {
        if (branchId <= 0 || string.IsNullOrWhiteSpace(date))
            return BadRequest("branchId and date are required.");

        if (!DateOnly.TryParse(date, out _))
            return BadRequest("date must be in YYYY-MM-DD format.");

        var result = await _slots.GetAvailableSlotsAsync(branchId, date, type);
        return Ok(result);
    }
}
