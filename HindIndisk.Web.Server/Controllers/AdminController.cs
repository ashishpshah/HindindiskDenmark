using HindIndisk.Api.Application.DTOs.Admin;
using HindIndisk.Api.Application.DTOs.Schedule;
using HindIndisk.Api.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HindIndisk.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "SystemAdmin,Admin")]
public class AdminController : ControllerBase
{
    private static readonly HashSet<string> AllowedExtensions =
        [".jpg", ".jpeg", ".png", ".webp", ".gif"];

    private readonly IAdminService             _admin;
    private readonly IWebHostEnvironment        _env;
    private readonly ScheduleService           _schedules;
    private readonly BranchServiceStatusService _serviceStatus;
    private readonly IExceptionLogService       _exceptionLogs;

    public AdminController(
        IAdminService admin, IWebHostEnvironment env,
        ScheduleService schedules, BranchServiceStatusService serviceStatus,
        IExceptionLogService exceptionLogs)
    {
        _admin         = admin;
        _env           = env;
        _schedules     = schedules;
        _serviceStatus = serviceStatus;
        _exceptionLogs = exceptionLogs;
    }

    // POST /api/admin/upload/image
    [HttpPost("upload/image")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "No file received." });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
            return BadRequest(new { message = $"File type '{ext}' is not allowed. Use jpg, png, webp or gif." });

        var folder = Path.Combine(_env.WebRootPath, "images", "menu-items");
        Directory.CreateDirectory(folder);

        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(folder, fileName);

        await using var stream = System.IO.File.Create(filePath);
        await file.CopyToAsync(stream);

        var url = $"/images/menu-items/{fileName}";
        return Ok(new { url });
    }

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
        try   { return Ok(await _admin.UpdateOrderStatusAsync(id, request.Status, request.CancellationReason)); }
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

    // ── Menus (categories) ───────────────────────────────────────────────────

    // GET /api/admin/menus
    [HttpGet("menus")]
    public async Task<ActionResult<IReadOnlyList<AdminMenuDto>>> GetMenus()
        => Ok(await _admin.GetMenusAsync());

    // POST /api/admin/menus
    [HttpPost("menus")]
    public async Task<ActionResult<AdminMenuDto>> CreateMenu([FromBody] CreateMenuRequest request)
        => Ok(await _admin.CreateMenuAsync(request));

    // PUT /api/admin/menus/{id}
    [HttpPut("menus/{id:long}")]
    public async Task<ActionResult<AdminMenuDto>> UpdateMenu(
        long id, [FromBody] UpdateMenuRequest request)
    {
        try   { return Ok(await _admin.UpdateMenuAsync(id, request)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    // PATCH /api/admin/menus/{id}/toggle
    [HttpPatch("menus/{id:long}/toggle")]
    public async Task<ActionResult<AdminMenuDto>> ToggleMenu(long id)
    {
        try   { return Ok(await _admin.ToggleMenuAsync(id)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    // DELETE /api/admin/menus/{id}
    [HttpDelete("menus/{id:long}")]
    public async Task<IActionResult> DeleteMenu(long id)
    {
        try   { await _admin.DeleteMenuAsync(id); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    // POST /api/admin/menus/{menuId}/items/{itemId}
    [HttpPost("menus/{menuId:long}/items/{itemId:long}")]
    public async Task<ActionResult<AdminMenuDto>> AddItemToMenu(long menuId, long itemId)
    {
        try   { return Ok(await _admin.AddItemToMenuAsync(menuId, itemId)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    // DELETE /api/admin/menus/{menuId}/items/{itemId}
    [HttpDelete("menus/{menuId:long}/items/{itemId:long}")]
    public async Task<ActionResult<AdminMenuDto>> RemoveItemFromMenu(long menuId, long itemId)
    {
        try   { return Ok(await _admin.RemoveItemFromMenuAsync(menuId, itemId)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    // PATCH /api/admin/menus/{menuId}/items/reorder
    [HttpPatch("menus/{menuId:long}/items/reorder")]
    public async Task<ActionResult<AdminMenuDto>> ReorderMenuItems(
        long menuId, [FromBody] ReorderMenuItemsRequest request)
    {
        try   { return Ok(await _admin.ReorderMenuItemsAsync(menuId, request)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    // ── Menu items ────────────────────────────────────────────────────────────

    // GET /api/admin/menu-items
    [HttpGet("menu-items")]
    public async Task<ActionResult<IReadOnlyList<AdminMenuItemDto>>> GetMenuItems()
        => Ok(await _admin.GetMenuItemsAsync());

    // POST /api/admin/menu-items
    [HttpPost("menu-items")]
    public async Task<ActionResult<AdminMenuItemDto>> CreateMenuItem([FromBody] CreateMenuItemRequest request)
        => Ok(await _admin.CreateMenuItemAsync(request));

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

    // DELETE /api/admin/menu-items/{id}
    [HttpDelete("menu-items/{id:long}")]
    public async Task<IActionResult> DeleteMenuItem(long id)
    {
        try   { await _admin.DeleteMenuItemAsync(id); return NoContent(); }
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

    // DELETE /api/admin/offers/{id}
    [HttpDelete("offers/{id:long}")]
    public async Task<IActionResult> DeleteOffer(long id)
    {
        try   { await _admin.DeleteOfferAsync(id); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    // ── Branches ─────────────────────────────────────────────────────────────

    // GET /api/admin/branches
    [HttpGet("branches")]
    public async Task<ActionResult<IReadOnlyList<AdminBranchDto>>> GetBranches()
        => Ok(await _admin.GetBranchesAsync());

    // POST /api/admin/branches
    [HttpPost("branches")]
    public async Task<ActionResult<AdminBranchDto>> CreateBranch([FromBody] CreateBranchRequest request)
        => Ok(await _admin.CreateBranchAsync(request));

    // PUT /api/admin/branches/{id}
    [HttpPut("branches/{id:long}")]
    public async Task<ActionResult<AdminBranchDto>> UpdateBranch(
        long id, [FromBody] UpdateBranchRequest request)
    {
        try   { return Ok(await _admin.UpdateBranchAsync(id, request)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    // ── Branch schedules ──────────────────────────────────────────────────────

    // GET /api/admin/branches/{id}/schedule
    [HttpGet("branches/{id:long}/schedule")]
    public async Task<ActionResult<IReadOnlyList<BranchDayScheduleDto>>> GetSchedule(long id)
        => Ok(await _schedules.GetScheduleAsync(id));

    // PUT /api/admin/branches/{id}/schedule
    [HttpPut("branches/{id:long}/schedule")]
    public async Task<ActionResult<IReadOnlyList<BranchDayScheduleDto>>> UpsertSchedule(
        long id, [FromBody] List<UpsertDayScheduleRequest> request)
    {
        try   { return Ok(await _schedules.UpsertScheduleAsync(id, request)); }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }

    // ── Branch service status ─────────────────────────────────────────────────

    // GET /api/admin/service-status
    [HttpGet("service-status")]
    public async Task<ActionResult<IReadOnlyList<AdminBranchDto>>> GetServiceStatus()
        => Ok(await _serviceStatus.GetAllStatusAsync());

    // PATCH /api/admin/branches/{id}/service-status
    [HttpPatch("branches/{id:long}/service-status")]
    public async Task<ActionResult<BranchServiceClosureDto>> ToggleServiceStatus(
        long id, [FromBody] ToggleServiceRequest request)
    {
        var adminEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "admin";
        try   { return Ok(await _serviceStatus.ToggleAsync(id, request.ServiceType, request.IsClosed, adminEmail)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    // GET /api/admin/service-closures?branchId=&serviceType=&from=&to=
    [HttpGet("service-closures")]
    public async Task<ActionResult<IReadOnlyList<BranchServiceClosureDto>>> GetServiceClosures(
        [FromQuery] long?   branchId,
        [FromQuery] string? serviceType,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to)
        => Ok(await _serviceStatus.GetHistoryAsync(branchId, serviceType, from, to));

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

    // ── Exception logs ────────────────────────────────────────────────────────

    // GET /api/admin/exception-logs?page=1&pageSize=50&search=&from=&to=&module=
    [HttpGet("exception-logs")]
    [Authorize(Roles = "SystemAdmin")]
    public async Task<ActionResult<ExceptionLogPageDto>> GetExceptionLogs(
        [FromQuery] int      page     = 1,
        [FromQuery] int      pageSize = 50,
        [FromQuery] string?  search   = null,
        [FromQuery] DateTime? from    = null,
        [FromQuery] DateTime? to      = null,
        [FromQuery] string?  module   = null)
        => Ok(await _exceptionLogs.GetRecentAsync(page, pageSize, search, from, to, module));
}
