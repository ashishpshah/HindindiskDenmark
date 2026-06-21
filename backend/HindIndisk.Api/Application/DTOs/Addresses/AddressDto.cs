namespace HindIndisk.Api.Application.DTOs.Addresses;

public record AddressDto(
    long    Id,
    string  AddressLine1,
    string? AddressLine2,
    string  City,
    string  PostalCode,
    string  Country,
    string  Type
);
