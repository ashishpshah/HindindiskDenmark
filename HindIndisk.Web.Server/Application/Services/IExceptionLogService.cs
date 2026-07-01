using HindIndisk.Api.Application.DTOs.Admin;

namespace HindIndisk.Api.Application.Services;

public interface IExceptionLogService
{
    Task LogAsync(
        string    httpMethod,
        string    requestPath,
        string?   queryString,
        int       statusCode,
        Exception exception,
        long?     userId,
        string?   clientIp);

    Task<ExceptionLogPageDto> GetRecentAsync(
        int       page,
        int       pageSize,
        string?   search  = null,
        DateTime? from    = null,
        DateTime? to      = null,
        string?   module  = null);
}
