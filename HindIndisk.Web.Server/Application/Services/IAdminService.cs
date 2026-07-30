using HindIndisk.Api.Application.DTOs.Admin;

namespace HindIndisk.Api.Application.Services;

public interface IAdminService
{
    // ── Dashboard ─────────────────────────────────────────────────────────────
    Task<AdminDashboardDto>            GetDashboardAsync();
    Task<AdminTrendDto>                GetTrendsAsync();
    Task<IReadOnlyList<RevenuePointDto>> GetRevenueHistoryAsync(int days);
    Task<IReadOnlyList<TopItemDto>>    GetTopItemsAsync(int days);
    Task<IReadOnlyList<BranchOverviewDto>> GetBranchOverviewAsync();
    Task<IReadOnlyList<HourlyVolumeDto>>  GetHourlyVolumeAsync(string? date);

    // ── Orders ────────────────────────────────────────────────────────────────
    Task<OrderPageDto> GetOrdersAsync(int page, int pageSize, string? status = null, long? branchId = null, string? search = null, string? dateFrom = null, string? dateTo = null);
    Task<AdminOrderDto>                UpdateOrderStatusAsync(long orderId, string status, string? cancellationReason = null);
    Task<IReadOnlyList<StatusCountDto>> GetOrderCountsByStatusAsync();
    Task                                ResendOrderStatusEmailAsync(long orderId);

    // ── Reservations ──────────────────────────────────────────────────────────
    Task<IReadOnlyList<AdminReservationDto>> GetReservationsAsync(string? status, long? branchId, string? date, string? search = null, string? dateFrom = null, string? dateTo = null);
    Task<AdminReservationDto>          UpdateReservationStatusAsync(long reservationId, string status, string? cancellationReason = null);
    Task                                ResendReservationStatusEmailAsync(long reservationId);

    // ── Menus (categories) ───────────────────────────────────────────────────
    Task<MenuPageDto> GetMenusAsync(int? page = null, int? pageSize = null, string? search = null, long? branchId = null);
    Task<AdminMenuDto>               CreateMenuAsync(CreateMenuRequest request);
    Task<AdminMenuDto>               UpdateMenuAsync(long menuId, UpdateMenuRequest request);
    Task<AdminMenuDto>               ToggleMenuAsync(long menuId);
    Task                             DeleteMenuAsync(long menuId);
    Task<AdminMenuDto>               AddItemToMenuAsync(long menuId, long itemId);
    Task<AdminMenuDto>               RemoveItemFromMenuAsync(long menuId, long itemId);
    Task<AdminMenuDto>               ReorderMenuItemsAsync(long menuId, ReorderMenuItemsRequest request);

    // ── Menu items ────────────────────────────────────────────────────────────
    Task<MenuItemPageDto> GetMenuItemsAsync(int? page = null, int? pageSize = null, string? search = null, long? branchId = null);
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

    // ── Order Statuses ────────────────────────────────────────────────────────
    Task<IReadOnlyList<OrderStatusDto>> GetOrderStatusesAsync();
    Task<OrderStatusDto>               CreateOrderStatusAsync(CreateOrderStatusRequest request);
    Task<OrderStatusDto>               UpdateOrderStatusMetaAsync(long id, UpdateOrderStatusMetaRequest request);
    Task                               DeleteOrderStatusAsync(long id);

    // ── Order Status Transitions ──────────────────────────────────────────────
    Task<IReadOnlyList<OrderStatusTransitionDto>> GetOrderStatusTransitionsAsync();
    Task<OrderStatusTransitionDto>               CreateOrderStatusTransitionAsync(CreateOrderStatusTransitionRequest request);
    Task                                         DeleteOrderStatusTransitionAsync(long id);

    // ── Customers ─────────────────────────────────────────────────────────────
    Task<CustomerPageDto>    GetCustomersAsync(int page, int pageSize, string? q = null);
    Task<AdminCustomerDetailDto> GetCustomerDetailAsync(long customerId);
}
