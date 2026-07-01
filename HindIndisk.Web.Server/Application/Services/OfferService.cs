using HindIndisk.Api.Application.DTOs.Offers;
using HindIndisk.Api.Application.DTOs.Order;
using HindIndisk.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace HindIndisk.Api.Application.Services;

public class OfferService : IOfferService
{
    private readonly ApplicationDbContext _db;

    public OfferService(ApplicationDbContext db) => _db = db;

    public async Task<IReadOnlyList<PublicOfferDto>> GetActiveOffersAsync()
    {
        var now = DenmarkTime.Now;
        return await _db.Offers
            .Where(o => o.IsActive && o.StartDate <= now && o.EndDate >= now && o.CouponCode != null)
            .OrderBy(o => o.Title)
            .Select(o => new PublicOfferDto(
                o.Id, o.Title, o.Description,
                o.DiscountType, o.DiscountValue,
                o.CouponCode, o.EndDate,
                o.ImageUrl, o.Badge, o.Validity, o.CtaText, o.CtaLink))
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<IReadOnlyList<PublicOfferDto>> GetHomeOffersAsync()
    {
        var now = DenmarkTime.Now;
        return await _db.Offers
            .Where(o => o.IsShowOnHome && o.IsActive && o.StartDate <= now && o.EndDate >= now)
            .OrderBy(o => o.Title)
            .Select(o => new PublicOfferDto(
                o.Id, o.Title, o.Description,
                o.DiscountType, o.DiscountValue,
                o.CouponCode, o.EndDate,
                o.ImageUrl, o.Badge, o.Validity, o.CtaText, o.CtaLink))
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<CouponValidationDto> ValidateCouponAsync(string code, decimal subtotal)
    {
        var upper = code.Trim().ToUpper();

        var offer = await _db.Offers
            .AsNoTracking()
            .FirstOrDefaultAsync(o =>
                o.CouponCode == upper &&
                o.IsActive &&
                o.StartDate <= DenmarkTime.Now &&
                o.EndDate   >= DenmarkTime.Now);

        if (offer is null)
            return new CouponValidationDto(false, "Invalid or expired coupon code.", null, 0m, 0m);

        if (offer.UsageLimit.HasValue && offer.UsageCount >= offer.UsageLimit.Value)
            return new CouponValidationDto(false, "This coupon has reached its usage limit.", null, 0m, 0m);

        if (offer.MinimumOrderAmount.HasValue && subtotal < offer.MinimumOrderAmount.Value)
            return new CouponValidationDto(
                false,
                $"A minimum order of {offer.MinimumOrderAmount} DKK is required.",
                null, 0m, 0m);

        var discount = offer.DiscountType switch
        {
            "Percent"      => Math.Round(subtotal * offer.DiscountValue / 100m, 2),
            "FreeShipping" => 39m,
            "FixedAmount"  => offer.DiscountValue,
            _              => 0m,
        };

        return new CouponValidationDto(true, null, offer.DiscountType, offer.DiscountValue, discount);
    }
}
