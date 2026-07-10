using System.ComponentModel.DataAnnotations;

namespace HindIndisk.Api.Application.DTOs.Admin;

public class ToggleServiceRequest
{
    [Required]
    [RegularExpression("^(Order|Reservation|Delivery|Pickup)$", ErrorMessage = "ServiceType must be 'Order', 'Reservation', 'Delivery' or 'Pickup'.")]
    public string ServiceType { get; set; } = string.Empty;

    [Required]
    public bool IsClosed { get; set; }

    [MaxLength(200)]
    public string? Note { get; set; }

    [MaxLength(200)]
    public string? NoteDa { get; set; }
}
