using HindIndisk.Api.Application.DTOs.Reviews;
using HindIndisk.Api.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace HindIndisk.Api.Controllers;

[ApiController]
[Route("api/reviews")]
public class ReviewsController : ControllerBase
{
    private readonly IGoogleReviewsService _reviews;

    public ReviewsController(IGoogleReviewsService reviews) => _reviews = reviews;

    // GET /api/reviews
    [HttpGet]
    public async Task<ActionResult<PlaceReviewsDto>> Get()
        => Ok(await _reviews.GetReviewsAsync());
}
