using HindIndisk.Api.Infrastructure;

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

    public DateOnly? ScheduledDate { get; set; }
    public string?   ScheduledTime { get; set; }  // "HH:mm", null = ASAP

    public string? SpecialInstructions  { get; set; }
    public string? CancellationReason   { get; set; }

    public DateTime CreatedAt { get; set; } = DenmarkTime.Now;

    // Populated when an admin/staff places the order on behalf of a customer
    public long? PlacedByUserId { get; set; }

    public virtual User  User         { get; set; } = null!;
    public virtual User? PlacedByUser { get; set; }
    public virtual Branch Branch { get; set; } = null!;
    public virtual ICollection<OrderItem> OrderItems { get; set; } = [];
    public virtual ICollection<OrderAppliedOffer> AppliedOffers { get; set; } = [];
    public virtual ICollection<OrderStatusHistory> StatusHistories { get; set; } = [];
}
