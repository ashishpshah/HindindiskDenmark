namespace HindIndisk.Api.Domain.Entities;

public class Menu
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public virtual ICollection<MenuItemsMapping> MenuItemsMappings { get; set; } = [];
    public virtual ICollection<BranchMenu> BranchMenus { get; set; } = [];
    public virtual ICollection<OfferMenu> OfferMenus { get; set; } = [];
}
