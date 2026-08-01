namespace HindIndisk.Api.Application.DTOs.Order;

public record OrderDto(
    long Id,
    string OrderType,
    string BranchName,
    long BranchId,
    decimal Subtotal,
    decimal DeliveryFee,
    decimal Tax,
    decimal Discount,
    decimal Total,
    string Status,
    string? StatusColor,
    string? StatusNameDa,
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
    long      UserId,               // 0 = guest; who was logged in when the order was placed
    string?   OwnerName             // display name of the account UserId points to (for cross-account "linked" matches)
);
