namespace HindIndisk.Api.Application.DTOs.Admin;

public record AdminReservationDto(
    long     Id,
    string   BranchName,
    string   Date,
    string   TimeSlot,
    int      GuestCount,
    string   ContactName,
    string   ContactPhone,
    string   ContactEmail,
    string?  SpecialRequests,
    string   Status,
    DateTime CreatedAt,
    bool     IsLinkedToAccount
);
