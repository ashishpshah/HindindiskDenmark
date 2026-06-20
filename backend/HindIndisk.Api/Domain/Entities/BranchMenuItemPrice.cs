namespace HindIndisk.Api.Domain.Entities;

public class BranchMenuItemPrice
{
    public long BranchId { get; set; }
    public long MenuItemId { get; set; }
    public decimal Price { get; set; }

    public virtual Branch Branch { get; set; } = null!;
    public virtual MenuItem MenuItem { get; set; } = null!;
}
