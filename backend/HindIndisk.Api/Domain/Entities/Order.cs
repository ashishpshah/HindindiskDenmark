namespace HindIndisk.Api.Domain.Entities;

public class Order
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public long BranchId { get; set; }

    /// <summary>Pickup or Delivery</summary>
    public string OrderType { get; set; } = string.Empty;

    public decimal Subtotal { get; set; }
    public decimal DeliveryFee { get; set; }
    public decimal Tax { get; set; }
    public decimal Discount { get; set; }
    public decimal Total { get; set; }

    /// <summary>Placed | Accepted | Preparing | Ready | OutForDelivery | Completed | Cancelled</summary>
    public string Status { get; set; } = "Placed";

    // Contact details captured at order time
    public string  ContactName    { get; set; } = string.Empty;
    public string  ContactPhone   { get; set; } = string.Empty;
    public string? ContactEmail   { get; set; }

    // Populated only for Delivery orders
    public string? DeliveryAddress { get; set; }

    // CashOnDelivery (only option for now)
    public string PaymentMethod { get; set; } = "CashOnDelivery";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual User User { get; set; } = null!;
    public virtual Branch Branch { get; set; } = null!;
    public virtual ICollection<OrderItem> OrderItems { get; set; } = [];
    public virtual ICollection<OrderAppliedOffer> AppliedOffers { get; set; } = [];
}
