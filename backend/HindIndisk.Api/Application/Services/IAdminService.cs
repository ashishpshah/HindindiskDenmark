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

    // ── Menus (categories) ───────────────────────────────────────────────────
    Task<IReadOnlyList<AdminMenuDto>> GetMenusAsync();
    Task<AdminMenuDto>               CreateMenuAsync(CreateMenuRequest request);
    Task<AdminMenuDto>               UpdateMenuAsync(long menuId, UpdateMenuRequest request);
    Task<AdminMenuDto>               ToggleMenuAsync(long menuId);
    Task                             DeleteMenuAsync(long menuId);
    Task<AdminMenuDto>               AddItemToMenuAsync(long menuId, long itemId);
    Task<AdminMenuDto>               RemoveItemFromMenuAsync(long menuId, long itemId);
    Task<AdminMenuDto>               ReorderMenuItemsAsync(long menuId, ReorderMenuItemsRequest request);

    // ── Menu items ────────────────────────────────────────────────────────────
    Task<IReadOnlyList<AdminMenuItemDto>> GetMenuItemsAsync();
    Task<AdminMenuItemDto>               CreateMenuItemAsync(CreateMenuItemRequest request);
    Task<AdminMenuItemDto>               UpdateMenuItemAsync(long itemId, UpdateMenuItemRequest request);
    Task<AdminMenuItemDto>               UpdateMenuItemPricesAsync(long itemId, UpdateMenuItemPricesRequest request);
    Task                                 DeleteMenuItemAsync(long itemId);

    // ── Offers ────────────────────────────────────────────────────────────────
    Task<IReadOnlyList<AdminOfferDto>> GetOffersAsync();
    Task<AdminOfferDto>                CreateOfferAsync(CreateOfferRequest request);
    Task<AdminOfferDto>                UpdateOfferAsync(long offerId, UpdateOfferRequest request);
    Task<AdminOfferDto>                ToggleOfferAsync(long offerId);
    Task                               DeleteOfferAsync(long offerId);

    // ── Branches ─────────────────────────────────────────────────────────────
    Task<IReadOnlyList<AdminBranchDto>> GetBranchesAsync();
    Task<AdminBranchDto>  CreateBranchAsync(CreateBranchRequest request);
    Task<AdminBranchDto>  UpdateBranchAsync(long branchId, UpdateBranchRequest request);

    // ── Customers ─────────────────────────────────────────────────────────────
    Task<IReadOnlyList<AdminCustomerDto>> GetCustomersAsync(string? q);
    Task<AdminCustomerDetailDto>          GetCustomerDetailAsync(long customerId);
}
