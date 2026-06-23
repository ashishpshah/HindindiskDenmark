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

public record AdminCustomerOrderItemDto(string Name, int Quantity, decimal PriceAtPurchase);

public record AdminCustomerOrderDto(
    long     Id,
    string   BranchName,
    string   OrderType,
    decimal  Total,
    string   Status,
    DateTime CreatedAt,
    int      ItemCount,
    IReadOnlyList<AdminCustomerOrderItemDto> Items
);

public record AdminCustomerReservationDto(
    long     Id,
    string   BranchName,
    string   Date,
    string   TimeSlot,
    int      GuestCount,
    string   Status,
    DateTime CreatedAt,
    string?  SpecialRequests
);

public record AdminCustomerDetailDto(
    AdminCustomerDto                           Customer,
    IReadOnlyList<AdminCustomerOrderDto>       Orders,
    IReadOnlyList<AdminCustomerReservationDto> Reservations
);
