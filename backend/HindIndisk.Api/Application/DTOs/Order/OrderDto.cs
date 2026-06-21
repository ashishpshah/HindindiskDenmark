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
    string? CouponCode
);
