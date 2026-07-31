namespace HindIndisk.Api.Domain.Entities;

public class BranchEmailRecipients
{
    public long   Id          { get; set; }
    public long   BranchId    { get; set; }
    public string AdminToMail { get; set; } = string.Empty;
    public string CC          { get; set; } = string.Empty;
    public string BCC         { get; set; } = string.Empty;

    public virtual Branch Branch { get; set; } = null!;
}
