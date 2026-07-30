using System.ComponentModel.DataAnnotations.Schema;

namespace HindIndisk.Api.Domain.Entities;

public class Branch
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NameDa { get; set; }
    public string AddressLine1 { get; set; } = string.Empty;
    public string? AddressLine1Da { get; set; }
    public string? AddressLine2 { get; set; }
    public string? AddressLine2Da { get; set; }
    public string City { get; set; } = string.Empty;
    public string? CityDa { get; set; }
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string? CountryDa { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string GoogleMapsLink { get; set; } = string.Empty;
    public string GooglePlaceId { get; set; } = string.Empty;
    public string GoogleBusinessProfileLink { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    [Column(TypeName = "decimal(3,1)")]
    public decimal Rating { get; set; } = 5.0m;
    public int ReviewCount { get; set; } = 0;
    [Column(TypeName = "decimal(8,2)")]  public decimal DeliveryFee        { get; set; } = 39.0m;
    public bool    DeliveryFeeEnabled { get; set; } = true;
    public bool    IsCloseOrder       { get; set; } = false;
    public string? CloseOrderNote     { get; set; }
    public string? CloseOrderNoteDa   { get; set; }
    public int     MaxAdvanceDays     { get; set; } = 7;

    public virtual ICollection<BranchServiceClosure> ServiceClosures { get; set; } = [];
    public virtual ICollection<BranchClosure>        Closures        { get; set; } = [];
    public virtual ICollection<BranchDaySchedule>    DaySchedules    { get; set; } = [];
    public virtual ICollection<UserBranch>            UserBranches    { get; set; } = [];
    public virtual ICollection<BranchMenu>            BranchMenus     { get; set; } = [];
    public virtual ICollection<BranchMenuItemPrice>   BranchMenuItemPrices { get; set; } = [];
    public virtual ICollection<Order>                 Orders          { get; set; } = [];
    public virtual ICollection<Reservation>           Reservations    { get; set; } = [];
    public virtual AboutPageSettings?                 AboutPageSettings { get; set; }
    public virtual ICollection<AboutTimelineItem>     AboutTimelineItems { get; set; } = [];
    public virtual ICollection<TeamMember>            TeamMembers     { get; set; } = [];
}
