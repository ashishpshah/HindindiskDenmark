using System.ComponentModel.DataAnnotations;

namespace HindIndisk.Api.Application.DTOs.Admin;

public class UpdateReservationStatusRequest
{
    [Required]
    public string Status { get; set; } = string.Empty;
}
