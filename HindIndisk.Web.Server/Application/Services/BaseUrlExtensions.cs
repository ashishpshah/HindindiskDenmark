using Microsoft.AspNetCore.Http;

namespace HindIndisk.Api.Application.Services;

public static class BaseUrlExtensions
{
    public static string GetBaseUrl(this HttpRequest request) => $"{request.Scheme}://{request.Host}";

    /// <summary>
    /// The scheme+host of the request currently in flight, or null when called outside
    /// a request — e.g. from a background-dispatched Task with no HttpContext, or a
    /// scope created after the triggering request already returned.
    /// </summary>
    public static string? GetBaseUrl(this IHttpContextAccessor accessor) =>
        accessor.HttpContext is { } ctx ? ctx.Request.GetBaseUrl() : null;
}
