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

    // Customer identity — used to find or create a customer record (RoleId = 3)
    [Required, MaxLength(60)]
    public string Firstname { get; set; } = string.Empty;

    [Required, MaxLength(60)]
    public string Lastname { get; set; } = string.Empty;

    [Required, MaxLength(20), RegularExpression(@"^\+?[0-9]{8,15}$",
        ErrorMessage = "Phone must contain only digits with an optional + prefix and no spaces (e.g. +4512345678).")]
    public string Phone { get; set; } = string.Empty;

    [Required, MaxLength(200), EmailAddress]
    public string Email { get; set; } = string.Empty;

    // Required for Delivery orders
    [MaxLength(300)]
    public string? DeliveryAddress { get; set; }
}
