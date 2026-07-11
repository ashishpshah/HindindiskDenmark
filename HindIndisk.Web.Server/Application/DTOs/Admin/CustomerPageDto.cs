namespace HindIndisk.Api.Application.DTOs.Admin;

public record CustomerPageDto(
    IReadOnlyList<AdminCustomerDto> Items,
    int Total
);
