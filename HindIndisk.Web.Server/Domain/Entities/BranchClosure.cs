namespace HindIndisk.Api.Domain.Entities;

/// <summary>
/// A scheduled closure for a branch. One row expresses either a one-off date
/// range (StartDate..EndDate) or a recurring weekly day, scoped to the whole
/// restaurant or to a single fulfillment type (pickup / delivery).
/// </summary>
public class BranchClosure
{
    public long      Id          { get; set; }
    public long      BranchId    { get; set; }
    public string    Scope       { get; set; } = "Restaurant"; // "Restaurant" | "Pickup" | "Delivery"
    public string    ClosureType { get; set; } = "DateRange";  // "DateRange" | "Weekly"
    public DateOnly?  StartDate   { get; set; }   // DateRange only
    public DateOnly?  EndDate     { get; set; }   // DateRange only (single day => Start == End)
    public DayOfWeek? DayOfWeek  { get; set; }   // Weekly only
    public TimeOnly?  StartTime  { get; set; }   // null = all-day; set = partial-day closure start
    public TimeOnly?  EndTime    { get; set; }   // null = all-day; set = partial-day closure end
    public string?   Note        { get; set; }   // e.g. "Christmas", "Staff training"
    public string?   NoteDa      { get; set; }
    public int       DisplayBeforeDays { get; set; } = 0;
    public DateTime  CreatedAt   { get; set; }
    public string?   CreatedBy   { get; set; }   // admin email

    public virtual Branch Branch { get; set; } = null!;
}
