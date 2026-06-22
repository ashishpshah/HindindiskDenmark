namespace HindIndisk.Api.Application.DTOs.Admin;

public record AdminBranchDto(
    long   Id,
    string Name,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string PostalCode,
    string Country,
    string Phone,
    string Email,
    string GoogleMapsLink,
    string WeekdayOpen,
    string WeekdayClose,
    string WeekendOpen,
    string WeekendClose
);
