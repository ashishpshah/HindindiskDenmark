using System.ComponentModel.DataAnnotations;

namespace HindIndisk.Api.Application.DTOs.Admin;

public class UpdateBranchRequest
{
    [Required, MaxLength(100)] public string Name         { get; set; } = string.Empty;
    [MaxLength(100)]           public string? NameDa       { get; set; }
    [Required, MaxLength(200)] public string AddressLine1 { get; set; } = string.Empty;
    [MaxLength(200)]           public string? AddressLine1Da { get; set; }
    [MaxLength(200)]           public string? AddressLine2 { get; set; }
    [MaxLength(200)]           public string? AddressLine2Da { get; set; }
    [Required, MaxLength(100)] public string City         { get; set; } = string.Empty;
    [MaxLength(100)]           public string? CityDa       { get; set; }
    [Required, MaxLength(20)]  public string PostalCode   { get; set; } = string.Empty;
    [MaxLength(50)]            public string Country      { get; set; } = "Denmark";
    [MaxLength(50)]            public string? CountryDa    { get; set; }
    [MaxLength(30)]            public string Phone        { get; set; } = string.Empty;
    [MaxLength(200)]           public string Email        { get; set; } = string.Empty;
    [MaxLength(500)]           public string GoogleMapsLink { get; set; } = string.Empty;
    [MaxLength(500)]           public string  ImageUrl    { get; set; } = string.Empty;
    [Range(0, 5)]              public decimal Rating           { get; set; } = 5.0m;
    [Range(0, int.MaxValue)]   public int     ReviewCount      { get; set; } = 0;
    [Range(0, 9999)] public decimal DeliveryFee       { get; set; } = 39.0m;
    public bool    DeliveryFeeEnabled { get; set; } = true;
    [Range(0, 90)] public int MaxAdvanceDays { get; set; } = 7;
}
