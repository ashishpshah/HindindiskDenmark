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
    string?  CouponCode,
    // Contact & delivery — captured at order time, needed for COD dispatch
    string   ContactName,
    string   ContactPhone,
    string?  ContactEmail,
    string?  DeliveryAddress,
    string   PaymentMethod
);
