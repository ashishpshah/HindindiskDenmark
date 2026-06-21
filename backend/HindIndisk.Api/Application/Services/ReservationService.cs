using HindIndisk.Api.Application.DTOs.Reservation;
using HindIndisk.Api.Domain.Entities;
using HindIndisk.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace HindIndisk.Api.Application.Services;

public class ReservationService : IReservationService
{
    private readonly ApplicationDbContext _db;

    public ReservationService(ApplicationDbContext db) => _db = db;

    public async Task<ReservationDto> CreateAsync(long? userId, CreateReservationRequest request)
    {
        if (!DateTime.TryParse(request.Date, out var date))
            throw new InvalidOperationException($"Invalid date format: '{request.Date}'. Expected yyyy-MM-dd.");

        var reservation = new Reservation
        {
            UserId         = userId,
            BranchId       = request.BranchId,
            Date           = date,
            TimeSlot       = request.TimeSlot,
            GuestCount     = request.GuestCount,
            ContactName    = request.ContactName,
            ContactPhone   = request.ContactPhone,
            ContactEmail   = request.ContactEmail,
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

        return ToDto(reservation, branchName);
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
