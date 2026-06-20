namespace HindIndisk.Api.Domain.Entities;

public class OrderItem
{
    public long Id { get; set; }
    public long OrderId { get; set; }
    public long MenuId { get; set; }
    public long MenuItemId { get; set; }
    public int Quantity { get; set; }

    /// <summary>Price snapshot at the time of purchase — immutable.</summary>
    public decimal PriceAtPurchase { get; set; }

    public virtual Order Order { get; set; } = null!;
    public virtual Menu Menu { get; set; } = null!;
    public virtual MenuItem MenuItem { get; set; } = null!;
}
