using HindIndisk.Api.Infrastructure;

namespace HindIndisk.Api.Domain.Entities;

public class OrderStatusHistory
{
    public long     Id        { get; set; }
    public long     OrderId   { get; set; }
    public string   Status    { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; } = DenmarkTime.Now;

    public virtual Order Order { get; set; } = null!;
}
