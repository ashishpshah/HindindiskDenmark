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
    [MaxLength(60)]
    public string? Firstname { get; set; }

    [MaxLength(60)]
    public string? Lastname { get; set; }

    [MaxLength(20), RegularExpression(@"^(?=(?:[+ ]*\d){8,13}[+ ]*$)[+\d ]+$",
        ErrorMessage = "Phone must be 8–13 digits. You may use + and spaces (e.g. +45 12 34 56 78).")]
    public string? Phone { get; set; }

    [Required, MaxLength(200), EmailAddress]
    public string Email { get; set; } = string.Empty;

    // Required for Delivery orders
    [MaxLength(300)]
    public string? DeliveryAddress { get; set; }

    [Required, RegularExpression(@"^\d{2}:\d{2}$", ErrorMessage = "ScheduledTime must be in HH:mm format.")]
    public string ScheduledTime { get; set; } = string.Empty;

    /// <summary>yyyy-MM-dd. Required — send today's date for same-day orders.</summary>
    [Required, RegularExpression(@"^\d{4}-\d{2}-\d{2}$", ErrorMessage = "ScheduledDate must be yyyy-MM-dd.")]
    public string ScheduledDate { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? SpecialInstructions { get; set; }
}
