using System.ComponentModel.DataAnnotations;

namespace HindIndisk.Api.Application.DTOs.Auth;

public class UpdateProfileRequest
{
    [Required, MaxLength(50)] public string Firstname { get; set; } = string.Empty;

    // Lastname is optional — single-name users are valid
    [MaxLength(50)] public string Lastname { get; set; } = string.Empty;

    [MaxLength(20), RegularExpression(@"^\+?[0-9]{8,15}$",
        ErrorMessage = "Phone must contain only digits with an optional + prefix and no spaces (e.g. +4512345678).")]
    public string? Phone { get; set; }
}
