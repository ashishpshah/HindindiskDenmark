namespace HindIndisk.Api.Application.DTOs.Customer;

public record CustomerAddressDto(
    long   Id,
    string Type,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string PostalCode,
    string Country);

public record CustomerLookupDto(
    long   Id,
    string Firstname,
    string Lastname,
    string? Email,
    string Phone,
    IReadOnlyList<CustomerAddressDto> Addresses);
