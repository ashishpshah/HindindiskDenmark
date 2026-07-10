namespace HindIndisk.Api.Application.DTOs.Closure;

public record BranchClosureDto(
    long      Id,
    long      BranchId,
    string    Scope,        // "Restaurant" | "Pickup" | "Delivery"
    string    ClosureType,  // "DateRange" | "Weekly"
    string?   StartDate,    // "yyyy-MM-dd" (DateRange)
    string?   EndDate,      // "yyyy-MM-dd" (DateRange)
    int?      DayOfWeek,    // 0 = Sunday .. 6 = Saturday (Weekly)
    string?   StartTime,    // "HH:mm" — null = all-day
    string?   EndTime,      // "HH:mm" — null = all-day
    string?   Note,
    string?   NoteDa,
    int       DisplayBeforeDays,
    DateTime  CreatedAt,
    string?   CreatedBy
);
