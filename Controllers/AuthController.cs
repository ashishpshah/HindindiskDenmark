using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManagement.DTOs;
using TaskManagement.Services;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TaskManagement.Data;
using System.Security.Claims;

namespace TaskManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly PMSDbContext _context;

        public AuthController(IAuthService authService, PMSDbContext context)
        {
            _authService = authService;
            _context = context;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<LoginResponseDto>>> Login([FromBody] LoginDto loginDto)
        {
            var result = await _authService.LoginAsync(loginDto);
            if (!result.Success) return Unauthorized(result);
            return Ok(result);
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<LoginResponseDto>>> Register([FromBody] RegisterDto registerDto)
        {
            var result = await _authService.RegisterAsync(registerDto);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        [Authorize]
        [HttpGet("check-availability")]
        public async Task<ActionResult<ApiResponse<AvailabilityDto>>> CheckAvailability(
            [FromQuery] string? userName, [FromQuery] string? email, [FromQuery] int? excludeUserId)
        {
            var result = await _authService.CheckAvailabilityAsync(userName, email, excludeUserId);
            return Ok(new ApiResponse<AvailabilityDto> { Success = true, Data = result });
        }

        [Authorize]
        [HttpGet("validate")]
        public async Task<ActionResult<ApiResponse<UserDto>>> Validate()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null || !int.TryParse(userIdClaim, out var userId))
                return Unauthorized(new ApiResponse<UserDto> { Success = false, Message = "Invalid token" });

            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return NotFound(new ApiResponse<UserDto> { Success = false, Message = "User not found" });

            if (!user.IsActive)
                return Unauthorized(new ApiResponse<UserDto> { Success = false, Message = "Account is inactive" });

            var userDto = new UserDto
            {
                Id = user.Id,
                UserName = user.UserName,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                FullName = user.FullName,
                RoleId = user.RoleId,
                RoleName = user.Role?.Name,
                IsAdmin = user.RoleId == 1 || (user.Role?.IsAdmin ?? false),  // F-33: was user.Id == 1
                AvatarUrl = user.AvatarUrl,
                ContactNo = user.ContactNo,
                IsActive = user.IsActive
            };

            return Ok(new ApiResponse<UserDto> { Success = true, Data = userDto });
        }
    }
}
