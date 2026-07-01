namespace HindIndisk.Api.Application.DTOs.Order;

public record CouponValidationDto(
    bool IsValid,
    string? Message,
    string? DiscountType,
    decimal DiscountValue,
    decimal AppliedDiscount
);
