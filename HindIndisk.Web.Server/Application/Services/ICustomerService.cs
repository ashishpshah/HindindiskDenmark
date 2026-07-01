using HindIndisk.Api.Application.DTOs.Customer;
using HindIndisk.Api.Domain.Entities;

namespace HindIndisk.Api.Application.Services;

/// <summary>
/// Returned by FindOrCreateAsync.
/// IsNew is true only when a brand-new user record was inserted.
/// PlainPassword is the generated plaintext password — non-null only when IsNew == true AND an email was available.
/// </summary>
public record FindOrCreateResult(User User, bool IsNew, string? PlainPassword);

public interface ICustomerService
{
    /// <summary>
    /// Look up a customer by phone (then email). If found, return them (patching blank fields).
    /// If not found, create a new customer with a generated password and return IsNew=true.
    /// </summary>
    Task<FindOrCreateResult> FindOrCreateAsync(string firstname, string lastname, string? phone, string? email);

    /// <summary>Phone-based lookup for form auto-fill. Returns null when no match.</summary>
    Task<CustomerLookupDto?> LookupByPhoneAsync(string phone);

    /// <summary>Email-based lookup for form auto-fill. Returns null when no match.</summary>
    Task<CustomerLookupDto?> LookupByEmailAsync(string email);
}
