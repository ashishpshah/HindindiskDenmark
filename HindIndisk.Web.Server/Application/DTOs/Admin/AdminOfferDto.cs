namespace HindIndisk.Api.Application.DTOs.Admin;

public record AdminOfferDto(
    long     Id,
    string   Title,
    string   Description,
    string   OfferType,
    string   DiscountType,
    decimal  DiscountValue,
    string?  CouponCode,
    decimal? MinimumOrderAmount,
    bool     IsAutoApply,
    bool     IsFirstOrderOnly,
    int?     UsageLimit,
    int      UsageCount,
    DateTime StartDate,
    DateTime EndDate,
    bool     IsActive,
    string   ImageUrl,
    string   Badge,
    string   Validity,
    string   CtaText,
    string   CtaLink,
    bool     IsShowOnHome
);
