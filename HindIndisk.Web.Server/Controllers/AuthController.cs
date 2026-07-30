using System.Security.Claims;
using HindIndisk.Api.Application.DTOs.Auth;
using HindIndisk.Api.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HindIndisk.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ApiBaseController
{
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth) => _auth = auth;

    /// <summary>Start registering a new customer account — sends a 6-digit OTP to the given email.</summary>
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        try
        {
            await _auth.StartRegistrationAsync(request);
            return Ok(new { message = "OTP sent to your email." });
        }
        catch (InvalidOperationException ex)
        {
            await LogExAsync(ex, 400);
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Verify the registration OTP and create the customer account.</summary>
    [HttpPost("register/verify-otp")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), 200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> VerifyRegistrationOtp([FromBody] VerifyRegistrationOtpRequest request)
    {
        try
        {
            return Ok(await _auth.VerifyRegistrationOtpAsync(request));
        }
        catch (InvalidOperationException ex)
        {
            await LogExAsync(ex, 400);
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
            await LogExAsync(ex, 401);
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
            await LogExAsync(ex, 404);
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
            await LogExAsync(ex, 400);
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Send a 6-digit OTP to the supplied email for password reset.</summary>
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        try
        {
            await _auth.ForgotPasswordAsync(request.Email);
            return Ok(new { message = "OTP sent to your email." });
        }
        catch (InvalidOperationException ex)
        {
            // Surfaces unregistered-email, rate-limit, and email delivery failures to the client
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Verify OTP — returns a short-lived reset token to use in reset-password.</summary>
    [HttpPost("verify-otp")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
    {
        try
        {
            var result = await _auth.VerifyOtpAsync(request);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            await LogExAsync(ex, 400);
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Verify the current user's password (for sensitive operations).</summary>
    [HttpPost("verify-password")]
    [Authorize]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> VerifyPassword([FromBody] VerifyPasswordRequest request)
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!long.TryParse(raw, out var userId))
            return Unauthorized();

        try
        {
            await _auth.VerifyPasswordAsync(userId, request.Password);
            return Ok();
        }
        catch (InvalidOperationException ex)
        {
            await LogExAsync(ex, 400);
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Reset password using the token issued by verify-otp.</summary>
    [HttpPost("reset-password")]

    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        try
        {
            await _auth.ResetPasswordAsync(request);
            return Ok(new { message = "Password reset successfully." });
        }
        catch (InvalidOperationException ex)
        {
            await LogExAsync(ex, 400);
            return BadRequest(new { message = ex.Message });
        }
    }
}
