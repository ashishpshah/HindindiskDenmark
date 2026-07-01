using System.ComponentModel.DataAnnotations;

namespace HindIndisk.Api.Domain.Entities;

public class PasswordOtp
{
    public long Id { get; set; }

    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(6)]
    public string OtpCode { get; set; } = string.Empty;

    public DateTime  CreatedAt      { get; set; }
    public DateTime  ExpiresAt      { get; set; }
    public bool      IsUsed         { get; set; }

    // Set after OTP is verified; used by the reset-password step
    [MaxLength(64)]
    public string?   ResetToken     { get; set; }
    public DateTime? TokenExpiresAt { get; set; }
}
