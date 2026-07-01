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
    [MaxLength(60)]
    public string? Firstname { get; set; }

    [MaxLength(60)]
    public string? Lastname { get; set; }

    [MaxLength(20), RegularExpression(@"^(?=(?:[+ ]*\d){8,13}[+ ]*$)[+\d ]+$",
        ErrorMessage = "Phone must be 8–13 digits. You may use + and spaces (e.g. +45 12 34 56 78).")]
    public string? Phone { get; set; }

    [Required, EmailAddress, MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? SpecialRequests { get; set; }
}
