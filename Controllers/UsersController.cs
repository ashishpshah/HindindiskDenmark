using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManagement.DTOs;
using TaskManagement.Services;
using TaskManagement.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using IAuthorizationService = TaskManagement.Services.IAuthorizationService;

namespace TaskManagement.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IAuthorizationService _authService;
        private readonly PMSDbContext _context;

        public UsersController(IUserService userService, IAuthorizationService authService, PMSDbContext context)
        {
            _userService = userService;
            _authService = authService;
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<UserDto>>>> GetAll()
        {
            if (!await _authService.CanViewAsync("/users"))
                return Forbid("You do not have permission to view users");
            var result = await _userService.GetAllUsersAsync();
            // Exclude SystemAdmin user (Id <= 1) from the management list
            if (result.Data != null)
            {
                result.Data = result.Data.Where(u => u.Id > 1).ToList();
            }
            return Ok(result);
        }

        [HttpGet("assignable")]
        public async Task<ActionResult<ApiResponse<List<UserDto>>>> GetAssignable()
        {
            if (!await _authService.CanViewAsync("/users"))
                return Forbid();
            var result = await _userService.GetAllUsersAsync();
            // P5-F: exclude SystemAdmin (RoleId 1) from the assignable list
            if (result.Data != null)
                result.Data = result.Data.Where(u => u.RoleId != 1 && u.IsActive).ToList();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<UserDto>>> GetById(int id)
        {
            // Disallow operations on the SystemAdmin user (id <= 1)
            if (id <= 1) return Forbid("Operation not allowed on protected user");
            if (!await _authService.CanViewAsync("/users"))
                return Forbid("You do not have permission to view users");
            var result = await _userService.GetUserByIdAsync(id);
            if (!result.Success) return NotFound(result);
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<UserDto>>> Create(CreateUserDto createUserDto)
        {
            if (!await _authService.CanCreateAsync("/users"))
                return Forbid("You do not have permission to create users");
            var result = await _userService.CreateUserAsync(createUserDto);
            if (!result.Success) return BadRequest(result);
            return CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<UserDto>>> Update(int id, UpdateUserDto updateUserDto)
        {
            if (!await _authService.CanUpdateAsync("/users"))
                return Forbid("You do not have permission to update users");
            var result = await _userService.UpdateUserAsync(id, updateUserDto);
            if (!result.Success) return NotFound(result);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
        {
            if (!await _authService.CanDeleteAsync("/users"))
                return Forbid("You do not have permission to delete users");
            var result = await _userService.DeleteUserAsync(id);
            if (!result.Success) return NotFound(result);
            return Ok(result);
        }

        [HttpPost("{id}/reset-password")]
        public async Task<ActionResult<ApiResponse<string>>> ResetPassword(int id)
        {
            // Only SystemAdmin may reset passwords
            var currentUserId = _authService.GetCurrentUserId();
            var currentUser = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == currentUserId);

            if (currentUser?.Role?.Name?.ToLower() is not ("systemadmin" or "admin"))
                return Forbid("Only SystemAdmin can reset user passwords");

            // Cannot reset the SystemAdmin's own password via this endpoint
            if (id <= 1)
                return Forbid("Operation not allowed on protected user");

            var target = await _context.Users.FindAsync(id);
            if (target == null)
                return NotFound(new ApiResponse<string> { Success = false, Message = "User not found" });

            // Generate a cryptographically random 12-character temporary password.
            var tempBytes = new byte[9];
            using (var rng = RandomNumberGenerator.Create())
                rng.GetBytes(tempBytes);
            var tempPassword = Convert.ToBase64String(tempBytes); // 12 URL-safe chars

            target.PasswordHash = PasswordHasher.HashPassword(tempPassword);
            target.UpdatedAt = AppClock.Now;
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<string> { Success = true, Message = $"Password reset to '{tempPassword}' for {target.FullName}. Ask the user to change it on first login." });
        }
    }
}
