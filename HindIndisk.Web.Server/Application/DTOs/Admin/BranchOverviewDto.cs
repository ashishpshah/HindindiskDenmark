namespace HindIndisk.Api.Application.DTOs.Admin;

public record BranchOverviewDto(string BranchName, int TodayOrders, decimal TodayRevenue);
