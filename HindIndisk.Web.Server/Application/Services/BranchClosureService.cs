using HindIndisk.Api.Application.DTOs.Closure;
using HindIndisk.Api.Domain.Entities;
using HindIndisk.Api.Hubs;
using HindIndisk.Api.Infrastructure;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace HindIndisk.Api.Application.Services;

/// <summary>
/// Scheduled/recurring branch closures: future date ranges (Restaurant / Pickup /
/// Delivery) and per-service weekly-off days. Also exposes <see cref="IsClosedAsync"/>,
/// the shared enforcement helper used by SlotService, OrderService and ReservationService.
/// </summary>
public class BranchClosureService(ApplicationDbContext db, IHubContext<ClosureHub> hub)
{
    private static readonly string[] ValidScopes = ["Restaurant", "Reservation", "Pickup", "Delivery"];

    public async Task<IReadOnlyList<BranchClosureDto>> GetAsync(long branchId)
    {
        var rows = await db.BranchClosures
            .AsNoTracking()
            .Where(c => c.BranchId == branchId)
            .OrderBy(c => c.ClosureType)
            .ThenBy(c => c.StartDate)
            .ThenBy(c => c.DayOfWeek)
            .ToListAsync();

        return rows.Select(ToDto).ToList();
    }

    public async Task<BranchClosureDto> CreateAsync(
        long branchId, CreateBranchClosureRequest request, string? adminEmail)
    {
        var branchExists = await db.Branches.AnyAsync(b => b.Id == branchId);
        if (!branchExists)
            throw new KeyNotFoundException($"Branch {branchId} not found.");

        var scope = request.Scope?.Trim() ?? "";
        if (!ValidScopes.Contains(scope))
            throw new InvalidOperationException("Scope must be Restaurant, Pickup or Delivery.");

        var closure = new BranchClosure
        {
            BranchId  = branchId,
            Scope     = scope,
            Note      = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
            CreatedAt = DenmarkTime.Now,
            CreatedBy = adminEmail,
        };

        if (request.ClosureType == "Weekly")
        {
            if (request.DayOfWeek is null or < 0 or > 6)
                throw new InvalidOperationException("A weekly closure requires a day of week (0–6).");

            closure.ClosureType = "Weekly";
            closure.DayOfWeek   = (DayOfWeek)request.DayOfWeek.Value;
        }
        else if (request.ClosureType == "DateRange")
        {
            if (!DateOnly.TryParseExact(request.StartDate, "yyyy-MM-dd", out var start) ||
                !DateOnly.TryParseExact(request.EndDate,   "yyyy-MM-dd", out var end))
                throw new InvalidOperationException("A date-range closure requires a valid start and end date (yyyy-MM-dd).");

            if (end < start)
                throw new InvalidOperationException("End date cannot be before start date.");

            if (end < DenmarkTime.Today)
                throw new InvalidOperationException("The closure has already ended — pick a date today or later.");

            closure.ClosureType = "DateRange";
            closure.StartDate   = start;
            closure.EndDate     = end;

            // Optional time window — both or neither
            var hasStart = !string.IsNullOrWhiteSpace(request.StartTime);
            var hasEnd   = !string.IsNullOrWhiteSpace(request.EndTime);
            if (hasStart != hasEnd)
                throw new InvalidOperationException("Provide both StartTime and EndTime, or neither.");
            if (hasStart)
            {
                if (!TimeOnly.TryParseExact(request.StartTime, "HH:mm", out var tStart) ||
                    !TimeOnly.TryParseExact(request.EndTime,   "HH:mm", out var tEnd))
                    throw new InvalidOperationException("StartTime / EndTime must be in HH:mm format.");
                if (tEnd <= tStart)
                    throw new InvalidOperationException("EndTime must be after StartTime.");
                closure.StartTime = tStart;
                closure.EndTime   = tEnd;
            }
        }
        else
        {
            throw new InvalidOperationException("ClosureType must be DateRange or Weekly.");
        }

        db.BranchClosures.Add(closure);
        await db.SaveChangesAsync();

        await hub.Clients.Group($"branch-{branchId}").SendAsync("ClosuresChanged", branchId);

        return ToDto(closure);
    }

    public async Task DeleteAsync(long branchId, long closureId)
    {
        var closure = await db.BranchClosures
            .FirstOrDefaultAsync(c => c.Id == closureId && c.BranchId == branchId)
            ?? throw new KeyNotFoundException($"Closure {closureId} not found.");

        db.BranchClosures.Remove(closure);
        await db.SaveChangesAsync();

        await hub.Clients.Group($"branch-{branchId}").SendAsync("ClosuresChanged", branchId);
    }

    /// <summary>
    /// Returns the all-day closure that blocks the given service on the given date, or null.
    /// Time-scoped closures (with StartTime set) are NOT returned here; they filter individual
    /// slots via <see cref="GetTimeRangeClosuresAsync"/> instead.
    /// </summary>
    public async Task<BranchClosure?> IsClosedAsync(long branchId, DateOnly date, string service)
    {
        var closures = await db.BranchClosures
            .AsNoTracking()
            .Where(c => c.BranchId == branchId)
            .ToListAsync();

        return closures.FirstOrDefault(c =>
            ScopeCovers(c.Scope, service) && DateMatches(c, date) && c.StartTime is null);
    }

    /// <summary>
    /// Returns all time-scoped closures (StartTime / EndTime set) that match the service on the
    /// given date. Used by <see cref="SlotService"/> to filter individual slots.
    /// </summary>
    public async Task<IReadOnlyList<BranchClosure>> GetTimeRangeClosuresAsync(
        long branchId, DateOnly date, string service)
    {
        var closures = await db.BranchClosures
            .AsNoTracking()
            .Where(c => c.BranchId == branchId)
            .ToListAsync();

        return closures.Where(c =>
            ScopeCovers(c.Scope, service) && DateMatches(c, date) && c.StartTime is not null).ToList();
    }

    private static bool ScopeCovers(string scope, string service) =>
        scope == "Restaurant" || scope == service;

    private static bool DateMatches(BranchClosure c, DateOnly date) =>
        c.ClosureType == "Weekly"
            ? c.DayOfWeek == date.DayOfWeek
            : c.StartDate is not null && c.EndDate is not null
              && date >= c.StartDate.Value && date <= c.EndDate.Value;

    private static BranchClosureDto ToDto(BranchClosure c) =>
        new(c.Id, c.BranchId, c.Scope, c.ClosureType,
            c.StartDate?.ToString("yyyy-MM-dd"),
            c.EndDate?.ToString("yyyy-MM-dd"),
            c.DayOfWeek is null ? null : (int)c.DayOfWeek.Value,
            c.StartTime?.ToString("HH:mm"),
            c.EndTime?.ToString("HH:mm"),
            c.Note, c.CreatedAt, c.CreatedBy);
}
