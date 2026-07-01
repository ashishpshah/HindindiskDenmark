namespace HindIndisk.Api.Application.DTOs.Admin;

public record BranchServiceClosureDto(
    long      Id,
    long      BranchId,
    string    BranchName,
    string    ServiceType,   // "Order" | "Reservation"
    DateTime  ClosedAt,
    DateTime? ReopenedAt,    // null = still closed
    string?   ClosedBy
);
