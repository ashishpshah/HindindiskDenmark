namespace HindIndisk.Api.Domain.Entities;

public class OfferMenu
{
    public long OfferId { get; set; }
    public long MenuId { get; set; }

    public virtual Offer Offer { get; set; } = null!;
    public virtual Menu Menu { get; set; } = null!;
}
