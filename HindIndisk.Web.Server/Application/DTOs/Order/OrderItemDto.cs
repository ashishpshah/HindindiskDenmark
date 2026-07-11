namespace HindIndisk.Api.Application.DTOs.Order;

public record OrderItemDto(
    long MenuItemId,
    int? Code,
    string Name,
    string? NameDa,
    string ImageUrl,
    int Quantity,
    decimal PriceAtPurchase
);
