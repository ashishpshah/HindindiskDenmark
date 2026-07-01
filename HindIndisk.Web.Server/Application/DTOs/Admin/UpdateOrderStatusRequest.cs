using System.ComponentModel.DataAnnotations;

namespace HindIndisk.Api.Application.DTOs.Admin;

public class UpdateOrderStatusRequest
{
    [Required]
    public string  Status             { get; set; } = string.Empty;
    public string? CancellationReason { get; set; }
}
