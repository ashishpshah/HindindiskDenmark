namespace HindIndisk.Api.Application.DTOs.Admin;

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
    string?  CouponCode
);
