using System.ComponentModel.DataAnnotations;

namespace HindIndisk.Api.Application.DTOs.Admin;

public class UpdateOfferRequest
{
    [Required, MaxLength(100)] public string   Title              { get; set; } = string.Empty;
    [MaxLength(500)]           public string   Description        { get; set; } = string.Empty;
    [Required]                 public string   DiscountType       { get; set; } = "Percent";
    [Range(0, 100_000)]        public decimal  DiscountValue      { get; set; }
    [MaxLength(20)]            public string?  CouponCode         { get; set; }
    public decimal?  MinimumOrderAmount { get; set; }
    public int?      UsageLimit         { get; set; }
    public DateTime  StartDate          { get; set; }
    public DateTime  EndDate            { get; set; }
}
