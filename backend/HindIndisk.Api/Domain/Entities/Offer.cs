namespace HindIndisk.Api.Domain.Entities;

public class Offer
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    /// <summary>Coupon | Direct | Conditional</summary>
    public string OfferType { get; set; } = string.Empty;

    /// <summary>Percent | FixedAmount | FreeShipping | FreeItem</summary>
    public string DiscountType { get; set; } = string.Empty;

    public decimal DiscountValue { get; set; }

    /// <summary>Unique coupon code — null for auto-apply offers.</summary>
    public string? CouponCode { get; set; }

    public decimal? MinimumOrderAmount { get; set; }
    public bool IsAutoApply { get; set; }
    public int? UsageLimit { get; set; }
    public int UsageCount { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; } = true;

    public virtual ICollection<OfferMenu> OfferMenus { get; set; } = [];
    public virtual ICollection<OfferMenuItem> OfferMenuItems { get; set; } = [];
    public virtual ICollection<OrderAppliedOffer> OrderAppliedOffers { get; set; } = [];
}
