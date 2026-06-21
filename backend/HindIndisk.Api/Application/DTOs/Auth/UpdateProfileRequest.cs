using System.ComponentModel.DataAnnotations;

namespace HindIndisk.Api.Application.DTOs.Auth;

public class UpdateProfileRequest
{
    [Required, MaxLength(50)] public string  Firstname { get; set; } = string.Empty;
    [Required, MaxLength(50)] public string  Lastname  { get; set; } = string.Empty;
    [MaxLength(20)]           public string? Phone     { get; set; }
}
