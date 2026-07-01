using HindIndisk.Api.Infrastructure;

namespace HindIndisk.Api.Domain.Entities;

public class Reservation
{
    public long Id { get; set; }

    /// <summary>Null for guest bookings (no account required).</summary>
    public long? UserId { get; set; }

    public long BranchId { get; set; }
    public DateTime Date { get; set; }
    public string TimeSlot { get; set; } = string.Empty;
    public int GuestCount { get; set; }

    public string ContactName { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;

    public string? SpecialRequests { get; set; }

    /// <summary>Confirmed or Cancelled</summary>
    public string Status { get; set; } = "Confirmed";

    public DateTime CreatedAt { get; set; } = DenmarkTime.Now;

    public virtual User? User { get; set; }
    public virtual Branch Branch { get; set; } = null!;
}
