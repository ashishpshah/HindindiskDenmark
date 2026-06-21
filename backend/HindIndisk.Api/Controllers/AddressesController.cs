using System.Security.Claims;
using HindIndisk.Api.Application.DTOs.Addresses;
using HindIndisk.Api.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HindIndisk.Api.Controllers;

[ApiController]
[Route("api/addresses")]
[Authorize]
public class AddressesController : ControllerBase
{
    private readonly IAddressService _addresses;

    public AddressesController(IAddressService addresses) => _addresses = addresses;

    private long GetUserId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!long.TryParse(raw, out var id)) throw new UnauthorizedAccessException();
        return id;
    }

    // GET /api/addresses
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AddressDto>>> List()
        => Ok(await _addresses.GetAddressesAsync(GetUserId()));

    // POST /api/addresses
    [HttpPost]
    public async Task<ActionResult<AddressDto>> Add([FromBody] SaveAddressRequest request)
        => Ok(await _addresses.AddAddressAsync(GetUserId(), request));

    // PUT /api/addresses/{id}
    [HttpPut("{id:long}")]
    public async Task<ActionResult<AddressDto>> Update(long id, [FromBody] SaveAddressRequest request)
    {
        try   { return Ok(await _addresses.UpdateAddressAsync(GetUserId(), id, request)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    // DELETE /api/addresses/{id}
    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id)
    {
        try   { await _addresses.DeleteAddressAsync(GetUserId(), id); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }
}
