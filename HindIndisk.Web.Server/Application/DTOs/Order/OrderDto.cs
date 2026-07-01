namespace HindIndisk.Api.Application.DTOs.Order;

public record OrderDto(
    long Id,
    string OrderType,
    string BranchName,
    decimal Subtotal,
    decimal DeliveryFee,
    decimal Tax,
    decimal Discount,
    decimal Total,
    string Status,
    DateTime CreatedAt,
    IReadOnlyList<OrderItemDto> Items,
    string? CouponCode,
    string ContactName,
    string ContactPhone,
    string? ContactEmail,
    string? DeliveryAddress,
    string PaymentMethod,
    DateOnly? ScheduledDate,
    string?   ScheduledTime,         // null = ASAP
    string?   SpecialInstructions,
    string?   CancellationReason,
    string?   PlacedByName          // null = customer placed the order themselves
);
