using System.Security.Claims;
using HindIndisk.Api.Application.Services;

namespace HindIndisk.Api.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly bool _isInfoLog;

    public RequestLoggingMiddleware(
        RequestDelegate next,
        IServiceScopeFactory scopeFactory,
        IConfiguration configuration)
    {
        _next       = next;
        _scopeFactory = scopeFactory;
        _isInfoLog  = configuration.GetValue<bool>("IsInfoLog", true);
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!_isInfoLog
            || context.Request.Method == "OPTIONS"
            || !context.Request.Path.StartsWithSegments("/api")
            || context.Request.Path.StartsWithSegments("/api/admin/exception-logs"))
        {
            await _next(context);
            return;
        }

        bool faulted = false;
        try
        {
            await _next(context);
        }
        catch
        {
            faulted = true;
            throw;
        }
        finally
        {
            long? userId = null;
            var raw = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (long.TryParse(raw, out var uid)) userId = uid;

            var clientIp = context.Request.Headers["X-Forwarded-For"].FirstOrDefault()
                        ?? context.Connection.RemoteIpAddress?.ToString();

            await using var scope = _scopeFactory.CreateAsyncScope();
            var logService = scope.ServiceProvider.GetRequiredService<IExceptionLogService>();

            await logService.LogAsync(
                httpMethod:  context.Request.Method,
                requestPath: context.Request.Path.Value ?? string.Empty,
                queryString: context.Request.QueryString.HasValue
                                 ? context.Request.QueryString.Value
                                 : null,
                statusCode:  faulted ? 500 : context.Response.StatusCode,
                exception:   null,
                userId:      userId,
                clientIp:    clientIp);
        }
    }
}
