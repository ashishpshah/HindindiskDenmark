namespace HindIndisk.Api.Domain.Entities;

public class OrderStatusTransition
{
    public long Id { get; set; }
    public long FromStatusId { get; set; }
    public long ToStatusId { get; set; }
    public string ServiceType { get; set; } = "All";

    public OrderStatus FromStatus { get; set; } = null!;
    public OrderStatus ToStatus { get; set; } = null!;
}
