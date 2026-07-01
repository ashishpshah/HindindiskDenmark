namespace HindIndisk.Api.Domain.Entities;

public class MenuLabel
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;

    /// <summary>Allergen or Dietary</summary>
    public string Type { get; set; } = string.Empty;

    public virtual ICollection<MenuItemLabel> MenuItemLabels { get; set; } = [];
}
