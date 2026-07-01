using HindIndisk.Api.Application.DTOs.Customer;
using HindIndisk.Api.Domain.Entities;
using HindIndisk.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace HindIndisk.Api.Application.Services;

public class CustomerService : ICustomerService
{
    private readonly ApplicationDbContext _db;

    public CustomerService(ApplicationDbContext db) => _db = db;

    public async Task<FindOrCreateResult> FindOrCreateAsync(
        string firstname, string lastname, string? phone, string? email)
    {
        var normalized = NormalizePhone(phone ?? string.Empty);

        // 1. Look up by phone (raw and normalized to cover formatting differences)
        var user = !string.IsNullOrWhiteSpace(phone)
            ? await _db.Users
                .Include(u => u.UserAddresses)
                .FirstOrDefaultAsync(u => u.Phone == phone || u.Phone == normalized)
            : null;

        if (user is not null)
        {
            bool dirty = false;
            if (string.IsNullOrWhiteSpace(user.Firstname) && !string.IsNullOrWhiteSpace(firstname))
            { user.Firstname = firstname.Trim(); dirty = true; }
            if (string.IsNullOrWhiteSpace(user.Lastname) && !string.IsNullOrWhiteSpace(lastname))
            { user.Lastname = lastname.Trim(); dirty = true; }
            if (string.IsNullOrWhiteSpace(user.Email) && !string.IsNullOrWhiteSpace(email))
            { user.Email = email.Trim(); dirty = true; }
            if (dirty) await _db.SaveChangesAsync();
            return new FindOrCreateResult(user, false, null);
        }

        // 2. Fall back to email lookup (handles re-use of same email with different phone)
        if (!string.IsNullOrWhiteSpace(email))
        {
            var byEmail = await _db.Users.FirstOrDefaultAsync(u => u.Email == email.Trim());
            if (byEmail is not null)
            {
                if (string.IsNullOrWhiteSpace(byEmail.Phone))
                { byEmail.Phone = normalized; await _db.SaveChangesAsync(); }
                return new FindOrCreateResult(byEmail, false, null);
            }
        }

        // 3. Brand-new customer — generate a real BCrypt password so the account is usable
        var plainPassword = GeneratePassword();
        var newUser = new User
        {
            Firstname    = firstname.Trim(),
            Lastname     = lastname.Trim(),
            Email        = string.IsNullOrWhiteSpace(email) ? null : email.Trim(),
            Phone        = normalized,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(plainPassword),
            RoleId       = 3,
            CreatedAt    = DenmarkTime.Now,
        };
        _db.Users.Add(newUser);
        await _db.SaveChangesAsync();

        // Only pass the plain password back when there is an email to deliver it to
        var deliverable = string.IsNullOrWhiteSpace(email) ? null : plainPassword;
        return new FindOrCreateResult(newUser, true, deliverable);
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

    // Alphanumeric without visually ambiguous chars (0 O I l 1)
    private static string GeneratePassword(int length = 10)
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
        return new string(Enumerable.Range(0, length)
            .Select(_ => chars[Random.Shared.Next(chars.Length)])
            .ToArray());
    }

    private static string NormalizePhone(string phone) =>
        new string(phone.Where(char.IsDigit).ToArray());
}
