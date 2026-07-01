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

    [MaxLength(20), RegularExpression(@"^(?=(?:[+ ]*\d){8,13}[+ ]*$)[+\d ]+$",
        ErrorMessage = "Phone must be 8–13 digits. You may use + and spaces (e.g. +45 12 34 56 78).")]
    public string? Phone { get; set; }
}
