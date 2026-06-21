namespace HindIndisk.Api.Application.DTOs.Admin;

public record AdminCustomerDto(
    long     Id,
    string   Name,
    string   Email,
    string   Phone,
    DateTime CreatedAt,
    int      OrderCount,
    int      ReservationCount,
    decimal  TotalSpend
);

public record AdminCustomerOrderDto(
    long     Id,
    string   BranchName,
    string   OrderType,
    decimal  Total,
    string   Status,
    DateTime CreatedAt,
    int      ItemCount
);

public record AdminCustomerDetailDto(
    AdminCustomerDto              Customer,
    IReadOnlyList<AdminCustomerOrderDto> Orders
);
