namespace HindIndisk.Api.Application.DTOs.Admin;

public record OrderPageDto(
    IReadOnlyList<AdminOrderDto> Items,
    int Total
);
