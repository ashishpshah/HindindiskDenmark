namespace HindIndisk.Api.Application.DTOs.Admin;

public record AdminOrderItemDto(string Name, int Quantity, decimal PriceAtPurchase);

public record OrderStatusHistoryDto(string Status, DateTime ChangedAt);

public record AdminOrderDto(
    long     Id,
    string   CustomerName,
    string   CustomerEmail,
    string   OrderType,
    string   BranchName,
    decimal  Subtotal,
    decimal  DeliveryFee,
    decimal  Discount,
    decimal  Tax,
    decimal  Total,
    string   Status,
    DateTime CreatedAt,
    int      ItemCount,
    string?  CouponCode,
    string   ContactName,
    string   ContactPhone,
    string?  ContactEmail,
    string?  DeliveryAddress,
    string   PaymentMethod,
    IReadOnlyList<AdminOrderItemDto> Items,
    DateOnly? ScheduledDate,
    string?   ScheduledTime,   // null = ASAP
    IReadOnlyList<OrderStatusHistoryDto> StatusHistory,
    string?   CancellationReason
);
