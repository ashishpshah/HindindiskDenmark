namespace HindIndisk.Api.Application.DTOs.Closure;

public record CreateBranchClosureRequest(
    string  Scope,        // "Restaurant" | "Pickup" | "Delivery"
    string  ClosureType,  // "DateRange" | "Weekly"
    string? StartDate,    // "yyyy-MM-dd" (required for DateRange)
    string? EndDate,      // "yyyy-MM-dd" (required for DateRange)
    int?    DayOfWeek,    // 0 = Sunday .. 6 = Saturday (required for Weekly)
    string? StartTime,    // "HH:mm" optional — null = all-day
    string? EndTime,      // "HH:mm" optional — null = all-day
    string? Note
);
