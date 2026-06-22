namespace HindIndisk.Api.Domain.Entities;

public class MenuItem
{
    public long Id { get; set; }
    public string Name          { get; set; } = string.Empty;
    public string NameDa        { get; set; } = string.Empty;
    public string Description   { get; set; } = string.Empty;
    public string DescriptionDa { get; set; } = string.Empty;
    public string ImageUrl      { get; set; } = string.Empty;

    /// <summary>0 = not spicy, 1 = mild, 2 = medium, 3 = hot</summary>
    public int SpicyLevel { get; set; }

    public virtual ICollection<MenuItemLabel> MenuItemLabels { get; set; } = [];
    public virtual ICollection<MenuItemsMapping> MenuItemsMappings { get; set; } = [];
    public virtual ICollection<BranchMenuItemPrice> BranchMenuItemPrices { get; set; } = [];
    public virtual ICollection<OrderItem> OrderItems { get; set; } = [];
    public virtual ICollection<OfferMenuItem> OfferMenuItems { get; set; } = [];
}
