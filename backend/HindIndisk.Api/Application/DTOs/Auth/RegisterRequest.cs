using System.ComponentModel.DataAnnotations;

namespace HindIndisk.Api.Application.DTOs.Auth;

public class RegisterRequest
{
    [Required]
    [MaxLength(100)]
    public string Firstname { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Lastname { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;

    [MaxLength(20), RegularExpression(@"^\+?[0-9]{8,15}$",
        ErrorMessage = "Phone must contain only digits with an optional + prefix and no spaces (e.g. +4512345678).")]
    public string Phone { get; set; } = string.Empty;
}
