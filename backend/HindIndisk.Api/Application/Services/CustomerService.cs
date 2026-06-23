using HindIndisk.Api.Application.DTOs.Customer;
using HindIndisk.Api.Domain.Entities;
using HindIndisk.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace HindIndisk.Api.Application.Services;

public class CustomerService : ICustomerService
{
    private readonly ApplicationDbContext _db;

    public CustomerService(ApplicationDbContext db) => _db = db;

    public async Task<User> FindOrCreateAsync(
        string firstname, string lastname, string phone, string? email)
    {
        var normalized = NormalizePhone(phone);

        // 1. Look up by phone (raw and normalized to cover formatting differences)
        var user = await _db.Users
            .Include(u => u.UserAddresses)
            .FirstOrDefaultAsync(u => u.Phone == phone || u.Phone == normalized);

        if (user is not null)
        {
            bool dirty = false;
            if (string.IsNullOrWhiteSpace(user.Firstname) && !string.IsNullOrWhiteSpace(firstname))
            { user.Firstname = firstname.Trim(); dirty = true; }
            if (string.IsNullOrWhiteSpace(user.Lastname) && !string.IsNullOrWhiteSpace(lastname))
            { user.Lastname = lastname.Trim(); dirty = true; }
            // Fill in email only if the user has none yet
            if (string.IsNullOrWhiteSpace(user.Email) && !string.IsNullOrWhiteSpace(email))
            { user.Email = email.Trim(); dirty = true; }
            if (dirty) await _db.SaveChangesAsync();
            return user;
        }

        // 2. Fall back to email lookup (handles re-registration with same email)
        if (!string.IsNullOrWhiteSpace(email))
        {
            var byEmail = await _db.Users.FirstOrDefaultAsync(u => u.Email == email.Trim());
            if (byEmail is not null)
            {
                if (string.IsNullOrWhiteSpace(byEmail.Phone))
                { byEmail.Phone = normalized; await _db.SaveChangesAsync(); }
                return byEmail;
            }
        }

        // 3. Create new guest customer — Email is null when none was provided
        var newUser = new User
        {
            Firstname    = firstname.Trim(),
            Lastname     = lastname.Trim(),
            Email        = string.IsNullOrWhiteSpace(email) ? null : email.Trim(),
            Phone        = normalized,
            PasswordHash = $"GUEST_{Guid.NewGuid():N}", // not a valid BCrypt hash — login impossible
            RoleId       = 3,
            CreatedAt    = DateTime.UtcNow,
        };
        _db.Users.Add(newUser);
        await _db.SaveChangesAsync();
        return newUser;
    }

    public async Task<CustomerLookupDto?> LookupByPhoneAsync(string phone)
    {
        var normalized = NormalizePhone(phone);

        var user = await _db.Users
            .Include(u => u.UserAddresses)
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Phone == phone || u.Phone == normalized);

        if (user is null) return null;

        var addresses = user.UserAddresses
            .Select(a => new CustomerAddressDto(
                a.Id, a.Type, a.AddressLine1, a.AddressLine2,
                a.City, a.PostalCode, a.Country))
            .ToList();

        return new CustomerLookupDto(
            user.Id, user.Firstname, user.Lastname, user.Email, user.Phone, addresses);
    }

    public async Task<CustomerLookupDto?> LookupByEmailAsync(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return null;

        var user = await _db.Users
            .Include(u => u.UserAddresses)
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == email.Trim());

        if (user is null) return null;

        var addresses = user.UserAddresses
            .Select(a => new CustomerAddressDto(
                a.Id, a.Type, a.AddressLine1, a.AddressLine2,
                a.City, a.PostalCode, a.Country))
            .ToList();

        return new CustomerLookupDto(
            user.Id, user.Firstname, user.Lastname, user.Email, user.Phone, addresses);
    }

    private static string NormalizePhone(string phone) =>
        new string(phone.Where(char.IsDigit).ToArray());
}
