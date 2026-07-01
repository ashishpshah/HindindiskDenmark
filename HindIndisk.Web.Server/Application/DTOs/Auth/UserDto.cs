namespace HindIndisk.Api.Application.DTOs.Auth;

public record UserDto(
    long    Id,
    string  Firstname,
    string  Lastname,
    string? Email,
    string? Phone,
    string  Role
);
