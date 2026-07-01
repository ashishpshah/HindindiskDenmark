using HindIndisk.Api.Application.DTOs.Admin;
using HindIndisk.Api.Domain.Entities;
using HindIndisk.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace HindIndisk.Api.Application.Services;

public class ExceptionLogService : IExceptionLogService
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<ExceptionLogService> _logger;

    public ExceptionLogService(ApplicationDbContext db, ILogger<ExceptionLogService> logger)
    {
        _db     = db;
        _logger = logger;
    }

    public async Task LogAsync(
        string    httpMethod,
        string    requestPath,
        string?   queryString,
        int       statusCode,
        Exception exception,
        long?     userId,
        string?   clientIp)
    {
        try
        {
            var message = exception.Message.Length > 2000
                ? exception.Message[..2000]
                : exception.Message;

            _db.ApiExceptionLogs.Add(new ApiExceptionLog
            {
                OccurredAt       = DenmarkTime.Now,
                HttpMethod       = httpMethod,
                RequestPath      = requestPath,
                QueryString      = queryString,
                StatusCode       = statusCode,
                ExceptionType    = exception.GetType().FullName ?? exception.GetType().Name,
                ExceptionMessage = message,
                StackTrace       = exception.StackTrace,
                UserId           = userId,
                ClientIp         = clientIp,
            });

            await _db.SaveChangesAsync();
        }
        catch (Exception dbEx)
        {
            _logger.LogError(dbEx, "Failed to persist exception log for {Path}", requestPath);
        }
    }

    public async Task<ExceptionLogPageDto> GetRecentAsync(
        int       page,
        int       pageSize,
        string?   search  = null,
        DateTime? from    = null,
        DateTime? to      = null,
        string?   module  = null)
    {
        var q = _db.ApiExceptionLogs.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(e => e.RequestPath.Contains(search)
                           || e.ExceptionType.Contains(search)
                           || e.ExceptionMessage.Contains(search));

        if (from.HasValue)
            q = q.Where(e => e.OccurredAt >= from.Value);

        if (to.HasValue)
            q = q.Where(e => e.OccurredAt <= to.Value);

        if (!string.IsNullOrWhiteSpace(module))
            q = q.Where(e => e.RequestPath.StartsWith(module));

        var total = await q.CountAsync();

        var items = await q
            .OrderByDescending(e => e.OccurredAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new ExceptionLogDto(
                e.Id,
                e.OccurredAt,
                e.HttpMethod,
                e.RequestPath,
                e.QueryString,
                e.StatusCode,
                e.ExceptionType,
                e.ExceptionMessage,
                e.StackTrace,
                e.UserId,
                e.ClientIp))
            .ToListAsync();

        return new ExceptionLogPageDto(items, total);
    }
}
