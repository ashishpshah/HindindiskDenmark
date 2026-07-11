namespace HindIndisk.Api.Application.DTOs.Admin;

public record AdminTrendDto(
    int     YesterdayOrders,
    decimal YesterdayRevenue,
    int     YesterdayReservations
);
