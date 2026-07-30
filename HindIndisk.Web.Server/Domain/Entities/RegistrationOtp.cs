using System.ComponentModel.DataAnnotations;

namespace HindIndisk.Api.Domain.Entities;

public class RegistrationOtp
{
    public long Id { get; set; }

    [MaxLength(100)]
    public string Firstname { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Lastname { get; set; } = string.Empty;

    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(30)]
    public string Phone { get; set; } = string.Empty;

    // BCrypt hash of the pending password — never stored in plaintext
    public string PasswordHash { get; set; } = string.Empty;

    [MaxLength(6)]
    public string OtpCode { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool     IsUsed    { get; set; }
}
