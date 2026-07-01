using System.ComponentModel.DataAnnotations;
using HindIndisk.Api.Infrastructure;

namespace HindIndisk.Api.Domain.Entities;

public class ApiExceptionLog
{
    public long Id { get; set; }

    public DateTime OccurredAt { get; set; } = DenmarkTime.Now;

    [MaxLength(10)]
    public string HttpMethod { get; set; } = string.Empty;

    [MaxLength(500)]
    public string RequestPath { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? QueryString { get; set; }

    public int StatusCode { get; set; }

    [MaxLength(500)]
    public string ExceptionType { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string ExceptionMessage { get; set; } = string.Empty;

    public string? StackTrace { get; set; }

    public long? UserId { get; set; }

    [MaxLength(45)]
    public string? ClientIp { get; set; }
}
