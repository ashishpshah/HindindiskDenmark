namespace HindIndisk.Api.Infrastructure;

/// <summary>
/// All date/time comparisons in slot generation, order scheduling, and priority
/// must use Denmark local time (Europe/Copenhagen — UTC+1 winter, UTC+2 summer).
/// </summary>
public static class DenmarkTime
{
    private static readonly TimeZoneInfo _tz = FindTz();

    private static TimeZoneInfo FindTz()
    {
        // IANA id (Linux/macOS/modern Windows with ICU)
        if (TimeZoneInfo.TryFindSystemTimeZoneById("Europe/Copenhagen", out var tz))
            return tz;
        // Windows legacy id
        if (TimeZoneInfo.TryFindSystemTimeZoneById("Central European Standard Time", out tz))
            return tz;
        // Shouldn't happen, but UTC beats server-local time
        return TimeZoneInfo.Utc;
    }

    /// <summary>Current date and time in Denmark.</summary>
    public static DateTime Now => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, _tz);

    /// <summary>Today's date in Denmark.</summary>
    public static DateOnly Today => DateOnly.FromDateTime(Now);

    /// <summary>Convert a UTC DateTime to Denmark local time.</summary>
    public static DateTime FromUtc(DateTime utc) => TimeZoneInfo.ConvertTimeFromUtc(utc, _tz);
}
