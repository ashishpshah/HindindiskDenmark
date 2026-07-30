using HindIndisk.Api.Application.DTOs.Admin;
using HindIndisk.Api.Domain.Entities;
using HindIndisk.Api.Hubs;
using HindIndisk.Api.Infrastructure;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace HindIndisk.Api.Application.Services;

public class BranchServiceStatusService(ApplicationDbContext db, IHubContext<ClosureHub> hub)
{
    /// <summary>
    /// Toggle a service for a branch and record history.
    /// "Order" also flips the branch flag.
    /// "Reservation", "Delivery" and "Pickup" only write history (the BranchClosure record is managed separately).
    /// </summary>
    public async Task<BranchServiceClosureDto> ToggleAsync(
        long branchId, string serviceType, bool isClosed, string adminEmail, string? note = null, string? noteDa = null)
    {
        var branch = await db.Branches.FindAsync(branchId)
            ?? throw new KeyNotFoundException($"Branch {branchId} not found.");

        if (serviceType == "Order")
        {
            branch.IsCloseOrder   = isClosed;
            branch.CloseOrderNote = isClosed ? (string.IsNullOrWhiteSpace(note) ? null : note.Trim()) : null;
            branch.CloseOrderNoteDa = isClosed ? (string.IsNullOrWhiteSpace(noteDa) ? null : noteDa.Trim()) : null;
        }
        // "Reservation", "Delivery" and "Pickup" — history only, no branch flag

        BranchServiceClosure history;

        if (isClosed)
        {
            // Opening a new closure row
            history = new BranchServiceClosure
            {
                BranchId    = branchId,
                ServiceType = serviceType,
                ClosedAt    = DenmarkTime.Now,
                ClosedBy    = adminEmail,
                Note        = string.IsNullOrWhiteSpace(note) ? null : note.Trim(),
                NoteDa      = string.IsNullOrWhiteSpace(noteDa) ? null : noteDa.Trim(),
            };
            db.BranchServiceClosures.Add(history);
        }
        else
        {
            // Reopening — stamp ALL open rows for this branch+type (not just the latest)
            var openRows = await db.BranchServiceClosures
                .Where(c => c.BranchId == branchId
                         && c.ServiceType == serviceType
                         && c.ReopenedAt == null)
                .OrderByDescending(c => c.ClosedAt)
                .ToListAsync();

            var reopenTime = DenmarkTime.Now;

            if (openRows.Count > 0)
            {
                foreach (var row in openRows)
                    row.ReopenedAt = reopenTime;
                history = openRows[0];
            }
            else
            {
                // No open row exists — create a zero-duration record so history is consistent
                history = new BranchServiceClosure
                {
                    BranchId    = branchId,
                    ServiceType = serviceType,
                    ClosedAt    = reopenTime,
                    ClosedBy    = adminEmail,
                    ReopenedAt  = reopenTime,
                };
                db.BranchServiceClosures.Add(history);
            }
        }

        await db.SaveChangesAsync();

        await hub.Clients.Group($"branch-{branchId}").SendAsync("ServiceStatusChanged", branchId);

        return new BranchServiceClosureDto(
            history.Id, branch.Id, branch.Name,
            history.ServiceType, history.ClosedAt,
            history.ReopenedAt, history.ClosedBy, history.Note, history.NoteDa);
    }

    /// <summary>Paginated history with optional filters.</summary>
    public async Task<IReadOnlyList<BranchServiceClosureDto>> GetHistoryAsync(
        long? branchId, string? serviceType, DateOnly? from, DateOnly? to)
    {
        var query = db.BranchServiceClosures
            .Include(c => c.Branch)
            .AsNoTracking()
            .AsQueryable();

        if (branchId.HasValue)
            query = query.Where(c => c.BranchId == branchId.Value);

        if (!string.IsNullOrWhiteSpace(serviceType))
            query = query.Where(c => c.ServiceType == serviceType);

        if (from.HasValue)
            query = query.Where(c => c.ClosedAt >= from.Value.ToDateTime(TimeOnly.MinValue));

        if (to.HasValue)
            query = query.Where(c => c.ClosedAt < to.Value.AddDays(1).ToDateTime(TimeOnly.MinValue));

        var rows = await query.OrderByDescending(c => c.ClosedAt).ToListAsync();

        return rows.Select(c => new BranchServiceClosureDto(
            c.Id, c.BranchId, c.Branch.Name,
            c.ServiceType, c.ClosedAt, c.ReopenedAt, c.ClosedBy, c.Note, c.NoteDa)).ToList();
    }

    /// <summary>Current open/close status for all branches.</summary>
    public async Task<IReadOnlyList<AdminBranchDto>> GetAllStatusAsync()
    {
        var today = DenmarkTime.Today;

        var branches = await db.Branches
            .Include(b => b.Closures)
            .Include(b => b.ServiceClosures)
            .OrderBy(b => b.Name)
            .ToListAsync();

        return branches.Select(b =>
        {
            // Active all-day closures for Delivery / Pickup (today only)
            var deliveryClosure = b.Closures.FirstOrDefault(c =>
                c.ClosureType == "DateRange" && c.Scope == "Delivery" && c.StartTime == null
                && (c.StartDate ?? today) <= today && (c.EndDate ?? c.StartDate ?? today) >= today);
            var pickupClosure = b.Closures.FirstOrDefault(c =>
                c.ClosureType == "DateRange" && c.Scope == "Pickup" && c.StartTime == null
                && (c.StartDate ?? today) <= today && (c.EndDate ?? c.StartDate ?? today) >= today);

            // Active reservation closure (no reopen time)
            var reservationClosure = b.ServiceClosures.FirstOrDefault(c =>
                c.ServiceType == "Reservation" && c.ReopenedAt == null);

            return new AdminBranchDto(
                b.Id, b.Name, b.NameDa, b.AddressLine1, b.AddressLine1Da, b.AddressLine2, b.AddressLine2Da,
                b.City, b.CityDa, b.PostalCode, b.Country, b.CountryDa,
                b.Phone, b.Email, b.GoogleMapsLink, b.ImageUrl, b.Rating, b.ReviewCount,
                b.DeliveryFee, b.DeliveryFeeEnabled,
                b.IsCloseOrder, b.CloseOrderNote, b.CloseOrderNoteDa,
                reservationClosure != null, reservationClosure?.Note, reservationClosure?.NoteDa,
                deliveryClosure != null, deliveryClosure?.Note, deliveryClosure?.NoteDa,
                pickupClosure != null, pickupClosure?.Note, pickupClosure?.NoteDa,
                b.MaxAdvanceDays);
        }).ToList();
    }
}
