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

    // Customer identity — used to find or create a customer record (RoleId = 3)
    [Required, MaxLength(60)]
    public string Firstname { get; set; } = string.Empty;

    [Required, MaxLength(60)]
    public string Lastname { get; set; } = string.Empty;

    [Required, Phone, MaxLength(50)]
    public string Phone { get; set; } = string.Empty;

    [EmailAddress, MaxLength(200)]
    public string? Email { get; set; }

    [MaxLength(1000)]
    public string? SpecialRequests { get; set; }
}
