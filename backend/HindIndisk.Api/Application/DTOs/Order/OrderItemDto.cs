namespace HindIndisk.Api.Application.DTOs.Order;

public record OrderItemDto(
    long MenuItemId,
    string Name,
    string ImageUrl,
    int Quantity,
    decimal PriceAtPurchase
);
