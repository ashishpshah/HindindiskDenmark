using HindIndisk.Api.Application.DTOs.Location;
using HindIndisk.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace HindIndisk.Api.Application.Services;

public class LocationService : ILocationService
{
    private readonly ApplicationDbContext _db;

    public LocationService(ApplicationDbContext db) => _db = db;

    public async Task<IReadOnlyList<BranchDto>> GetBranchesAsync()
    {
        var today = DenmarkTime.Today;

        var branches = await _db.Branches
            .AsNoTracking()
            .Include(b => b.DaySchedules)
            .Include(b => b.Closures)
            .OrderBy(b => b.Id)
            .ToListAsync();

        return branches.Select(b =>
        {
            var schedules = b.DaySchedules;

            // Active all-day instant closures for Delivery / Pickup (today only)
            var deliveryClosure = b.Closures.FirstOrDefault(c =>
                c.ClosureType == "DateRange" && c.Scope == "Delivery" && c.StartTime == null
                && (c.StartDate ?? today) <= today && (c.EndDate ?? c.StartDate ?? today) >= today);
            var pickupClosure = b.Closures.FirstOrDefault(c =>
                c.ClosureType == "DateRange" && c.Scope == "Pickup" && c.StartTime == null
                && (c.StartDate ?? today) <= today && (c.EndDate ?? c.StartDate ?? today) >= today);

            // First weekday (Mon–Fri) and weekend (Sat–Sun) schedule found
            var weekday = schedules.FirstOrDefault(s =>
                s.DayOfWeek >= DayOfWeek.Monday && s.DayOfWeek <= DayOfWeek.Friday);
            var weekend = schedules.FirstOrDefault(s =>
                s.DayOfWeek == DayOfWeek.Saturday || s.DayOfWeek == DayOfWeek.Sunday);

            var weekdayHours  = weekday is not null ? $"{weekday.OpenTime:HH\\:mm} – {weekday.CloseTime:HH\\:mm}" : "Closed";
            var weekendHours  = weekend is not null ? $"{weekend.OpenTime:HH\\:mm} – {weekend.CloseTime:HH\\:mm}" : "Closed";
            var weekdayOpen   = weekday?.OpenTime.ToString("HH:mm")  ?? "";
            var weekdayClose  = weekday?.CloseTime.ToString("HH:mm") ?? "";
            var weekendOpen   = weekend?.OpenTime.ToString("HH:mm")  ?? "";
            var weekendClose  = weekend?.CloseTime.ToString("HH:mm") ?? "";

            return new BranchDto(
                b.Id, b.Name, b.AddressLine1, b.AddressLine2, b.City, b.PostalCode,
                b.Phone, b.Email, b.GoogleMapsLink,
                weekdayHours, weekendHours,
                weekdayOpen, weekdayClose, weekendOpen, weekendClose,
                b.ImageUrl, b.Rating, b.ReviewCount,
                b.DeliveryFee, b.DeliveryFeeEnabled,
                b.IsCloseOrder, b.CloseOrderNote,
                b.IsCloseReservation, b.CloseReservationNote,
                deliveryClosure != null, deliveryClosure?.Note,
                pickupClosure   != null, pickupClosure?.Note,
                b.MaxAdvanceDays
            );
        }).ToList();
    }
}
