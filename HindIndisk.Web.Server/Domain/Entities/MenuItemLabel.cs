namespace HindIndisk.Api.Domain.Entities;

public class MenuItemLabel
{
    public long MenuItemId { get; set; }
    public long LabelId { get; set; }

    public virtual MenuItem MenuItem { get; set; } = null!;
    public virtual MenuLabel Label { get; set; } = null!;
}
