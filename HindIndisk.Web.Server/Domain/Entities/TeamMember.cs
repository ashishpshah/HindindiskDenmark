namespace HindIndisk.Api.Domain.Entities;

public class TeamMember
{
    public long   Id        { get; set; }
    public long   BranchId  { get; set; }
    public string Name      { get; set; } = string.Empty;
    public string Role      { get; set; } = string.Empty;
    public string RoleDa    { get; set; } = string.Empty;
    public string Image     { get; set; } = string.Empty;
    public int    SortOrder { get; set; }
    public bool   IsActive  { get; set; } = true;

    public virtual Branch Branch { get; set; } = null!;
}
