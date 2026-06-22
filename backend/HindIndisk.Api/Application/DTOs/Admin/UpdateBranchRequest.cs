using System.ComponentModel.DataAnnotations;

namespace HindIndisk.Api.Application.DTOs.Admin;

public class UpdateBranchRequest
{
    [Required, MaxLength(100)] public string Name         { get; set; } = string.Empty;
    [Required, MaxLength(200)] public string AddressLine1 { get; set; } = string.Empty;
    [MaxLength(200)]           public string? AddressLine2 { get; set; }
    [Required, MaxLength(100)] public string City         { get; set; } = string.Empty;
    [Required, MaxLength(20)]  public string PostalCode   { get; set; } = string.Empty;
    [MaxLength(50)]            public string Country      { get; set; } = "Denmark";
    [MaxLength(30)]            public string Phone        { get; set; } = string.Empty;
    [MaxLength(200)]           public string Email        { get; set; } = string.Empty;
    [MaxLength(500)]           public string GoogleMapsLink { get; set; } = string.Empty;

    // "HH:mm" strings — e.g. "11:00", "22:00"
    [Required, RegularExpression(@"^\d{2}:\d{2}$")] public string WeekdayOpen  { get; set; } = "11:00";
    [Required, RegularExpression(@"^\d{2}:\d{2}$")] public string WeekdayClose { get; set; } = "22:00";
    [Required, RegularExpression(@"^\d{2}:\d{2}$")] public string WeekendOpen  { get; set; } = "12:00";
    [Required, RegularExpression(@"^\d{2}:\d{2}$")] public string WeekendClose { get; set; } = "23:00";
}
