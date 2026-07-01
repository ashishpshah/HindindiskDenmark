using System.ComponentModel.DataAnnotations;

namespace HindIndisk.Api.Application.DTOs.Auth;

public class ResetPasswordRequest
{
    [Required, EmailAddress, MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(1)]
    public string ResetToken { get; set; } = string.Empty;

    [Required, MinLength(8, ErrorMessage = "Password must be at least 8 characters.")]
    public string NewPassword { get; set; } = string.Empty;
}
