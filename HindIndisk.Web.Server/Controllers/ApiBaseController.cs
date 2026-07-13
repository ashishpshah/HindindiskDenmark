using System.Security.Claims;
using HindIndisk.Api.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace HindIndisk.Api.Controllers;

public abstract class ApiBaseController : ControllerBase
{
    protected Task LogExAsync(Exception ex, int statusCode)
    {
        var log = HttpContext.RequestServices.GetRequiredService<IExceptionLogService>();

        long? userId = null;
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (long.TryParse(raw, out var uid)) userId = uid;

        var clientIp = Request.Headers["X-Forwarded-For"].FirstOrDefault()
                    ?? HttpContext.Connection.RemoteIpAddress?.ToString();

        return log.LogAsync(
            Request.Method,
            Request.Path,
            Request.QueryString.HasValue ? Request.QueryString.Value : null,
            statusCode,
            ex,
            userId,
            clientIp);
    }
}
