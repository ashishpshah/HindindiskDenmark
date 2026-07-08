namespace HindIndisk.Api.Application.DTOs.Closure;

public record ConflictItemDto(
    long   Id,
    string ContactName,
    string Date,
    string Time
);

public record ClosureConflictsDto(
    IReadOnlyList<ConflictItemDto> Reservations,
    IReadOnlyList<ConflictItemDto> Orders
);

public record CancelAffectedRequest(
    long[]  ReservationIds,
    long[]  OrderIds,
    string? Reason
);
