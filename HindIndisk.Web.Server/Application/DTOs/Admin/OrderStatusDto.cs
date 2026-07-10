namespace HindIndisk.Api.Application.DTOs.Admin;

public record OrderStatusDto(
    long Id,
    string Name,
    string? NameDa,
    string ServiceType,
    int DisplayOrder,
    string? Color,
    bool IsTerminal,
    bool IsActive,
    DateTime CreatedAt
);

public record CreateOrderStatusRequest(
    string Name,
    string? NameDa,
    string ServiceType,
    int DisplayOrder,
    string? Color
);

public record UpdateOrderStatusMetaRequest(
    string Name,
    string? NameDa,
    string ServiceType,
    int DisplayOrder,
    string? Color,
    bool IsActive
);
