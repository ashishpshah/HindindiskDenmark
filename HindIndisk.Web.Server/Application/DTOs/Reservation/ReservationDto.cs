namespace HindIndisk.Api.Application.DTOs.Reservation;

public record ReservationDto(
    long Id,
    string BranchName,
    string Date,
    string TimeSlot,
    int GuestCount,
    string ContactName,
    string ContactPhone,
    string ContactEmail,
    string? SpecialRequests,
    string Status,
    DateTime CreatedAt,
    string? CancellationReason = null,
    long UserId = 0,
    string? OwnerName = null,
    long BranchId = 0
);
