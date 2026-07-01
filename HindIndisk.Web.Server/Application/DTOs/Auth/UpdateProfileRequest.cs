using System.ComponentModel.DataAnnotations;

namespace HindIndisk.Api.Application.DTOs.Auth;

public class UpdateProfileRequest
{
    [Required, MaxLength(50)] public string Firstname { get; set; } = string.Empty;

    // Lastname is optional — single-name users are valid
    [MaxLength(50)] public string Lastname { get; set; } = string.Empty;

    [MaxLength(20), RegularExpression(@"^(?=(?:[+ ]*\d){8,13}[+ ]*$)[+\d ]+$",
        ErrorMessage = "Phone must be 8–13 digits. You may use + and spaces (e.g. +45 12 34 56 78).")]
    public string? Phone { get; set; }
}
