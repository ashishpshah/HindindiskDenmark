using HindIndisk.Api.Application.DTOs.Reservation;
using HindIndisk.Api.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HindIndisk.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReservationsController : ControllerBase
{
    private readonly IReservationService _reservations;

    public ReservationsController(IReservationService reservations) => _reservations = reservations;

    /// <summary>Create a reservation. Auth optional — authenticated users get it linked to their account.</summary>
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create([FromBody] CreateReservationRequest request)
    {
        long? userId = null;
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (claim is not null && long.TryParse(claim, out var id))
            userId = id;

        try
        {
            var reservation = await _reservations.CreateAsync(userId, request);
            return Ok(reservation);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Returns reservations linked to the authenticated user's account.</summary>
    [HttpGet("my")]
    [Authorize]
    public async Task<IActionResult> MyReservations()
    {
        var userId = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var list   = await _reservations.GetMyAsync(userId);
        return Ok(list);
    }
}
