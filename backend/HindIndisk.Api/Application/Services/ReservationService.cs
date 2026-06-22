using HindIndisk.Api.Application.DTOs.Reservation;
using HindIndisk.Api.Domain.Entities;
using HindIndisk.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace HindIndisk.Api.Application.Services;

public class ReservationService : IReservationService
{
    private readonly ApplicationDbContext _db;
    private readonly IEmailService _email;
    private readonly ICustomerService _customers;

    public ReservationService(ApplicationDbContext db, IEmailService email, ICustomerService customers)
    {
        _db        = db;
        _email     = email;
        _customers = customers;
    }

    public async Task<ReservationDto> CreateAsync(CreateReservationRequest request)
    {
        // Resolve (or create) the customer
        var customer = await _customers.FindOrCreateAsync(
            request.Firstname, request.Lastname, request.Phone, request.Email);

        if (!DateTime.TryParse(request.Date, out var date))
            throw new InvalidOperationException($"Invalid date format: '{request.Date}'. Expected yyyy-MM-dd.");

        if (date.Date < DateTime.UtcNow.Date)
            throw new InvalidOperationException("Reservation date cannot be in the past.");

        var reservation = new Reservation
        {
            UserId         = customer.Id,
            BranchId       = request.BranchId,
            Date           = date,
            TimeSlot       = request.TimeSlot,
            GuestCount     = request.GuestCount,
            ContactName    = $"{request.Firstname.Trim()} {request.Lastname.Trim()}",
            ContactPhone   = request.Phone.Trim(),
            ContactEmail   = string.IsNullOrWhiteSpace(request.Email) ? string.Empty : request.Email.Trim(),
            SpecialRequests = request.SpecialRequests,
            Status         = "Confirmed",
            CreatedAt      = DateTime.UtcNow,
        };

        _db.Reservations.Add(reservation);
        await _db.SaveChangesAsync();

        var branchName = await _db.Branches
            .Where(b => b.Id == request.BranchId)
            .AsNoTracking()
            .Select(b => b.Name)
            .FirstOrDefaultAsync() ?? "";

        var dto = ToDto(reservation, branchName);

        if (!string.IsNullOrWhiteSpace(reservation.ContactEmail))
            _ = _email.SendReservationConfirmationAsync(reservation.ContactEmail, dto);

        return dto;
    }

    public async Task<IReadOnlyList<ReservationDto>> GetMyAsync(long userId)
    {
        var list = await _db.Reservations
            .Where(r => r.UserId == userId)
            .Include(r => r.Branch)
            .OrderByDescending(r => r.Date)
            .AsNoTracking()
            .ToListAsync();

        return list.Select(r => ToDto(r, r.Branch.Name)).ToList();
    }

    private static ReservationDto ToDto(Reservation r, string branchName) =>
        new(r.Id, branchName,
            r.Date.ToString("yyyy-MM-dd"),
            r.TimeSlot,
            r.GuestCount,
            r.ContactName,
            r.ContactPhone,
            r.ContactEmail,
            r.SpecialRequests,
            r.Status,
            r.CreatedAt);
}
