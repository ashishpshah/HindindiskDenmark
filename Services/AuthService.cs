using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TaskManagement.Data;
using TaskManagement.DTOs;

namespace TaskManagement.Services
{
    public interface IAuthService
    {
        Task<ApiResponse<LoginResponseDto>> LoginAsync(LoginDto loginDto);
        Task<ApiResponse<LoginResponseDto>> RegisterAsync(RegisterDto registerDto);
        Task<AvailabilityDto> CheckAvailabilityAsync(string? userName, string? email, int? excludeUserId);
    }

    public class AuthService : IAuthService
    {
        private readonly PMSDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthService(PMSDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<ApiResponse<LoginResponseDto>> LoginAsync(LoginDto loginDto)
        {
            var identifier = (loginDto.UsernameOrEmail ?? loginDto.Email ?? string.Empty).Trim();
            User? user;
            if (identifier.Contains('@'))
            {
                // Email login: case-insensitive
                var emailLower = identifier.ToLower();
                user = await _context.Users
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == emailLower);
            }
            else
            {
                // Username login: case-sensitive — query CI candidates then enforce in C#
                var usernameLower = identifier.ToLower();
                var candidates = await _context.Users
                    .Include(u => u.Role)
                    .Where(u => u.UserName.ToLower() == usernameLower)
                    .ToListAsync();
                user = candidates.FirstOrDefault(u => string.Equals(u.UserName, identifier, StringComparison.Ordinal));
            }

            if (user == null || !PasswordHasher.VerifyPassword(loginDto.Password, user.PasswordHash))
                return new ApiResponse<LoginResponseDto> { Success = false, Message = "Invalid username/email or password" };

            // F-05: block deactivated accounts — use the same generic message to avoid info leak
            if (!user.IsActive)
                return new ApiResponse<LoginResponseDto> { Success = false, Message = "Invalid username/email or password" };

            return new ApiResponse<LoginResponseDto> { Success = true, Data = BuildLoginResponse(user) };
        }

        public async Task<ApiResponse<LoginResponseDto>> RegisterAsync(RegisterDto registerDto)
        {
            var firstName = (registerDto.FirstName ?? string.Empty).Trim();
            var lastName  = (registerDto.LastName  ?? string.Empty).Trim();
            var userName  = (registerDto.UserName  ?? string.Empty).Trim();
            var email     = (registerDto.Email     ?? string.Empty).Trim();

            if (string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName))
                return new ApiResponse<LoginResponseDto> { Success = false, Message = "First name and last name are required." };
            if (string.IsNullOrWhiteSpace(userName))
                return new ApiResponse<LoginResponseDto> { Success = false, Message = "Username is required." };
            if (string.IsNullOrWhiteSpace(email))
                return new ApiResponse<LoginResponseDto> { Success = false, Message = "Email is required." };

            // F-37: validate email format
            try { _ = new System.Net.Mail.MailAddress(email); }
            catch { return new ApiResponse<LoginResponseDto> { Success = false, Message = "Invalid email format." }; }

            if (string.IsNullOrWhiteSpace(registerDto.Password) || registerDto.Password.Length < 6)
                return new ApiResponse<LoginResponseDto> { Success = false, Message = "Password must be at least 6 characters." };

            var unameLower = userName.ToLower();
            var emailLower = email.ToLower();
            if (await _context.Users.AnyAsync(u => u.UserName.ToLower() == unameLower || u.Email.ToLower() == emailLower))
                return new ApiResponse<LoginResponseDto> { Success = false, Message = "Username or Email already exists." };

            // Self-registration gets the lowest-privilege NON-admin role that exists.
            // Never auto-assign System Admin (RoleId 1).
            var defaultRole = await _context.Roles
                .Where(r => r.Id != 1 && !r.IsAdmin)
                .OrderBy(r => r.Level)
                .FirstOrDefaultAsync();
            if (defaultRole == null)
                return new ApiResponse<LoginResponseDto> { Success = false, Message = "Registration is not available — no assignable role is configured. Contact an administrator." };

            var user = new User
            {
                FirstName  = firstName,
                LastName   = lastName,
                UserName   = userName,
                Email      = email,
                FullName   = $"{firstName} {lastName}".Trim(),
                ContactNo  = string.IsNullOrWhiteSpace(registerDto.ContactNo) ? null : registerDto.ContactNo!.Trim(),
                PasswordHash = PasswordHasher.HashPassword(registerDto.Password),
                RoleId     = defaultRole.Id,
                IsActive   = true,
                CreatedAt  = AppClock.Now
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            user.Role = defaultRole;
            return new ApiResponse<LoginResponseDto> { Success = true, Data = BuildLoginResponse(user) };
        }

        public async Task<AvailabilityDto> CheckAvailabilityAsync(string? userName, string? email, int? excludeUserId)
        {
            var result = new AvailabilityDto();

            var uname = (userName ?? string.Empty).Trim().ToLower();
            if (!string.IsNullOrEmpty(uname))
            {
                result.UserNameChecked = true;
                result.UserNameAvailable = !await _context.Users
                    .AnyAsync(u => u.UserName.ToLower() == uname && (!excludeUserId.HasValue || u.Id != excludeUserId.Value));
            }

            var mail = (email ?? string.Empty).Trim().ToLower();
            if (!string.IsNullOrEmpty(mail))
            {
                result.EmailChecked = true;
                result.EmailAvailable = !await _context.Users
                    .AnyAsync(u => u.Email.ToLower() == mail && (!excludeUserId.HasValue || u.Id != excludeUserId.Value));
            }

            return result;
        }

        private LoginResponseDto BuildLoginResponse(User user)
        {
            var token   = GenerateJwtToken(user);
            var isAdmin = user.RoleId == 1 || (user.Role?.IsAdmin ?? false);

            return new LoginResponseDto
            {
                Token = token,
                User  = new UserDto
                {
                    Id          = user.Id,
                    UserName    = user.UserName,
                    Email       = user.Email,
                    FirstName   = user.FirstName,
                    LastName    = user.LastName,
                    FullName    = user.FullName,
                    RoleId      = user.RoleId,
                    RoleName    = user.Role?.Name,
                    IsAdmin     = isAdmin,
                    AvatarUrl   = user.AvatarUrl,
                    ContactNo   = user.ContactNo,
                    IsActive    = user.IsActive
                }
            };
        }

        private string GenerateJwtToken(User user)
        {
            var jwtKey    = _configuration["JwtSettings:Key"] ?? throw new InvalidOperationException("JwtSettings:Key is not configured.");
            var issuer    = _configuration["JwtSettings:Issuer"]   ?? "PMS";
            var audience  = _configuration["JwtSettings:Audience"] ?? "PMS";
            var expiryMin = int.TryParse(_configuration["JwtSettings:ExpiryMinutes"], out var m) ? m : 420;

            var key         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email,          user.Email),
                new Claim(ClaimTypes.Role,           user.Role?.Name ?? "User"),
                new Claim("role",                    user.Role?.Name ?? "User")
            };

            var token = new JwtSecurityToken(
                issuer:            issuer,
                audience:          audience,
                claims:            claims,
                expires:           DateTime.UtcNow.AddMinutes(expiryMin),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    public class LoginDto
    {
        public string? UsernameOrEmail { get; set; }
        public string Email    { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class RegisterDto
    {
        public string  FirstName { get; set; } = string.Empty;
        public string  LastName  { get; set; } = string.Empty;
        public string  UserName  { get; set; } = string.Empty;
        public string  Email     { get; set; } = string.Empty;
        public string? ContactNo { get; set; }
        public string  Password  { get; set; } = string.Empty;
    }

    public class AvailabilityDto
    {
        public bool UserNameChecked   { get; set; }
        public bool UserNameAvailable { get; set; }
        public bool EmailChecked      { get; set; }
        public bool EmailAvailable    { get; set; }
    }

    public class LoginResponseDto
    {
        public string  Token { get; set; } = string.Empty;
        public UserDto User  { get; set; } = new();
    }
}
