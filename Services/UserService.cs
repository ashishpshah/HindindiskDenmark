using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TaskManagement.Data;
using TaskManagement.DTOs;
using AutoMapper;

namespace TaskManagement.Services
{
    public interface IUserService
    {
        Task<ApiResponse<List<UserDto>>> GetAllUsersAsync();
        Task<ApiResponse<UserDto>> GetUserByIdAsync(int id);
        Task<ApiResponse<UserDto>> CreateUserAsync(CreateUserDto createUserDto);
        Task<ApiResponse<UserDto>> UpdateUserAsync(int id, UpdateUserDto updateUserDto);
        Task<ApiResponse<bool>> DeleteUserAsync(int id);
    }

    public class UserService : IUserService
    {
        private readonly PMSDbContext _context;
        private readonly IMapper _mapper;

        public UserService(PMSDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        // The single System Admin (RoleId 1) is the seeded account; no one else may hold it.
        private const int SystemAdminRoleId = 1;

        public async Task<ApiResponse<List<UserDto>>> GetAllUsersAsync()
        {
            var users = await _context.Users.Include(u => u.Role).ToListAsync();
            return new ApiResponse<List<UserDto>> { Success = true, Data = _mapper.Map<List<UserDto>>(users) };
        }

        public async Task<ApiResponse<UserDto>> GetUserByIdAsync(int id)
        {
            var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return new ApiResponse<UserDto> { Success = false, Message = "User not found" };
            return new ApiResponse<UserDto> { Success = true, Data = _mapper.Map<UserDto>(user) };
        }

        public async Task<ApiResponse<UserDto>> CreateUserAsync(CreateUserDto createUserDto)
        {
            var firstName = (createUserDto.FirstName ?? string.Empty).Trim();
            var lastName = (createUserDto.LastName ?? string.Empty).Trim();
            var userName = (createUserDto.UserName ?? string.Empty).Trim();
            var email = (createUserDto.Email ?? string.Empty).Trim();

            if (string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName))
                return new ApiResponse<UserDto> { Success = false, Message = "First name and last name are required." };
            if (string.IsNullOrWhiteSpace(userName))
                return new ApiResponse<UserDto> { Success = false, Message = "Username is required." };
            if (string.IsNullOrWhiteSpace(email))
                return new ApiResponse<UserDto> { Success = false, Message = "Email is required." };
            if (string.IsNullOrWhiteSpace(createUserDto.Password) || createUserDto.Password.Length < 6)
                return new ApiResponse<UserDto> { Success = false, Message = "Password must be at least 6 characters." };

            var unameLower = userName.ToLower();
            var emailLower = email.ToLower();
            if (await _context.Users.AnyAsync(u => u.UserName.ToLower() == unameLower || u.Email.ToLower() == emailLower))
            {
                return new ApiResponse<UserDto> { Success = false, Message = "Username or Email already exists" };
            }

            // Guard: System Admin is a single, seeded account — cannot be assigned to others.
            if (createUserDto.RoleId == SystemAdminRoleId)
                return new ApiResponse<UserDto> { Success = false, Message = "The System Admin role cannot be assigned to additional users." };

            var user = _mapper.Map<User>(createUserDto);
            user.FirstName = firstName;
            user.LastName = lastName;
            user.UserName = userName;
            user.Email = email;
            user.FullName = $"{firstName} {lastName}".Trim();
            user.PasswordHash = PasswordHasher.HashPassword(createUserDto.Password);
            user.IsActive = createUserDto.IsActive;
            user.CreatedAt = AppClock.Now;

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return await GetUserByIdAsync(user.Id);
        }

        public async Task<ApiResponse<UserDto>> UpdateUserAsync(int id, UpdateUserDto updateUserDto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return new ApiResponse<UserDto> { Success = false, Message = "User not found" };

            // Guard: can't promote another user into System Admin (only the seeded admin keeps RoleId 1)
            if (updateUserDto.RoleId == SystemAdminRoleId && user.RoleId != SystemAdminRoleId)
                return new ApiResponse<UserDto> { Success = false, Message = "The System Admin role cannot be assigned to additional users." };

            var firstName = (updateUserDto.FirstName ?? string.Empty).Trim();
            var lastName = (updateUserDto.LastName ?? string.Empty).Trim();
            var userName = (updateUserDto.UserName ?? string.Empty).Trim();
            var email = (updateUserDto.Email ?? string.Empty).Trim();

            if (string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName))
                return new ApiResponse<UserDto> { Success = false, Message = "First name and last name are required." };
            if (string.IsNullOrWhiteSpace(userName))
                return new ApiResponse<UserDto> { Success = false, Message = "Username is required." };
            if (string.IsNullOrWhiteSpace(email))
                return new ApiResponse<UserDto> { Success = false, Message = "Email is required." };

            // Case-insensitive uniqueness excluding the current user.
            var unameLower = userName.ToLower();
            var emailLower = email.ToLower();
            if (await _context.Users.AnyAsync(u => u.Id != id && (u.UserName.ToLower() == unameLower || u.Email.ToLower() == emailLower)))
                return new ApiResponse<UserDto> { Success = false, Message = "Username or Email already exists" };

            user.FirstName = firstName;
            user.LastName = lastName;
            user.UserName = userName;
            user.FullName = $"{firstName} {lastName}".Trim();
            user.Email = email;
            user.ContactNo = updateUserDto.ContactNo;
            if (!string.IsNullOrEmpty(updateUserDto.AvatarUrl))
                user.AvatarUrl = updateUserDto.AvatarUrl;
            // Never move the seeded System Admin off RoleId 1; for others honor the requested role.
            if (user.RoleId != SystemAdminRoleId && updateUserDto.RoleId > 0)
                user.RoleId = updateUserDto.RoleId;
            user.IsActive = updateUserDto.IsActive;
            user.UpdatedAt = AppClock.Now;

            await _context.SaveChangesAsync();
            return await GetUserByIdAsync(id);
        }

        public async Task<ApiResponse<bool>> DeleteUserAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return new ApiResponse<bool> { Success = false, Message = "User not found" };

            user.IsActive = false;
            await _context.SaveChangesAsync();
            return new ApiResponse<bool> { Success = true, Data = true };
        }
    }
}
