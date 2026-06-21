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

    private long UserId =>
        long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequest request)
    {
        try
        {
            var order = await _orders.CreateOrderAsync(UserId, request);
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
        var orders = await _orders.GetMyOrdersAsync(UserId);
        return Ok(orders);
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        try
        {
            var order = await _orders.GetOrderByIdAsync(id, UserId);
            return Ok(order);
        }
        catch (InvalidOperationException)
        {
            return NotFound(new { message = "Order not found." });
        }
    }
}
