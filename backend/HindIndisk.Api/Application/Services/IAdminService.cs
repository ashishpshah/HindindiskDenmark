using HindIndisk.Api.Application.DTOs.Admin;

namespace HindIndisk.Api.Application.Services;

public interface IAdminService
{
    // ── Dashboard ─────────────────────────────────────────────────────────────
    Task<AdminDashboardDto>            GetDashboardAsync();

    // ── Orders ────────────────────────────────────────────────────────────────
    Task<IReadOnlyList<AdminOrderDto>> GetOrdersAsync(string? status, long? branchId);
    Task<AdminOrderDto>                UpdateOrderStatusAsync(long orderId, string status);

    // ── Reservations ──────────────────────────────────────────────────────────
    Task<IReadOnlyList<AdminReservationDto>> GetReservationsAsync(string? status, long? branchId, string? date);
    Task<AdminReservationDto>          UpdateReservationStatusAsync(long reservationId, string status);

    // ── Menu items ────────────────────────────────────────────────────────────
    Task<IReadOnlyList<AdminMenuItemDto>> GetMenuItemsAsync();
    Task<AdminMenuItemDto>               UpdateMenuItemAsync(long itemId, UpdateMenuItemRequest request);
    Task<AdminMenuItemDto>               UpdateMenuItemPricesAsync(long itemId, UpdateMenuItemPricesRequest request);

    // ── Offers ────────────────────────────────────────────────────────────────
    Task<IReadOnlyList<AdminOfferDto>> GetOffersAsync();
    Task<AdminOfferDto>                CreateOfferAsync(CreateOfferRequest request);
    Task<AdminOfferDto>                UpdateOfferAsync(long offerId, UpdateOfferRequest request);
    Task<AdminOfferDto>                ToggleOfferAsync(long offerId);

    // ── Customers ─────────────────────────────────────────────────────────────
    Task<IReadOnlyList<AdminCustomerDto>> GetCustomersAsync(string? q);
    Task<AdminCustomerDetailDto>          GetCustomerDetailAsync(long customerId);
}
