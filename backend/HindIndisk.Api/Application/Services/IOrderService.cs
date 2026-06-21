using HindIndisk.Api.Application.DTOs.Order;

namespace HindIndisk.Api.Application.Services;

public interface IOrderService
{
    Task<OrderDto> CreateOrderAsync(long userId, CreateOrderRequest request);
    Task<OrderDto> GetOrderByIdAsync(long orderId, long userId);
    Task<IReadOnlyList<OrderDto>> GetMyOrdersAsync(long userId);
}
