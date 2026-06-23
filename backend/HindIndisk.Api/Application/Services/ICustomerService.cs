using HindIndisk.Api.Application.DTOs.Customer;
using HindIndisk.Api.Domain.Entities;

namespace HindIndisk.Api.Application.Services;

public interface ICustomerService
{
    /// <summary>
    /// Look up a customer by phone. If found, return them (updating blank name/email if supplied).
    /// If not found, create a new customer record with RoleId = 3.
    /// </summary>
    Task<User> FindOrCreateAsync(string firstname, string lastname, string phone, string? email);

    /// <summary>Phone-based lookup for form auto-fill. Returns null when no match.</summary>
    Task<CustomerLookupDto?> LookupByPhoneAsync(string phone);

    /// <summary>Email-based lookup for form auto-fill. Returns null when no match or auto-generated email.</summary>
    Task<CustomerLookupDto?> LookupByEmailAsync(string email);
}
