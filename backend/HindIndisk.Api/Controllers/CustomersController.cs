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
    /// Look up a customer by phone number for form auto-fill.
    /// Public endpoint — no auth required. Returns 404 when no customer matches.
    /// </summary>
    [HttpGet("lookup")]
    [AllowAnonymous]
    public async Task<IActionResult> Lookup([FromQuery] string phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return BadRequest(new { message = "phone query parameter is required." });

        var result = await _customers.LookupByPhoneAsync(phone);
        return result is null ? NotFound() : Ok(result);
    }
}
