using HindIndisk.Api.Application.DTOs.Admin;
using HindIndisk.Api.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HindIndisk.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "SystemAdmin,Admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _admin;
    public AdminController(IAdminService admin) => _admin = admin;

    // GET /api/admin/dashboard
    [HttpGet("dashboard")]
    public async Task<ActionResult<AdminDashboardDto>> Dashboard()
        => Ok(await _admin.GetDashboardAsync());

    // GET /api/admin/orders?status=Placed&branchId=1
    [HttpGet("orders")]
    public async Task<ActionResult<IReadOnlyList<AdminOrderDto>>> Orders(
        [FromQuery] string? status,
        [FromQuery] long?   branchId)
        => Ok(await _admin.GetOrdersAsync(status, branchId));

    // PATCH /api/admin/orders/{id}/status
    [HttpPatch("orders/{id:long}/status")]
    public async Task<ActionResult<AdminOrderDto>> UpdateOrderStatus(
        long id, [FromBody] UpdateOrderStatusRequest request)
    {
        try   { return Ok(await _admin.UpdateOrderStatusAsync(id, request.Status)); }
        catch (KeyNotFoundException ex)      { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    // GET /api/admin/reservations?status=Confirmed&branchId=1&date=2026-06-20
    [HttpGet("reservations")]
    public async Task<ActionResult<IReadOnlyList<AdminReservationDto>>> Reservations(
        [FromQuery] string? status,
        [FromQuery] long?   branchId,
        [FromQuery] string? date)
        => Ok(await _admin.GetReservationsAsync(status, branchId, date));

    // PATCH /api/admin/reservations/{id}/status
    [HttpPatch("reservations/{id:long}/status")]
    public async Task<ActionResult<AdminReservationDto>> UpdateReservationStatus(
        long id, [FromBody] UpdateReservationStatusRequest request)
    {
        try   { return Ok(await _admin.UpdateReservationStatusAsync(id, request.Status)); }
        catch (KeyNotFoundException ex)      { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    // ── Menu items ────────────────────────────────────────────────────────────

    // GET /api/admin/menu-items
    [HttpGet("menu-items")]
    public async Task<ActionResult<IReadOnlyList<AdminMenuItemDto>>> GetMenuItems()
        => Ok(await _admin.GetMenuItemsAsync());

    // PUT /api/admin/menu-items/{id}
    [HttpPut("menu-items/{id:long}")]
    public async Task<ActionResult<AdminMenuItemDto>> UpdateMenuItem(
        long id, [FromBody] UpdateMenuItemRequest request)
    {
        try   { return Ok(await _admin.UpdateMenuItemAsync(id, request)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    // PATCH /api/admin/menu-items/{id}/prices
    [HttpPatch("menu-items/{id:long}/prices")]
    public async Task<ActionResult<AdminMenuItemDto>> UpdateMenuItemPrices(
        long id, [FromBody] UpdateMenuItemPricesRequest request)
    {
        try   { return Ok(await _admin.UpdateMenuItemPricesAsync(id, request)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    // ── Offers ────────────────────────────────────────────────────────────────

    // GET /api/admin/offers
    [HttpGet("offers")]
    public async Task<ActionResult<IReadOnlyList<AdminOfferDto>>> GetOffers()
        => Ok(await _admin.GetOffersAsync());

    // POST /api/admin/offers
    [HttpPost("offers")]
    public async Task<ActionResult<AdminOfferDto>> CreateOffer([FromBody] CreateOfferRequest request)
        => Ok(await _admin.CreateOfferAsync(request));

    // PUT /api/admin/offers/{id}
    [HttpPut("offers/{id:long}")]
    public async Task<ActionResult<AdminOfferDto>> UpdateOffer(
        long id, [FromBody] UpdateOfferRequest request)
    {
        try   { return Ok(await _admin.UpdateOfferAsync(id, request)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    // PATCH /api/admin/offers/{id}/toggle
    [HttpPatch("offers/{id:long}/toggle")]
    public async Task<ActionResult<AdminOfferDto>> ToggleOffer(long id)
    {
        try   { return Ok(await _admin.ToggleOfferAsync(id)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    // ── Customers ─────────────────────────────────────────────────────────────

    // GET /api/admin/customers?q=
    [HttpGet("customers")]
    public async Task<ActionResult<IReadOnlyList<AdminCustomerDto>>> GetCustomers([FromQuery] string? q)
        => Ok(await _admin.GetCustomersAsync(q));

    // GET /api/admin/customers/{id}
    [HttpGet("customers/{id:long}")]
    public async Task<ActionResult<AdminCustomerDetailDto>> GetCustomer(long id)
    {
        try   { return Ok(await _admin.GetCustomerDetailAsync(id)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }
}
