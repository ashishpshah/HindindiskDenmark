namespace HindIndisk.Api.Application.DTOs.Admin;

public record OrderStatusTransitionDto(
    long Id,
    long FromStatusId,
    long ToStatusId,
    string ServiceType,
    string FromStatusName,
    string ToStatusName
);

public record CreateOrderStatusTransitionRequest(
    long FromStatusId,
    long ToStatusId,
    string ServiceType
);
