namespace HindIndisk.Api.Domain.Entities;

public class BranchServiceClosure
{
    public long     Id          { get; set; }
    public long     BranchId    { get; set; }
    public string   ServiceType { get; set; } = string.Empty; // "Order" | "Reservation"
    public DateTime ClosedAt    { get; set; }
    public DateTime? ReopenedAt { get; set; }   // null = still closed
    public string?  ClosedBy   { get; set; }    // admin email

    public virtual Branch Branch { get; set; } = null!;
}
