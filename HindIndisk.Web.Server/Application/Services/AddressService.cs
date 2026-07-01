using HindIndisk.Api.Application.DTOs.Addresses;
using HindIndisk.Api.Domain.Entities;
using HindIndisk.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace HindIndisk.Api.Application.Services;

public class AddressService : IAddressService
{
    private readonly ApplicationDbContext _db;

    public AddressService(ApplicationDbContext db) => _db = db;

    public async Task<IReadOnlyList<AddressDto>> GetAddressesAsync(long userId)
    {
        return await _db.UserAddresses
            .Where(a => a.UserId == userId)
            .OrderBy(a => a.Type)
            .Select(a => ToDto(a))
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<AddressDto> AddAddressAsync(long userId, SaveAddressRequest request)
    {
        var address = new UserAddress
        {
            UserId       = userId,
            AddressLine1 = request.AddressLine1,
            AddressLine2 = request.AddressLine2,
            City         = request.City,
            PostalCode   = request.PostalCode,
            Country      = request.Country,
            Type         = request.Type,
        };

        _db.UserAddresses.Add(address);
        await _db.SaveChangesAsync();
        return ToDto(address);
    }

    public async Task<AddressDto> UpdateAddressAsync(long userId, long addressId, SaveAddressRequest request)
    {
        var address = await _db.UserAddresses
            .FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId)
            ?? throw new KeyNotFoundException("Address not found.");

        address.AddressLine1 = request.AddressLine1;
        address.AddressLine2 = request.AddressLine2;
        address.City         = request.City;
        address.PostalCode   = request.PostalCode;
        address.Country      = request.Country;
        address.Type         = request.Type;

        await _db.SaveChangesAsync();
        return ToDto(address);
    }

    public async Task DeleteAddressAsync(long userId, long addressId)
    {
        var address = await _db.UserAddresses
            .FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId)
            ?? throw new KeyNotFoundException("Address not found.");

        _db.UserAddresses.Remove(address);
        await _db.SaveChangesAsync();
    }

    private static AddressDto ToDto(UserAddress a) =>
        new(a.Id, a.AddressLine1, a.AddressLine2, a.City, a.PostalCode, a.Country, a.Type);
}
