namespace HindIndisk.Api.Application.DTOs.Offers;

public record PublicOfferDto(
    long     Id,
    string   Title,
    string   Description,
    string   DiscountType,
    decimal  DiscountValue,
    string?  CouponCode,
    DateTime EndDate
);
