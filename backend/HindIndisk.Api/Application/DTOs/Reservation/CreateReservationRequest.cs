using System.ComponentModel.DataAnnotations;

namespace HindIndisk.Api.Application.DTOs.Reservation;

public class CreateReservationRequest
{
    [Required]
    public long BranchId { get; set; }

    /// <summary>Date portion only — ISO 8601 date string (yyyy-MM-dd).</summary>
    [Required]
    public string Date { get; set; } = string.Empty;

    /// <summary>Time as HH:mm string, e.g. "19:00".</summary>
    [Required]
    public string TimeSlot { get; set; } = string.Empty;

    [Range(1, 20)]
    public int GuestCount { get; set; } = 2;

    [Required]
    [MaxLength(200)]
    public string ContactName { get; set; } = string.Empty;

    [Required]
    [Phone]
    [MaxLength(50)]
    public string ContactPhone { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(200)]
    public string ContactEmail { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? SpecialRequests { get; set; }
}
