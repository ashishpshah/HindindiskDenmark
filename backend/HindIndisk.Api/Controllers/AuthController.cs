using System.Security.Claims;
using HindIndisk.Api.Application.DTOs.Auth;
using HindIndisk.Api.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HindIndisk.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth) => _auth = auth;

    /// <summary>Register a new customer account.</summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), 200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        try
        {
            return Ok(await _auth.RegisterAsync(request));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Login and receive a JWT token.</summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), 200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        try
        {
            return Ok(await _auth.LoginAsync(request));
        }
        catch (InvalidOperationException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    /// <summary>Return the authenticated user's profile.</summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserDto), 200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> Me()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!long.TryParse(raw, out var userId))
            return Unauthorized();

        try
        {
            return Ok(await _auth.GetMeAsync(userId));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>Update the authenticated user's name and phone.</summary>
    [HttpPut("profile")]
    [Authorize]
    [ProducesResponseType(typeof(UserDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!long.TryParse(raw, out var userId))
            return Unauthorized();

        try
        {
            return Ok(await _auth.UpdateProfileAsync(userId, request));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
