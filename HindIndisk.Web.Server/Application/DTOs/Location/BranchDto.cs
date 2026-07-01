namespace HindIndisk.Api.Application.DTOs.Location;

public record BranchDto(
    long    Id,
    string  Name,
    string  Address,
    string? AddressLine2,
    string  City,
    string  PostalCode,
    string  Phone,
    string  Email,
    string  GoogleMapsLink,
    string  WeekdayHours,
    string  WeekendHours,
    string  WeekdayOpen,
    string  WeekdayClose,
    string  WeekendOpen,
    string  WeekendClose,
    string  ImageUrl,
    decimal Rating,
    int     ReviewCount,
    bool    DeliveryEnabled,
    bool    PickupEnabled,
    decimal DeliveryFee,
    bool    DeliveryFeeEnabled,
    bool    IsCloseOrder,
    bool    IsCloseReservation,
    int     MaxAdvanceDays
);
