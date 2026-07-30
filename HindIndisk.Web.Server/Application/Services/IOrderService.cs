using HindIndisk.Api.Application.DTOs.Order;

namespace HindIndisk.Api.Application.Services;

public interface IOrderService
{
    Task<OrderDto> CreateOrderAsync(CreateOrderRequest request, long? loggedInUserId = null);
    Task<OrderDto> GetOrderByIdAsync(long orderId, long userId);
    Task<IReadOnlyList<OrderDto>> GetMyOrdersAsync(long userId);
}
