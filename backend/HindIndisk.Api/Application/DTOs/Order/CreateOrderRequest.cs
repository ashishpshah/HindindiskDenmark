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

    [Required]
    [MinLength(1, ErrorMessage = "At least one item is required.")]
    public List<OrderItemRequest> Items { get; set; } = [];
}
