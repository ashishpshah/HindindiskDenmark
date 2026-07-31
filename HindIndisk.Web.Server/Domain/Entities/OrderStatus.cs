using HindIndisk.Api.Infrastructure;

namespace HindIndisk.Api.Domain.Entities;

public class OrderStatus
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NameDa { get; set; }
    public string ServiceType { get; set; } = "All";
    public int DisplayOrder { get; set; }
    public string? Color { get; set; }
    public bool IsTerminal { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsEmailSend { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DenmarkTime.Now;

    public ICollection<OrderStatusTransition> FromTransitions { get; set; } = [];
    public ICollection<OrderStatusTransition> ToTransitions { get; set; } = [];
}
