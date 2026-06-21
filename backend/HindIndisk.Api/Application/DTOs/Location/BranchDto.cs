namespace HindIndisk.Api.Application.DTOs.Location;

public record BranchDto(
    long   Id,
    string Name,
    string Address,
    string City,
    string PostalCode,
    string Phone,
    string Email,
    string GoogleMapsLink,
    string WeekdayHours,
    string WeekendHours
);
