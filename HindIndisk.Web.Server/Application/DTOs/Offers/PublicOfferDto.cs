namespace HindIndisk.Api.Application.DTOs.Offers;

public record PublicOfferDto(
    long     Id,
    string   Title,
    string   Description,
    string   DiscountType,
    decimal  DiscountValue,
    string?  CouponCode,
    DateTime EndDate,
    string   ImageUrl,
    string   Badge,
    string   Validity,
    string   CtaText,
    string   CtaLink
);
