namespace HindIndisk.Api.Domain.Entities;

public class OrderAppliedOffer
{
    public long OrderId { get; set; }
    public long OfferId { get; set; }
    public decimal AppliedDiscountAmount { get; set; }

    public virtual Order Order { get; set; } = null!;
    public virtual Offer Offer { get; set; } = null!;
}
