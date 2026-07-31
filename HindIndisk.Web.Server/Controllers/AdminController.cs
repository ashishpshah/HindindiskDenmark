using HindIndisk.Api.Application.DTOs.About;
using HindIndisk.Api.Application.DTOs.Admin;
using HindIndisk.Api.Application.DTOs.Homepage;
using HindIndisk.Api.Application.DTOs.Footer;
using HindIndisk.Api.Application.DTOs.Closure;
using HindIndisk.Api.Application.DTOs.Gallery;
using HindIndisk.Api.Application.DTOs.HeroSlide;
using HindIndisk.Api.Application.DTOs.Schedule;
using HindIndisk.Api.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EmailSettingsDto = HindIndisk.Api.Application.DTOs.Admin.EmailSettingsDto;

namespace HindIndisk.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "SystemAdmin,Admin")]
public class AdminController : ApiBaseController
{
    private static readonly HashSet<string> AllowedExtensions =
        [".jpg", ".jpeg", ".png", ".webp", ".gif"];

    private readonly IAdminService             _admin;
    private readonly IWebHostEnvironment        _env;
    private readonly ScheduleService           _schedules;
    private readonly BranchServiceStatusService _serviceStatus;
    private readonly BranchClosureService       _closures;
    private readonly IHeroSlideService          _heroSlides;
    private readonly IGalleryImageService       _gallery;
    private readonly IAboutService              _about;
    private readonly IWhyChooseUsService        _whyChooseUs;
    private readonly IHomeStorySectionService   _homeStory;
    private readonly IExceptionLogService       _exceptionLogs;
    private readonly IEmailSettingsService      _emailSettings;
    private readonly IEmailRecipientsService    _emailRecipients;
    private readonly IFooterSettingsService     _footerSettings;

    public AdminController(
        IAdminService admin, IWebHostEnvironment env,
        ScheduleService schedules, BranchServiceStatusService serviceStatus,
        BranchClosureService closures, IHeroSlideService heroSlides,
        IGalleryImageService gallery, IAboutService about,
        IWhyChooseUsService whyChooseUs, IHomeStorySectionService homeStory,
        IExceptionLogService exceptionLogs, IEmailSettingsService emailSettings,
        IEmailRecipientsService emailRecipients,
        IFooterSettingsService footerSettings)
    {
        _admin         = admin;
        _env           = env;
        _schedules     = schedules;
        _serviceStatus = serviceStatus;
        _closures      = closures;
        _heroSlides    = heroSlides;
        _gallery       = gallery;
        _about         = about;
        _whyChooseUs   = whyChooseUs;
        _homeStory     = homeStory;
        _exceptionLogs = exceptionLogs;
        _emailSettings = emailSettings;
        _emailRecipients = emailRecipients;
        _footerSettings = footerSettings;
    }

    // POST /api/admin/upload/image
    [HttpPost("upload/image")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB
    public Task<IActionResult> UploadImage(IFormFile file)
        => SaveUpload(file, "menu-items");

    // POST /api/admin/upload/gallery
    [HttpPost("upload/gallery")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB
    public Task<IActionResult> UploadGalleryImage(IFormFile file)
        => SaveUpload(file, "gallery");

    // POST /api/admin/upload/team
    [HttpPost("upload/team")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB
    public Task<IActionResult> UploadTeamImage(IFormFile file)
        => SaveUpload(file, "team");

    // POST /api/admin/upload/branches
    [HttpPost("upload/branches")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB
    public Task<IActionResult> UploadBranchImage(IFormFile file)
        => SaveUpload(file, "branches");

    // POST /api/admin/upload/hero-slides
    [HttpPost("upload/hero-slides")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB
    public Task<IActionResult> UploadHeroSlideImage(IFormFile file)
        => SaveUpload(file, "hero-slides");

    // POST /api/admin/upload/about
    [HttpPost("upload/about")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB
    public Task<IActionResult> UploadAboutImage(IFormFile file)
        => SaveUpload(file, "about");

    private async Task<IActionResult> SaveUpload(IFormFile file, string subfolder)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "No file received." });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
            return BadRequest(new { message = $"File type '{ext}' is not allowed. Use jpg, png, webp or gif." });

        var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
        var folder  = Path.Combine(webRoot, "images", subfolder);
        Directory.CreateDirectory(folder);

        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(folder, fileName);

        await using var stream = System.IO.File.Create(filePath);
        await file.CopyToAsync(stream);

        return Ok(new { url = $"/images/{subfolder}/{fileName}" });
    }

    // GET /api/admin/dashboard
    [HttpGet("dashboard")]
    public async Task<ActionResult<AdminDashboardDto>> Dashboard()
        => Ok(await _admin.GetDashboardAsync());

    // GET /api/admin/dashboard/trends
    [HttpGet("dashboard/trends")]
    public async Task<ActionResult<AdminTrendDto>> Trends()
        => Ok(await _admin.GetTrendsAsync());

    // GET /api/admin/dashboard/revenue-history?days=7
    [HttpGet("dashboard/revenue-history")]
    public async Task<ActionResult<IReadOnlyList<RevenuePointDto>>> RevenueHistory([FromQuery] int days = 7)
        => Ok(await _admin.GetRevenueHistoryAsync(days));

    // GET /api/admin/dashboard/top-items?days=7
    [HttpGet("dashboard/top-items")]
    public async Task<ActionResult<IReadOnlyList<TopItemDto>>> TopItems([FromQuery] int days = 7)
        => Ok(await _admin.GetTopItemsAsync(days));

    // GET /api/admin/dashboard/branch-overview
    [HttpGet("dashboard/branch-overview")]
    public async Task<ActionResult<IReadOnlyList<BranchOverviewDto>>> BranchOverview()
        => Ok(await _admin.GetBranchOverviewAsync());

    // GET /api/admin/dashboard/hourly-volume?date=2026-07-10
    [HttpGet("dashboard/hourly-volume")]
    public async Task<ActionResult<IReadOnlyList<HourlyVolumeDto>>> HourlyVolume([FromQuery] string? date = null)
        => Ok(await _admin.GetHourlyVolumeAsync(date));

    // GET /api/admin/orders?page=1&pageSize=20&status=Placed&branchId=1&search=&dateFrom=2026-07-13&dateTo=2026-07-13
    [HttpGet("orders")]
    public async Task<ActionResult<OrderPageDto>> Orders(
        [FromQuery] int     page     = 1,
        [FromQuery] int     pageSize = 20,
        [FromQuery] string? status   = null,
        [FromQuery] long?   branchId = null,
        [FromQuery] string? search   = null,
        [FromQuery] string? dateFrom = null,
        [FromQuery] string? dateTo   = null)
        => Ok(await _admin.GetOrdersAsync(page, pageSize, status, branchId, search, dateFrom, dateTo));

    // GET /api/admin/orders/counts-by-status
    [HttpGet("orders/counts-by-status")]
    public async Task<ActionResult<IReadOnlyList<StatusCountDto>>> OrderCountsByStatus()
        => Ok(await _admin.GetOrderCountsByStatusAsync());

    // ── Order Status CRUD ──────────────────────────────────────────────────

    // GET /api/admin/order-statuses (public — reference data for customer UI)
    [AllowAnonymous]
    [HttpGet("order-statuses")]
    public async Task<ActionResult<IReadOnlyList<OrderStatusDto>>> GetOrderStatuses()
        => Ok(await _admin.GetOrderStatusesAsync());

    // POST /api/admin/order-statuses
    [HttpPost("order-statuses")]
    public async Task<ActionResult<OrderStatusDto>> CreateOrderStatus([FromBody] CreateOrderStatusRequest request)
    {
        try   { return Ok(await _admin.CreateOrderStatusAsync(request)); }
        catch (InvalidOperationException ex)
        {
            await LogExAsync(ex, 400);
            return BadRequest(new { message = ex.Message });
        }
    }

    // PUT /api/admin/order-statuses/{id}
    [HttpPut("order-statuses/{id:long}")]
    public async Task<ActionResult<OrderStatusDto>> UpdateOrderStatusMeta(
        long id, [FromBody] UpdateOrderStatusMetaRequest request)
    {
        try   { return Ok(await _admin.UpdateOrderStatusMetaAsync(id, request)); }
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            await LogExAsync(ex, 400);
            return BadRequest(new { message = ex.Message });
        }
    }

    // DELETE /api/admin/order-statuses/{id}
    [HttpDelete("order-statuses/{id:long}")]
    public async Task<IActionResult> DeleteOrderStatus(long id)
    {
        try   { await _admin.DeleteOrderStatusAsync(id); return NoContent(); }
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            await LogExAsync(ex, 400);
            return BadRequest(new { message = ex.Message });
        }
    }

    // ── Order Status Transition CRUD ───────────────────────────────────────

    // GET /api/admin/order-status-transitions
    [HttpGet("order-status-transitions")]
    public async Task<ActionResult<IReadOnlyList<OrderStatusTransitionDto>>> GetOrderStatusTransitions()
        => Ok(await _admin.GetOrderStatusTransitionsAsync());

    // POST /api/admin/order-status-transitions
    [HttpPost("order-status-transitions")]
    public async Task<ActionResult<OrderStatusTransitionDto>> CreateOrderStatusTransition(
        [FromBody] CreateOrderStatusTransitionRequest request)
    {
        try   { return Ok(await _admin.CreateOrderStatusTransitionAsync(request)); }
        catch (InvalidOperationException ex)
        {
            await LogExAsync(ex, 400);
            return BadRequest(new { message = ex.Message });
        }
    }

    // DELETE /api/admin/order-status-transitions/{id}
    [HttpDelete("order-status-transitions/{id:long}")]
    public async Task<IActionResult> DeleteOrderStatusTransition(long id)
    {
        try   { await _admin.DeleteOrderStatusTransitionAsync(id); return NoContent(); }
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
    }

    // PATCH /api/admin/orders/{id}/status
    [HttpPatch("orders/{id:long}/status")]
    public async Task<ActionResult<AdminOrderDto>> UpdateOrderStatus(
        long id, [FromBody] OrderChangeStatusRequest request)
    {
        try   { return Ok(await _admin.UpdateOrderStatusAsync(id, request.Status, request.CancellationReason)); }
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            await LogExAsync(ex, 400);
            return BadRequest(new { message = ex.Message });
        }
    }

    // POST /api/admin/orders/{id}/resend-email
    [HttpPost("orders/{id:long}/resend-email")]
    public async Task<IActionResult> ResendOrderEmail(long id)
    {
        try
        {
            await _admin.ResendOrderStatusEmailAsync(id);
            return Ok(new { message = "Email resent." });
        }
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            await LogExAsync(ex, 400);
            return BadRequest(new { message = ex.Message });
        }
    }

    // GET /api/admin/reservations?status=Confirmed&branchId=1&search=%2346&dateFrom=2026-07-13&dateTo=2026-07-19
    [HttpGet("reservations")]
    public async Task<ActionResult<IReadOnlyList<AdminReservationDto>>> Reservations(
        [FromQuery] string? status,
        [FromQuery] long?   branchId,
        [FromQuery] string? date,
        [FromQuery] string? search   = null,
        [FromQuery] string? dateFrom = null,
        [FromQuery] string? dateTo   = null)
        => Ok(await _admin.GetReservationsAsync(status, branchId, date, search, dateFrom, dateTo));

    // PATCH /api/admin/reservations/{id}/status
    [HttpPatch("reservations/{id:long}/status")]
    public async Task<ActionResult<AdminReservationDto>> UpdateReservationStatus(
        long id, [FromBody] UpdateReservationStatusRequest request)
    {
        try   { return Ok(await _admin.UpdateReservationStatusAsync(id, request.Status, request.CancellationReason)); }
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            await LogExAsync(ex, 400);
            return BadRequest(new { message = ex.Message });
        }
    }

    // POST /api/admin/reservations/{id}/resend-email
    [HttpPost("reservations/{id:long}/resend-email")]
    public async Task<IActionResult> ResendReservationEmail(long id)
    {
        try
        {
            await _admin.ResendReservationStatusEmailAsync(id);
            return Ok(new { message = "Email resent." });
        }
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            await LogExAsync(ex, 400);
            return BadRequest(new { message = ex.Message });
        }
    }

    // ── Menus (categories) ───────────────────────────────────────────────────

    // GET /api/admin/menus?page=1&pageSize=20&search=&branchId=
    [HttpGet("menus")]
    public async Task<ActionResult<MenuPageDto>> GetMenus(
        [FromQuery] int?    page     = null,
        [FromQuery] int?    pageSize = null,
        [FromQuery] string? search   = null,
        [FromQuery] long?   branchId = null)
        => Ok(await _admin.GetMenusAsync(page, pageSize, search, branchId));

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
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
    }

    // PATCH /api/admin/menus/{id}/toggle
    [HttpPatch("menus/{id:long}/toggle")]
    public async Task<ActionResult<AdminMenuDto>> ToggleMenu(long id)
    {
        try   { return Ok(await _admin.ToggleMenuAsync(id)); }
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
    }

    // DELETE /api/admin/menus/{id}
    [HttpDelete("menus/{id:long}")]
    public async Task<IActionResult> DeleteMenu(long id)
    {
        try   { await _admin.DeleteMenuAsync(id); return NoContent(); }
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
    }

    // POST /api/admin/menus/{menuId}/items/{itemId}
    [HttpPost("menus/{menuId:long}/items/{itemId:long}")]
    public async Task<ActionResult<AdminMenuDto>> AddItemToMenu(long menuId, long itemId)
    {
        try   { return Ok(await _admin.AddItemToMenuAsync(menuId, itemId)); }
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
    }

    // DELETE /api/admin/menus/{menuId}/items/{itemId}
    [HttpDelete("menus/{menuId:long}/items/{itemId:long}")]
    public async Task<ActionResult<AdminMenuDto>> RemoveItemFromMenu(long menuId, long itemId)
    {
        try   { return Ok(await _admin.RemoveItemFromMenuAsync(menuId, itemId)); }
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
    }

    // PATCH /api/admin/menus/{menuId}/items/reorder
    [HttpPatch("menus/{menuId:long}/items/reorder")]
    public async Task<ActionResult<AdminMenuDto>> ReorderMenuItems(
        long menuId, [FromBody] ReorderMenuItemsRequest request)
    {
        try   { return Ok(await _admin.ReorderMenuItemsAsync(menuId, request)); }
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
    }

    // ── Menu items ────────────────────────────────────────────────────────────

    // GET /api/admin/menu-items?page=1&pageSize=20&search=&branchId=
    [HttpGet("menu-items")]
    public async Task<ActionResult<MenuItemPageDto>> GetMenuItems(
        [FromQuery] int?    page     = null,
        [FromQuery] int?    pageSize = null,
        [FromQuery] string? search   = null,
        [FromQuery] long?   branchId = null)
        => Ok(await _admin.GetMenuItemsAsync(page, pageSize, search, branchId));

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
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
    }

    // PATCH /api/admin/menu-items/{id}/prices
    [HttpPatch("menu-items/{id:long}/prices")]
    public async Task<ActionResult<AdminMenuItemDto>> UpdateMenuItemPrices(
        long id, [FromBody] UpdateMenuItemPricesRequest request)
    {
        try   { return Ok(await _admin.UpdateMenuItemPricesAsync(id, request)); }
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
    }

    // DELETE /api/admin/menu-items/{id}
    [HttpDelete("menu-items/{id:long}")]
    public async Task<IActionResult> DeleteMenuItem(long id)
    {
        try   { await _admin.DeleteMenuItemAsync(id); return NoContent(); }
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
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
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
    }

    // PATCH /api/admin/offers/{id}/toggle
    [HttpPatch("offers/{id:long}/toggle")]
    public async Task<ActionResult<AdminOfferDto>> ToggleOffer(long id)
    {
        try   { return Ok(await _admin.ToggleOfferAsync(id)); }
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
    }

    // DELETE /api/admin/offers/{id}
    [HttpDelete("offers/{id:long}")]
    public async Task<IActionResult> DeleteOffer(long id)
    {
        try   { await _admin.DeleteOfferAsync(id); return NoContent(); }
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
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
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
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
        catch (InvalidOperationException ex)
        {
            await LogExAsync(ex, 400);
            return BadRequest(ex.Message);
        }
    }

    // ── Branch closures (scheduled / weekly-off) ──────────────────────────────

    // GET /api/admin/branches/{id}/closures
    [HttpGet("branches/{id:long}/closures")]
    public async Task<ActionResult<IReadOnlyList<BranchClosureDto>>> GetClosures(long id)
        => Ok(await _closures.GetAsync(id));

    // POST /api/admin/branches/{id}/closures
    [HttpPost("branches/{id:long}/closures")]
    public async Task<ActionResult<BranchClosureDto>> CreateClosure(
        long id, [FromBody] CreateBranchClosureRequest request)
    {
        var adminEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "admin";
        try   { return Ok(await _closures.CreateAsync(id, request, adminEmail)); }
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            await LogExAsync(ex, 400);
            return BadRequest(new { message = ex.Message });
        }
    }

    // DELETE /api/admin/branches/{id}/closures/{closureId}
    [HttpDelete("branches/{id:long}/closures/{closureId:long}")]
    public async Task<IActionResult> DeleteClosure(long id, long closureId)
    {
        try   { await _closures.DeleteAsync(id, closureId); return NoContent(); }
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
    }

    // GET /api/admin/closures/conflicts?branchId=1&scope=Reservation&startDate=2026-07-08&endDate=2026-07-08&startTime=10:00&endTime=14:00
    [HttpGet("closures/conflicts")]
    public async Task<IActionResult> GetClosureConflicts(
        [FromQuery] long    branchId,
        [FromQuery] string  scope,
        [FromQuery] string  startDate,
        [FromQuery] string  endDate,
        [FromQuery] string? startTime = null,
        [FromQuery] string? endTime   = null)
    {
        if (!DateOnly.TryParseExact(startDate, "yyyy-MM-dd", out var start) ||
            !DateOnly.TryParseExact(endDate,   "yyyy-MM-dd", out var end))
            return BadRequest(new { message = "Invalid date format. Use yyyy-MM-dd." });

        TimeOnly? tStart = null, tEnd = null;
        if (!string.IsNullOrEmpty(startTime) && !string.IsNullOrEmpty(endTime))
        {
            if (!TimeOnly.TryParseExact(startTime, "HH:mm", out var ts) ||
                !TimeOnly.TryParseExact(endTime,   "HH:mm", out var te))
                return BadRequest(new { message = "Invalid time format. Use HH:mm." });
            tStart = ts; tEnd = te;
        }

        return Ok(await _closures.GetConflictsAsync(branchId, scope, start, end, tStart, tEnd));
    }

    // POST /api/admin/closures/cancel-affected
    [HttpPost("closures/cancel-affected")]
    public async Task<IActionResult> CancelAffected([FromBody] CancelAffectedRequest request)
    {
        await _closures.CancelAffectedAsync(
            request.ReservationIds ?? [],
            request.OrderIds       ?? [],
            request.Reason);
        return NoContent();
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
        try   { return Ok(await _serviceStatus.ToggleAsync(id, request.ServiceType, request.IsClosed, adminEmail, request.Note, request.NoteDa)); }
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
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

    // GET /api/admin/customers?page=1&pageSize=20&q=
    [HttpGet("customers")]
    public async Task<ActionResult<CustomerPageDto>> GetCustomers(
        [FromQuery] int     page     = 1,
        [FromQuery] int     pageSize = 20,
        [FromQuery] string? q        = null)
        => Ok(await _admin.GetCustomersAsync(page, pageSize, q));

    // GET /api/admin/customers/{id}
    [HttpGet("customers/{id:long}")]
    public async Task<ActionResult<AdminCustomerDetailDto>> GetCustomer(long id)
    {
        try   { return Ok(await _admin.GetCustomerDetailAsync(id)); }
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
    }

    // ── Hero Slides ─────────────────────────────────────────────────────────

    // GET /api/admin/hero-slides
    [HttpGet("hero-slides")]
    public async Task<ActionResult<IReadOnlyList<HeroSlideDto>>> GetHeroSlides()
        => Ok(await _heroSlides.GetAllAsync());

    // GET /api/admin/hero-slides/{id}
    [HttpGet("hero-slides/{id:long}")]
    public async Task<ActionResult<HeroSlideDto>> GetHeroSlide(long id)
    {
        var slide = await _heroSlides.GetByIdAsync(id);
        return slide is null ? NotFound(new { message = $"Hero slide {id} not found." }) : Ok(slide);
    }

    // POST /api/admin/hero-slides
    [HttpPost("hero-slides")]
    public async Task<ActionResult<HeroSlideDto>> CreateHeroSlide([FromBody] CreateHeroSlideRequest request)
        => Ok(await _heroSlides.CreateAsync(request));

    // PUT /api/admin/hero-slides/{id}
    [HttpPut("hero-slides/{id:long}")]
    public async Task<ActionResult<HeroSlideDto>> UpdateHeroSlide(
        long id, [FromBody] UpdateHeroSlideRequest request)
    {
        try { return Ok(await _heroSlides.UpdateAsync(id, request)); }
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
    }

    // DELETE /api/admin/hero-slides/{id}
    [HttpDelete("hero-slides/{id:long}")]
    public async Task<IActionResult> DeleteHeroSlide(long id)
    {
        try { await _heroSlides.DeleteAsync(id); return NoContent(); }
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
    }

    // PUT /api/admin/hero-slides/{id}/reorder
    [HttpPut("hero-slides/{id:long}/reorder")]
    public async Task<ActionResult<HeroSlideDto>> ReorderHeroSlide(
        long id, [FromBody] ReorderHeroSlideRequest request)
    {
        try { return Ok(await _heroSlides.ReorderAsync(id, request.SortOrder)); }
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
    }

    // ── Gallery ───────────────────────────────────────────────────────────────

    // GET /api/admin/gallery
    [HttpGet("gallery")]
    public async Task<ActionResult<IReadOnlyList<GalleryImageDto>>> GetGallery()
        => Ok(await _gallery.GetAllAsync());

    // POST /api/admin/gallery
    [HttpPost("gallery")]
    public async Task<ActionResult<GalleryImageDto>> CreateGalleryImage([FromBody] CreateGalleryImageRequest request)
        => Ok(await _gallery.CreateAsync(request));

    // PATCH /api/admin/gallery/{id}
    [HttpPatch("gallery/{id:long}")]
    public async Task<ActionResult<GalleryImageDto>> UpdateGalleryImage(
        long id, [FromBody] UpdateGalleryImageRequest request)
    {
        try   { return Ok(await _gallery.UpdateAsync(id, request)); }
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
    }

    // DELETE /api/admin/gallery/{id}
    [HttpDelete("gallery/{id:long}")]
    public async Task<IActionResult> DeleteGalleryImage(long id)
    {
        var deleted = await _gallery.DeleteAsync(id);
        return deleted ? NoContent() : NotFound(new { message = $"Gallery image {id} not found." });
    }

    // PUT /api/admin/gallery/{id}/reorder
    [HttpPut("gallery/{id:long}/reorder")]
    public async Task<ActionResult<GalleryImageDto>> ReorderGalleryImage(
        long id, [FromBody] int sortOrder)
    {
        try   { return Ok(await _gallery.ReorderAsync(id, sortOrder)); }
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
    }

    // ── Why Choose Us ─────────────────────────────────────────────────────────

    // GET /api/admin/why-choose-us
    [HttpGet("why-choose-us")]
    public async Task<IActionResult> GetWhyChooseUs()
        => Ok(await _whyChooseUs.GetAllAsync());

    // POST /api/admin/why-choose-us
    [HttpPost("why-choose-us")]
    public async Task<IActionResult> CreateWhyChooseUs([FromBody] SaveWhyChooseUsItemRequest req)
        => Ok(await _whyChooseUs.CreateAsync(req));

    // PUT /api/admin/why-choose-us/{id}
    [HttpPut("why-choose-us/{id:long}")]
    public async Task<IActionResult> UpdateWhyChooseUs(long id, [FromBody] SaveWhyChooseUsItemRequest req)
    {
        try   { return Ok(await _whyChooseUs.UpdateAsync(id, req)); }
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
    }

    // DELETE /api/admin/why-choose-us/{id}
    [HttpDelete("why-choose-us/{id:long}")]
    public async Task<IActionResult> DeleteWhyChooseUs(long id)
        => await _whyChooseUs.DeleteAsync(id) ? NoContent() : NotFound();

    // ── Our Story section ─────────────────────────────────────────────────────

    // GET /api/admin/home-story
    [HttpGet("home-story")]
    public async Task<IActionResult> GetHomeStory()
        => Ok(await _homeStory.GetAsync());

    // PATCH /api/admin/home-story
    [HttpPatch("home-story")]
    public async Task<IActionResult> UpdateHomeStory([FromBody] UpdateHomeStorySectionRequest req)
        => Ok(await _homeStory.UpdateAsync(req));

    // ── Footer settings ────────────────────────────────────────────────────────

    // GET /api/admin/footer-settings
    [HttpGet("footer-settings")]
    public async Task<IActionResult> GetFooterSettings()
        => Ok(await _footerSettings.GetAsync());

    // PATCH /api/admin/footer-settings
    [HttpPatch("footer-settings")]
    public async Task<IActionResult> UpdateFooterSettings([FromBody] UpdateFooterSettingsRequest req)
        => Ok(await _footerSettings.UpdateAsync(req));

    // ── About page: images/timeline/team (branch-scoped) ────────────────────────

    // GET /api/admin/branches/{id}/about/settings
    [HttpGet("branches/{id:long}/about/settings")]
    public async Task<IActionResult> GetAboutSettings(long id)
        => Ok(await _about.GetSettingsAsync(id));

    // PATCH /api/admin/branches/{id}/about/settings
    [HttpPatch("branches/{id:long}/about/settings")]
    public async Task<IActionResult> UpdateAboutSettings(long id, [FromBody] UpdateAboutSettingsRequest req)
        => Ok(await _about.UpdateSettingsAsync(id, req));

    // GET /api/admin/about/stats
    [HttpGet("about/stats")]
    public async Task<IActionResult> GetAboutStats()
        => Ok(await _about.GetStatsAsync());

    // POST /api/admin/about/stats
    [HttpPost("about/stats")]
    public async Task<IActionResult> CreateAboutStat([FromBody] SaveAboutStatRequest req)
        => Ok(await _about.CreateStatAsync(req));

    // PUT /api/admin/about/stats/{id}
    [HttpPut("about/stats/{id:long}")]
    public async Task<IActionResult> UpdateAboutStat(long id, [FromBody] SaveAboutStatRequest req)
    {
        try   { return Ok(await _about.UpdateStatAsync(id, req)); }
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
    }

    // DELETE /api/admin/about/stats/{id}
    [HttpDelete("about/stats/{id:long}")]
    public async Task<IActionResult> DeleteAboutStat(long id)
        => await _about.DeleteStatAsync(id) ? NoContent() : NotFound();

    // GET /api/admin/about/mvv
    [HttpGet("about/mvv")]
    public async Task<IActionResult> GetAboutMvv()
        => Ok(await _about.GetMvvAsync());

    // POST /api/admin/about/mvv
    [HttpPost("about/mvv")]
    public async Task<IActionResult> CreateAboutMvv([FromBody] SaveAboutMvvRequest req)
        => Ok(await _about.CreateMvvAsync(req));

    // PUT /api/admin/about/mvv/{id}
    [HttpPut("about/mvv/{id:long}")]
    public async Task<IActionResult> UpdateAboutMvv(long id, [FromBody] SaveAboutMvvRequest req)
    {
        try   { return Ok(await _about.UpdateMvvAsync(id, req)); }
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
    }

    // DELETE /api/admin/about/mvv/{id}
    [HttpDelete("about/mvv/{id:long}")]
    public async Task<IActionResult> DeleteAboutMvv(long id)
        => await _about.DeleteMvvAsync(id) ? NoContent() : NotFound();

    // GET /api/admin/branches/{id}/about/timeline
    [HttpGet("branches/{id:long}/about/timeline")]
    public async Task<IActionResult> GetAboutTimeline(long id)
        => Ok(await _about.GetTimelineAsync(id));

    // POST /api/admin/branches/{id}/about/timeline
    [HttpPost("branches/{id:long}/about/timeline")]
    public async Task<IActionResult> CreateAboutTimelineItem(long id, [FromBody] SaveAboutTimelineRequest req)
        => Ok(await _about.CreateTimelineItemAsync(id, req));

    // PUT /api/admin/branches/{id}/about/timeline/{itemId}
    [HttpPut("branches/{id:long}/about/timeline/{itemId:long}")]
    public async Task<IActionResult> UpdateAboutTimelineItem(long id, long itemId, [FromBody] SaveAboutTimelineRequest req)
    {
        try   { return Ok(await _about.UpdateTimelineItemAsync(id, itemId, req)); }
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
    }

    // DELETE /api/admin/branches/{id}/about/timeline/{itemId}
    [HttpDelete("branches/{id:long}/about/timeline/{itemId:long}")]
    public async Task<IActionResult> DeleteAboutTimelineItem(long id, long itemId)
        => await _about.DeleteTimelineItemAsync(id, itemId) ? NoContent() : NotFound();

    // GET /api/admin/branches/{id}/about/team
    [HttpGet("branches/{id:long}/about/team")]
    public async Task<IActionResult> GetAboutTeam(long id)
        => Ok(await _about.GetTeamAsync(id));

    // POST /api/admin/branches/{id}/about/team
    [HttpPost("branches/{id:long}/about/team")]
    public async Task<IActionResult> CreateAboutTeamMember(long id, [FromBody] SaveTeamMemberRequest req)
        => Ok(await _about.CreateTeamMemberAsync(id, req));

    // PUT /api/admin/branches/{id}/about/team/{memberId}
    [HttpPut("branches/{id:long}/about/team/{memberId:long}")]
    public async Task<IActionResult> UpdateAboutTeamMember(long id, long memberId, [FromBody] SaveTeamMemberRequest req)
    {
        try   { return Ok(await _about.UpdateTeamMemberAsync(id, memberId, req)); }
        catch (KeyNotFoundException ex)
        {
            await LogExAsync(ex, 404);
            return NotFound(new { message = ex.Message });
        }
    }

    // DELETE /api/admin/branches/{id}/about/team/{memberId}
    [HttpDelete("branches/{id:long}/about/team/{memberId:long}")]
    public async Task<IActionResult> DeleteAboutTeamMember(long id, long memberId)
        => await _about.DeleteTeamMemberAsync(id, memberId) ? NoContent() : NotFound();

    // ── Email settings ────────────────────────────────────────────────────────

    // GET /api/admin/email-settings
    [HttpGet("email-settings")]
    public async Task<ActionResult<EmailSettingsDto>> GetEmailSettings()
        => Ok(await _emailSettings.GetAsync());

    // PATCH /api/admin/email-settings
    [HttpPatch("email-settings")]
    public async Task<ActionResult<EmailSettingsDto>> UpdateEmailSettings(
        [FromBody] UpdateEmailSettingsRequest request)
        => Ok(await _emailSettings.UpdateAsync(request));

    // GET /api/admin/email-settings/recipients
    [HttpGet("email-settings/recipients")]
    public async Task<ActionResult<IReadOnlyList<BranchEmailRecipientsDto>>> GetEmailRecipients()
        => Ok(await _emailRecipients.GetAllAsync());

    // PATCH /api/admin/email-settings/recipients/{branchId}
    [HttpPatch("email-settings/recipients/{branchId:long}")]
    public async Task<ActionResult<BranchEmailRecipientsDto>> UpdateEmailRecipients(
        long branchId, [FromBody] UpdateBranchEmailRecipientsRequest request)
        => Ok(await _emailRecipients.UpdateAsync(branchId, request));

    // ── Exception logs ────────────────────────────────────────────────────────

    // GET /api/admin/exception-logs?page=1&pageSize=50&search=&from=&to=&module=&logLevel=
    [HttpGet("exception-logs")]
    [Authorize(Roles = "SystemAdmin")]
    public async Task<ActionResult<ExceptionLogPageDto>> GetExceptionLogs(
        [FromQuery] int       page     = 1,
        [FromQuery] int       pageSize = 50,
        [FromQuery] string?   search   = null,
        [FromQuery] DateTime? from     = null,
        [FromQuery] DateTime? to       = null,
        [FromQuery] string?   module   = null,
        [FromQuery] string?   logLevel = null)
        => Ok(await _exceptionLogs.GetRecentAsync(page, pageSize, search, from, to, module, logLevel));
}
