using HindIndisk.Api.Application.DTOs.Admin;
using HindIndisk.Api.Domain.Entities;
using HindIndisk.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace HindIndisk.Api.Application.Services;

public class BranchServiceStatusService(ApplicationDbContext db)
{
    /// <summary>Toggle IsCloseOrder or IsCloseReservation for a branch and record history.</summary>
    public async Task<BranchServiceClosureDto> ToggleAsync(
        long branchId, string serviceType, bool isClosed, string adminEmail)
    {
        var branch = await db.Branches.FindAsync(branchId)
            ?? throw new KeyNotFoundException($"Branch {branchId} not found.");

        if (serviceType == "Order")
            branch.IsCloseOrder = isClosed;
        else
            branch.IsCloseReservation = isClosed;

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
            };
            db.BranchServiceClosures.Add(history);
        }
        else
        {
            // Reopening — stamp the latest open row for this branch+type
            history = await db.BranchServiceClosures
                .Where(c => c.BranchId == branchId
                         && c.ServiceType == serviceType
                         && c.ReopenedAt == null)
                .OrderByDescending(c => c.ClosedAt)
                .FirstOrDefaultAsync()
                ?? new BranchServiceClosure
                {
                    BranchId    = branchId,
                    ServiceType = serviceType,
                    ClosedAt    = DenmarkTime.Now,
                    ClosedBy    = adminEmail,
                };

            history.ReopenedAt = DenmarkTime.Now;

            if (history.Id == 0)
                db.BranchServiceClosures.Add(history);
        }

        await db.SaveChangesAsync();

        return new BranchServiceClosureDto(
            history.Id, branch.Id, branch.Name,
            history.ServiceType, history.ClosedAt,
            history.ReopenedAt, history.ClosedBy);
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
            c.ServiceType, c.ClosedAt, c.ReopenedAt, c.ClosedBy)).ToList();
    }

    /// <summary>Current open/close status for all branches.</summary>
    public async Task<IReadOnlyList<AdminBranchDto>> GetAllStatusAsync()
    {
        var branches = await db.Branches.OrderBy(b => b.Name).ToListAsync();
        return branches.Select(b => new AdminBranchDto(
            b.Id, b.Name, b.AddressLine1, b.AddressLine2, b.City, b.PostalCode, b.Country,
            b.Phone, b.Email, b.GoogleMapsLink, b.ImageUrl, b.Rating, b.ReviewCount,
            b.DeliveryEnabled, b.PickupEnabled, b.DeliveryFee, b.DeliveryFeeEnabled,
            b.IsCloseOrder, b.IsCloseReservation, b.MaxAdvanceDays)).ToList();
    }
}
