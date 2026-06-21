namespace HindIndisk.Api.Application.DTOs.Admin;

public record AdminDashboardDto(
    int     TodayOrders,
    decimal TodayRevenue,
    int     PendingOrders,
    int     TodayReservations,
    int     TotalOrders
);
