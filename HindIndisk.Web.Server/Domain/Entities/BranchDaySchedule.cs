namespace HindIndisk.Api.Domain.Entities;

public class BranchDaySchedule
{
    public long      Id                     { get; set; }
    public long      BranchId               { get; set; }
    public DayOfWeek DayOfWeek              { get; set; }
    public TimeOnly  OpenTime               { get; set; }
    public TimeOnly  CloseTime              { get; set; }
    public int       SlotIntervalMinutes    { get; set; } = 30;
    public int       MaxOrdersPerSlot       { get; set; } = 10;
    public int       MaxReservationsPerSlot { get; set; } = 5;
    public bool      IsOpen                 { get; set; } = true;
    public string?   OffMessage             { get; set; }
    public string?   OffMessageDa           { get; set; }

    public virtual Branch Branch { get; set; } = null!;
}
