namespace HindIndisk.Api.Domain.Entities;

public class BranchMenu
{
    public long BranchId { get; set; }
    public long MenuId { get; set; }

    public virtual Branch Branch { get; set; } = null!;
    public virtual Menu Menu { get; set; } = null!;
}
