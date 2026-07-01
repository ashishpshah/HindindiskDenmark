using System.ComponentModel.DataAnnotations;

namespace HindIndisk.Api.Application.DTOs.Admin;

public class ToggleServiceRequest
{
    [Required]
    [RegularExpression("^(Order|Reservation)$", ErrorMessage = "ServiceType must be 'Order' or 'Reservation'.")]
    public string ServiceType { get; set; } = string.Empty;

    [Required]
    public bool IsClosed { get; set; }
}
