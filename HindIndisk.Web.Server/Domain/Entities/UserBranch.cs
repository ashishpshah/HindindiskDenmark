namespace HindIndisk.Api.Domain.Entities;

public class UserBranch
{
    public long UserId { get; set; }
    public long BranchId { get; set; }

    public virtual User User { get; set; } = null!;
    public virtual Branch Branch { get; set; } = null!;
}
