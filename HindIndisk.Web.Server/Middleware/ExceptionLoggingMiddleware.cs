using System.Security.Claims;
using HindIndisk.Api.Application.Services;

namespace HindIndisk.Api.Middleware;

public class ExceptionLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ExceptionLoggingMiddleware> _logger;
    private readonly bool _isErrorLog;

    public ExceptionLoggingMiddleware(
        RequestDelegate next,
        IServiceScopeFactory scopeFactory,
        ILogger<ExceptionLoggingMiddleware> logger,
        IConfiguration configuration)
    {
        _next         = next;
        _scopeFactory = scopeFactory;
        _logger       = logger;
        _isErrorLog   = configuration.GetValue<bool>("IsErrorLog", true);
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception on {Method} {Path}",
                context.Request.Method, context.Request.Path);

            if (_isErrorLog)
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
                    statusCode:  500,
                    exception:   ex,
                    userId:      userId,
                    clientIp:    clientIp);
            }

            if (!context.Response.HasStarted)
            {
                context.Response.StatusCode  = 500;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new { message = "An unexpected error occurred." });
            }
        }
    }
}
