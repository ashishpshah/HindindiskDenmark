using System.ComponentModel.DataAnnotations;
using HindIndisk.Api.Infrastructure;

namespace HindIndisk.Api.Application.DTOs.Admin;

public class CreateOfferRequest
{
    [Required, MaxLength(100)] public string   Title              { get; set; } = string.Empty;
    [MaxLength(500)]           public string   Description        { get; set; } = string.Empty;
    /// <summary>Percent | FixedAmount | FreeShipping</summary>
    [Required]                 public string   DiscountType       { get; set; } = "Percent";
    [Range(0, 100_000)]        public decimal  DiscountValue      { get; set; }
    [MaxLength(20)]            public string?  CouponCode         { get; set; }
    public decimal?  MinimumOrderAmount { get; set; }
    public bool      IsFirstOrderOnly   { get; set; }
    public int?      UsageLimit         { get; set; }
    public DateTime  StartDate          { get; set; } = DenmarkTime.Now;
    public DateTime  EndDate            { get; set; } = DenmarkTime.Now.AddDays(30);
    [MaxLength(500)] public string ImageUrl    { get; set; } = string.Empty;
    [MaxLength(50)]  public string Badge       { get; set; } = string.Empty;
    [MaxLength(100)] public string Validity    { get; set; } = string.Empty;
    [MaxLength(50)]  public string CtaText     { get; set; } = "View Offer";
    [MaxLength(200)] public string CtaLink     { get; set; } = "/menu";
    public bool IsShowOnHome { get; set; }
}
