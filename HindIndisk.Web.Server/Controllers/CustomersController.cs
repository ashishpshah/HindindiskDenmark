using HindIndisk.Api.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HindIndisk.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customers;

    public CustomersController(ICustomerService customers) => _customers = customers;

    /// <summary>
    /// Look up a customer by phone or email for form auto-fill.
    /// Provide exactly one of: ?phone= or ?email=
    /// Phone takes priority if both are supplied. Returns 404 when no match.
    /// </summary>
    [HttpGet("lookup")]
    [AllowAnonymous]
    public async Task<IActionResult> Lookup(
        [FromQuery] string? phone,
        [FromQuery] string? email)
    {
        if (!string.IsNullOrWhiteSpace(phone))
        {
            var byPhone = await _customers.LookupByPhoneAsync(phone);
            return byPhone is null ? NotFound() : Ok(byPhone);
        }

        if (!string.IsNullOrWhiteSpace(email))
        {
            var byEmail = await _customers.LookupByEmailAsync(email);
            return byEmail is null ? NotFound() : Ok(byEmail);
        }

        return BadRequest(new { message = "Provide either 'phone' or 'email' query parameter." });
    }
}
