using HindIndisk.Api.Application.DTOs.About;
using HindIndisk.Api.Application.DTOs.Closure;
using HindIndisk.Api.Application.DTOs.Homepage;
using HindIndisk.Api.Application.DTOs.Gallery;
using HindIndisk.Api.Application.DTOs.HeroSlide;
using HindIndisk.Api.Application.DTOs.Location;
using HindIndisk.Api.Application.DTOs.Schedule;
using HindIndisk.Api.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace HindIndisk.Api.Controllers;

[ApiController]
[Route("api/locations")]
public class LocationsController : ControllerBase
{
    private readonly ILocationService    _locations;
    private readonly SlotService         _slots;
    private readonly BranchClosureService _closures;
    private readonly IHeroSlideService   _heroSlides;
    private readonly IGalleryImageService _gallery;
    private readonly IAboutService            _about;
    private readonly IWhyChooseUsService      _whyChooseUs;
    private readonly IHomeStorySectionService _homeStory;

    public LocationsController(ILocationService locations, SlotService slots,
        BranchClosureService closures, IHeroSlideService heroSlides,
        IGalleryImageService gallery, IAboutService about,
        IWhyChooseUsService whyChooseUs, IHomeStorySectionService homeStory)
    {
        _locations   = locations;
        _slots       = slots;
        _closures    = closures;
        _heroSlides  = heroSlides;
        _gallery     = gallery;
        _about       = about;
        _whyChooseUs = whyChooseUs;
        _homeStory   = homeStory;
    }

    /// <summary>All restaurant branches with address, hours, and contact details.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<BranchDto>), 200)]
    public async Task<IActionResult> GetBranches()
        => Ok(await _locations.GetBranchesAsync());

    /// <summary>Scheduled closures for a branch (public — used by the date picker).</summary>
    [HttpGet("closures")]
    [ProducesResponseType(typeof(IReadOnlyList<BranchClosureDto>), 200)]
    public async Task<IActionResult> GetClosures([FromQuery] long branchId)
    {
        if (branchId <= 0) return BadRequest("branchId is required.");
        return Ok(await _closures.GetAsync(branchId));
    }

    /// <summary>Available time slots for a branch on a given date.</summary>
    /// <param name="branchId">Branch ID</param>
    /// <param name="date">Date in YYYY-MM-DD format</param>
    /// <param name="type">reservation | order</param>
    [HttpGet("slots")]
    [ProducesResponseType(typeof(SlotResultDto), 200)]
    public async Task<IActionResult> GetSlots(
        [FromQuery] long   branchId,
        [FromQuery] string date,
        [FromQuery] string type = "reservation")
    {
        if (branchId <= 0 || string.IsNullOrWhiteSpace(date))
            return BadRequest("branchId and date are required.");

        if (!DateOnly.TryParse(date, out _))
            return BadRequest("date must be in YYYY-MM-DD format.");

        var result = await _slots.GetAvailableSlotsAsync(branchId, date, type);
        return Ok(result);
    }

    /// <summary>Active hero banner slides for the homepage carousel.</summary>
    [HttpGet("hero-slides")]
    [ProducesResponseType(typeof(IReadOnlyList<HeroSlideDto>), 200)]
    public async Task<IActionResult> GetHeroSlides()
        => Ok(await _heroSlides.GetActiveAsync());

    /// <summary>Active gallery images for the gallery page.</summary>
    [HttpGet("gallery")]
    [ProducesResponseType(typeof(IReadOnlyList<GalleryImageDto>), 200)]
    public async Task<IActionResult> GetGallery()
        => Ok(await _gallery.GetActiveAsync());

    /// <summary>All About page content (settings, stats, MVV, timeline, team) for a branch.</summary>
    [HttpGet("about")]
    [ProducesResponseType(typeof(AboutPageDto), 200)]
    public async Task<IActionResult> GetAboutPage([FromQuery] long branchId)
    {
        if (branchId <= 0) return BadRequest("branchId is required.");
        return Ok(await _about.GetPublicPageAsync(branchId));
    }

    /// <summary>Active Why Choose Us items for homepage.</summary>
    [HttpGet("why-choose-us")]
    [ProducesResponseType(typeof(IReadOnlyList<WhyChooseUsItemDto>), 200)]
    public async Task<IActionResult> GetWhyChooseUs()
        => Ok(await _whyChooseUs.GetActiveAsync());

    /// <summary>Our Story section content and images for the homepage.</summary>
    [HttpGet("home-story")]
    [ProducesResponseType(typeof(HomeStorySectionDto), 200)]
    public async Task<IActionResult> GetHomeStory()
        => Ok(await _homeStory.GetAsync());
}
