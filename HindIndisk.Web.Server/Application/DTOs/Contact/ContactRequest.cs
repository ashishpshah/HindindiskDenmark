using System.ComponentModel.DataAnnotations;

namespace HindIndisk.Api.Application.DTOs.Contact;

public class ContactRequest
{
    [Required, MaxLength(100)] public string Name    { get; set; } = string.Empty;
    [Required, EmailAddress, MaxLength(200)] public string Email { get; set; } = string.Empty;
    [MaxLength(200)]           public string Subject { get; set; } = string.Empty;
    [Required, MaxLength(2000)] public string Message { get; set; } = string.Empty;
}
