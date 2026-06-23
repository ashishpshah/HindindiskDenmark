using HindIndisk.Api.Application.DTOs.Reservation;
using HindIndisk.Api.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims; // still used for MyReservations

namespace HindIndisk.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReservationsController : ControllerBase
{
    private readonly IReservationService _reservations;

    public ReservationsController(IReservationService reservations) => _reservations = reservations;

    /// <summary>Create a reservation — always links to a customer record found/created by phone.</summary>
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create([FromBody] CreateReservationRequest request)
    {
        try
        {
            var reservation = await _reservations.CreateAsync(request);
            return Ok(reservation);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Check for duplicate reservations by phone/email at the same date &amp; time slot.</summary>
    [HttpGet("check-duplicate")]
    [AllowAnonymous]
    public async Task<IActionResult> CheckDuplicate(
        [FromQuery] string  phone,
        [FromQuery] string? email,
        [FromQuery] string  date,
        [FromQuery] string  timeSlot)
    {
        var results = await _reservations.CheckDuplicateAsync(phone, email, date, timeSlot);
        return Ok(results);
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
