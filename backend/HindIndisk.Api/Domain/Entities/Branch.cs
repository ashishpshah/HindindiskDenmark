namespace HindIndisk.Api.Domain.Entities;

public class Branch
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string AddressLine1 { get; set; } = string.Empty;
    public string? AddressLine2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public TimeOnly WeekdayOpenTime { get; set; }
    public TimeOnly WeekdayCloseTime { get; set; }
    public TimeOnly WeekendOpenTime { get; set; }
    public TimeOnly WeekendCloseTime { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string GoogleMapsLink { get; set; } = string.Empty;
    public string GooglePlaceId { get; set; } = string.Empty;
    public string GoogleBusinessProfileLink { get; set; } = string.Empty;

    public virtual ICollection<UserBranch> UserBranches { get; set; } = [];
    public virtual ICollection<BranchMenu> BranchMenus { get; set; } = [];
    public virtual ICollection<BranchMenuItemPrice> BranchMenuItemPrices { get; set; } = [];
    public virtual ICollection<Order> Orders { get; set; } = [];
    public virtual ICollection<Reservation> Reservations { get; set; } = [];
}
