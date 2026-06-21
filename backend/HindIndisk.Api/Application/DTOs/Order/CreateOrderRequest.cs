using System.ComponentModel.DataAnnotations;

namespace HindIndisk.Api.Application.DTOs.Order;

public class CreateOrderRequest
{
    [Required]
    public long BranchId { get; set; }

    /// <summary>Pickup | Delivery</summary>
    [Required]
    public string OrderType { get; set; } = "Pickup";

    public string? CouponCode { get; set; }

    [Required, MinLength(1, ErrorMessage = "At least one item is required.")]
    public List<OrderItemRequest> Items { get; set; } = [];

    // Contact details
    [Required, MaxLength(120)]
    public string ContactName { get; set; } = string.Empty;

    [Required, MaxLength(30)]
    public string ContactPhone { get; set; } = string.Empty;

    [MaxLength(200)]
    [EmailAddress]
    public string? ContactEmail { get; set; }

    // Required for Delivery orders
    [MaxLength(300)]
    public string? DeliveryAddress { get; set; }
}
