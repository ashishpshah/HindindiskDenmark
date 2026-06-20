namespace HindIndisk.Api.Domain.Entities;

public class UserAddress
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string AddressLine1 { get; set; } = string.Empty;
    public string? AddressLine2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;

    /// <summary>Home or Office</summary>
    public string Type { get; set; } = "Home";

    public virtual User User { get; set; } = null!;
}
