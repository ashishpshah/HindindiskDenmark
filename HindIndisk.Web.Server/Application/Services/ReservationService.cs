using HindIndisk.Api.Application.DTOs.Reservation;
using HindIndisk.Api.Domain.Entities;
using HindIndisk.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace HindIndisk.Api.Application.Services;

public class ReservationService : IReservationService
{
    private readonly ApplicationDbContext _db;
    private readonly IEmailService _email;
    private readonly ICustomerService _customers;
    private readonly BranchClosureService _closures;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ReservationService> _logger;

    public ReservationService(ApplicationDbContext db, IEmailService email, ICustomerService customers,
        BranchClosureService closures, IServiceScopeFactory scopeFactory, ILogger<ReservationService> logger)
    {
        _db           = db;
        _email        = email;
        _customers    = customers;
        _closures     = closures;
        _scopeFactory = scopeFactory;
        _logger       = logger;
    }

    public async Task<ReservationDto> CreateAsync(CreateReservationRequest request, long? loggedInUserId = null)
    {
        long   userId = loggedInUserId ?? 0;
        bool   sendCredentials  = false;
        string? credentialsPwd  = null;
        string? credentialsEmail = null;
        string  credentialsName  = string.Empty;

        var branch = await _db.Branches.AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == request.BranchId)
            ?? throw new InvalidOperationException("Branch not found.");

        // Check if reservations are closed for this branch (from BranchServiceClosure)
        var reservationClosure = await _db.BranchServiceClosures
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.BranchId == request.BranchId
                && c.ServiceType == "Reservation" && c.ReopenedAt == null);
        if (reservationClosure != null)
            throw new InvalidOperationException("Reservations are temporarily suspended for this branch.");

        if (!DateTime.TryParse(request.Date, out var date))
            throw new InvalidOperationException($"Invalid date format: '{request.Date}'. Expected yyyy-MM-dd.");

        if (DateOnly.FromDateTime(date) < DenmarkTime.Today)
            throw new InvalidOperationException("Reservation date cannot be in the past.");

        // Scheduled/recurring closure — only whole-restaurant closures block reservations
        if (await _closures.IsClosedAsync(request.BranchId, DateOnly.FromDateTime(date), "Reservation") is not null)
            throw new InvalidOperationException("The restaurant is closed on the selected date.");

        var reservation = new Reservation
        {
            UserId          = userId,
            BranchId        = request.BranchId,
            Date            = date,
            TimeSlot        = request.TimeSlot,
            GuestCount      = request.GuestCount,
            ContactName     = $"{request.Firstname.Trim()} {request.Lastname.Trim()}",
            ContactPhone    = request.Phone?.Trim() ?? string.Empty,
            ContactEmail    = request.Email.Trim(),
            SpecialRequests = request.SpecialRequests,
            Status          = "Confirmed",
            CreatedAt       = DenmarkTime.Now,
        };

        _db.Reservations.Add(reservation);
        await _db.SaveChangesAsync();

        var branchName = await _db.Branches
            .Where(b => b.Id == request.BranchId)
            .AsNoTracking()
            .Select(b => b.Name)
            .FirstOrDefaultAsync() ?? "";

        var dto = ToDto(reservation, branchName);

        // Emails are dispatched on a background task with their own DI scope so the HTTP
        // response isn't blocked on SMTP round-trips. Can't reuse this request's _email/_db —
        // their scope is disposed as soon as this method returns.
        var reservationId = reservation.Id;
        _ = Task.Run(async () =>
        {
            using var scope = _scopeFactory.CreateScope();
            var email = scope.ServiceProvider.GetRequiredService<IEmailService>();
            try
            {
                // Case 3 only: new guest account — credentials before reservation confirmation
                if (sendCredentials)
                    await email.SendNewCustomerCredentialsAsync(credentialsEmail!, credentialsName, credentialsPwd!);

                await email.SendReservationConfirmationAsync(reservation.ContactEmail, dto);
                await email.SendAdminReservationNotificationAsync(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background email dispatch failed for reservation #{ReservationId}", reservationId);
            }
        });

        return dto;
    }

    public async Task<IReadOnlyList<ReservationDto>> GetMyAsync(long userId)
    {
            var userEmail = await _db.Users.AsNoTracking()
                .Where(u => u.Id == userId)
                .Select(u => u.Email)
                .FirstOrDefaultAsync();

        var list = await _db.Reservations
            .Where(r => r.UserId == userId || r.ContactEmail == userEmail)
            .Include(r => r.Branch)
            .Include(r => r.User)
            .OrderByDescending(r => r.Date)
            .AsNoTracking()
            .ToListAsync();

        return list.Select(r => ToDto(r, r.Branch.Name)).ToList();
    }

    public async Task<IReadOnlyList<ReservationDto>> CheckDuplicateAsync(
        string phone, string? email, string date, string timeSlot)
    {
        if (!DateTime.TryParse(date, out var parsedDate))
            return Array.Empty<ReservationDto>();

        var normalizedPhone = new string(phone.Where(char.IsDigit).ToArray());
        var emailLower      = email?.Trim().ToLowerInvariant() ?? "";

        var dateStart = parsedDate.Date;
        var dateEnd   = dateStart.AddDays(1);

        var matches = await _db.Reservations
            .Include(r => r.Branch)
            .Where(r =>
                r.Date >= dateStart &&
                r.Date <  dateEnd   &&
                r.TimeSlot == timeSlot &&
                r.Status   != "Cancelled" &&
                (r.ContactPhone == phone.Trim() ||
                 r.ContactPhone == normalizedPhone ||
                 (!string.IsNullOrWhiteSpace(emailLower) &&
                  r.ContactEmail.ToLower() == emailLower)))
            .AsNoTracking()
            .ToListAsync();

        return matches.Select(r => ToDto(r, r.Branch.Name)).ToList();
    }

    private static ReservationDto ToDto(Reservation r, string branchName)
    {
        var ownerName = r.User is null ? null : $"{r.User.Firstname} {r.User.Lastname}".Trim();

        return new(r.Id, branchName,
            r.Date.ToString("yyyy-MM-dd"),
            r.TimeSlot,
            r.GuestCount,
            r.ContactName,
            r.ContactPhone,
            r.ContactEmail,
            r.SpecialRequests,
            r.Status,
            r.CreatedAt,
            r.CancellationReason,
            r.UserId ?? 0,
            ownerName,
            r.BranchId);
    }
}
