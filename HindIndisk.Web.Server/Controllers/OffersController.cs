using HindIndisk.Api.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace HindIndisk.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OffersController : ControllerBase
{
    private readonly IOfferService _offers;

    public OffersController(IOfferService offers) => _offers = offers;

    /// <summary>List all active coupon offers (public). Used on the account coupons page.</summary>
    [HttpGet]
    public async Task<IActionResult> List()
        => Ok(await _offers.GetActiveOffersAsync());

    /// <summary>List offers marked IsShowOnHome=true for the home page "Special Dining Perks" section.</summary>
    [HttpGet("home")]
    public async Task<IActionResult> Home()
        => Ok(await _offers.GetHomeOffersAsync());

    /// <summary>Validate a coupon code before checkout. No auth required.</summary>
    [HttpGet("validate")]
    public async Task<IActionResult> Validate(
        [FromQuery] string code,
        [FromQuery] decimal subtotal = 0m)
    {
        if (string.IsNullOrWhiteSpace(code))
            return BadRequest(new { message = "code is required." });

        var result = await _offers.ValidateCouponAsync(code, subtotal);
        return Ok(result);
    }
}
