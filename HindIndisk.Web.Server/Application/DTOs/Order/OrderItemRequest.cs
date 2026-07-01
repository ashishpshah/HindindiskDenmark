using System.ComponentModel.DataAnnotations;

namespace HindIndisk.Api.Application.DTOs.Order;

public class OrderItemRequest
{
    public long MenuItemId { get; set; }

    [Range(1, 100)]
    public int Quantity { get; set; }
}
