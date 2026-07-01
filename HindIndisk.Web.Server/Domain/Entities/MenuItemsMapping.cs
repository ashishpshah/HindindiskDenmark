namespace HindIndisk.Api.Domain.Entities;

public class MenuItemsMapping
{
    public long MenuId { get; set; }
    public long MenuItemId { get; set; }
    public int  SortOrder { get; set; }

    public virtual Menu     Menu     { get; set; } = null!;
    public virtual MenuItem MenuItem { get; set; } = null!;
}
