using HindIndisk.Api.Application.DTOs.Addresses;

namespace HindIndisk.Api.Application.Services;

public interface IAddressService
{
    Task<IReadOnlyList<AddressDto>> GetAddressesAsync(long userId);
    Task<AddressDto>                AddAddressAsync(long userId, SaveAddressRequest request);
    Task<AddressDto>                UpdateAddressAsync(long userId, long addressId, SaveAddressRequest request);
    Task                            DeleteAddressAsync(long userId, long addressId);
}
