using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using HindIndisk.Api.Application.DTOs.Auth;
using HindIndisk.Api.Domain.Entities;
using HindIndisk.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace HindIndisk.Api.Application.Services;

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(ApplicationDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        if (await _db.Users.AnyAsync(u => u.Email == request.Email))
            throw new InvalidOperationException("Email is already registered.");

        var user = new User
        {
            Firstname    = request.Firstname,
            Lastname     = request.Lastname,
            Email        = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Phone        = request.Phone,
            RoleId       = 3, // Customer
            CreatedAt    = DateTime.UtcNow,
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        // Load role for the token / DTO
        await _db.Entry(user).Reference(u => u.Role).LoadAsync();

        return new AuthResponse(GenerateToken(user), ToDto(user));
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _db.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new InvalidOperationException("Invalid email or password.");

        return new AuthResponse(GenerateToken(user), ToDto(user));
    }

    public async Task<UserDto> GetMeAsync(long userId)
    {
        var user = await _db.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new InvalidOperationException("User not found.");

        return ToDto(user);
    }

    public async Task<UserDto> UpdateProfileAsync(long userId, UpdateProfileRequest request)
    {
        var user = await _db.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new InvalidOperationException("User not found.");

        user.Firstname = request.Firstname;
        user.Lastname  = request.Lastname;
        user.Phone     = request.Phone ?? user.Phone;
        await _db.SaveChangesAsync();
        return ToDto(user);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private string GenerateToken(User user)
    {
        var jwt     = _config.GetSection("Jwt");
        var key     = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Secret"]!));
        var creds   = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry  = int.Parse(jwt["ExpiryMinutes"] ?? "1440");

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email,          user.Email),
            new Claim(ClaimTypes.Role,           user.Role.Name),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer:             jwt["Issuer"],
            audience:           jwt["Audience"],
            claims:             claims,
            expires:            DateTime.UtcNow.AddMinutes(expiry),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static UserDto ToDto(User user) =>
        new(user.Id, user.Firstname, user.Lastname, user.Email, user.Phone, user.Role.Name);
}
