using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
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
    private readonly IConfiguration      _config;
    private readonly IEmailService        _email;

    const int OtpExpiryMinutes      = 10;
    const int OtpCooldownSeconds    = 60;
    const int OtpDailyLimit         = 3;
    const int ResetTokenExpiryMinutes = 15;

    public AuthService(
        ApplicationDbContext db,
        IConfiguration       config,
        IEmailService        email)
    {
        _db     = db;
        _config = config;
        _email  = email;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var normalizedEmail = request.Email.Trim().ToLower();

        if (await _db.Users.AnyAsync(u => u.Email == normalizedEmail))
            throw new InvalidOperationException("Email is already registered.");

        var user = new User
        {
            Firstname    = request.Firstname,
            Lastname     = request.Lastname,
            Email        = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Phone        = string.IsNullOrWhiteSpace(request.Phone) ? string.Empty : request.Phone.Trim(),
            RoleId       = 3, // Customer
            CreatedAt    = DenmarkTime.Now,
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        // Load role for the token / DTO
        await _db.Entry(user).Reference(u => u.Role).LoadAsync();

        // Welcome email — fire-and-forget
        if (!string.IsNullOrWhiteSpace(user.Email))
            _ = _email.SendWelcomeEmailAsync(user.Email, $"{user.Firstname} {user.Lastname}".Trim());

        return new AuthResponse(GenerateToken(user), ToDto(user));
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _db.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Email == request.Email.Trim().ToLower());

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
        user.Phone     = string.IsNullOrWhiteSpace(request.Phone) ? string.Empty : request.Phone.Trim();
        await _db.SaveChangesAsync();
        return ToDto(user);
    }

    public async Task ForgotPasswordAsync(string email)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);
        if (user is null) return; // silent — don't reveal whether email exists

        var now        = DenmarkTime.Now;
        var todayStart = now.Date;

        // If a valid (non-expired, non-used) OTP already exists, tell the client to
        // skip straight to the OTP input — regardless of daily limit or cooldown.
        var activeOtp = await _db.PasswordOtps
            .Where(o => o.Email == normalizedEmail && !o.IsUsed && o.ExpiresAt > now)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync();

        if (activeOtp is not null)
            throw new InvalidOperationException("OTP_ALREADY_ACTIVE");

        // Max 3 OTPs per email per day
        var countToday = await _db.PasswordOtps
            .CountAsync(o => o.Email == normalizedEmail && o.CreatedAt >= todayStart);
        if (countToday >= OtpDailyLimit)
            throw new InvalidOperationException("Maximum OTP requests reached for today. Please try again tomorrow.");

        // 1-minute cooldown between OTP requests
        var lastOtp = await _db.PasswordOtps
            .Where(o => o.Email == normalizedEmail)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync();

        if (lastOtp is not null)
        {
            var secondsSinceLast = (now - lastOtp.CreatedAt).TotalSeconds;
            if (secondsSinceLast < OtpCooldownSeconds)
            {
                var wait = (int)Math.Ceiling(OtpCooldownSeconds - secondsSinceLast);
                throw new InvalidOperationException($"Please wait {wait} second{(wait == 1 ? "" : "s")} before requesting another OTP.");
            }
        }

        var otp = Random.Shared.Next(100_000, 1_000_000).ToString();

        _db.PasswordOtps.Add(new PasswordOtp
        {
            Email     = normalizedEmail,
            OtpCode   = otp,
            CreatedAt = now,
            ExpiresAt = now.AddMinutes(OtpExpiryMinutes),
            IsUsed    = false,
        });
        await _db.SaveChangesAsync();

        _ = _email.SendOtpEmailAsync(email.Trim(), $"{user.Firstname} {user.Lastname}".Trim(), otp);
    }

    public async Task<VerifyOtpResponse> VerifyOtpAsync(VerifyOtpRequest request)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var now             = DenmarkTime.Now;

        var otpRecord = await _db.PasswordOtps
            .Where(o => o.Email    == normalizedEmail
                     && o.OtpCode  == request.Otp
                     && !o.IsUsed
                     && o.ExpiresAt > now)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync()
            ?? throw new InvalidOperationException("Invalid or expired OTP. Please request a new one.");

        var resetToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        otpRecord.ResetToken     = resetToken;
        otpRecord.TokenExpiresAt = now.AddMinutes(ResetTokenExpiryMinutes);
        otpRecord.ExpiresAt      = now; // expire immediately — prevents re-verification and unblocks new OTP requests
        await _db.SaveChangesAsync();

        return new VerifyOtpResponse(resetToken);
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var now             = DenmarkTime.Now;

        var otpRecord = await _db.PasswordOtps
            .Where(o => o.Email          == normalizedEmail
                     && o.ResetToken     == request.ResetToken
                     && !o.IsUsed
                     && o.TokenExpiresAt > now)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync()
            ?? throw new InvalidOperationException("Invalid or expired reset token. Please start over.");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail)
            ?? throw new InvalidOperationException("User not found.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        otpRecord.IsUsed  = true;
        await _db.SaveChangesAsync();
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
            new Claim(ClaimTypes.Email,          user.Email ?? string.Empty),
            new Claim(ClaimTypes.Role,           user.Role.Name),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer:             jwt["Issuer"],
            audience:           jwt["Audience"],
            claims:             claims,
            expires:            DenmarkTime.Now.AddMinutes(expiry),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static UserDto ToDto(User user) =>
        new(user.Id, user.Firstname, user.Lastname, user.Email,
            string.IsNullOrWhiteSpace(user.Phone) ? null : user.Phone,
            user.Role.Name);
}
