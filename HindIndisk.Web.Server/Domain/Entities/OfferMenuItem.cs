namespace HindIndisk.Api.Domain.Entities;

public class OfferMenuItem
{
    public long OfferId { get; set; }
    public long MenuItemId { get; set; }

    public virtual Offer Offer { get; set; } = null!;
    public virtual MenuItem MenuItem { get; set; } = null!;
}
