using HindIndisk.Api.Application.DTOs.Order;
using HindIndisk.Api.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HindIndisk.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orders;

    public OrdersController(IOrderService orders) => _orders = orders;

    private long GetUserId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!long.TryParse(raw, out var id))
            throw new UnauthorizedAccessException("Invalid token claims.");
        return id;
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequest request)
    {
        try
        {
            var order = await _orders.CreateOrderAsync(request);
            return Ok(order);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("my")]
    public async Task<IActionResult> MyOrders()
    {
        var orders = await _orders.GetMyOrdersAsync(GetUserId());
        return Ok(orders);
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        try
        {
            var order = await _orders.GetOrderByIdAsync(id, GetUserId());
            return Ok(order);
        }
        catch (InvalidOperationException)
        {
            return NotFound(new { message = "Order not found." });
        }
    }
}
