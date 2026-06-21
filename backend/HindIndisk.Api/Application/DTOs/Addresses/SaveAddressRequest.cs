using System.ComponentModel.DataAnnotations;

namespace HindIndisk.Api.Application.DTOs.Addresses;

public class SaveAddressRequest
{
    [Required, MaxLength(200)] public string  AddressLine1 { get; set; } = string.Empty;
    [MaxLength(200)]           public string? AddressLine2 { get; set; }
    [Required, MaxLength(100)] public string  City         { get; set; } = string.Empty;
    [Required, MaxLength(20)]  public string  PostalCode   { get; set; } = string.Empty;
    [Required, MaxLength(100)] public string  Country      { get; set; } = "Denmark";
    [MaxLength(50)]            public string  Type         { get; set; } = "Home";
}
