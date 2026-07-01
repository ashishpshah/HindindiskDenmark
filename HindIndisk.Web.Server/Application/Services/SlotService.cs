using HindIndisk.Api.Application.DTOs.Schedule;
using HindIndisk.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace HindIndisk.Api.Application.Services;

public class SlotService(ApplicationDbContext db)
{
    public async Task<SlotResultDto> GetAvailableSlotsAsync(
        long   branchId,
        string dateStr,      // "YYYY-MM-DD"
        string type)         // "reservation" | "order"
    {
        var date = DateOnly.Parse(dateStr);
        var dayOfWeek = date.DayOfWeek;

        // Layer 1 — weekly schedule
        var schedule = await db.BranchDaySchedules
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.BranchId == branchId && s.DayOfWeek == dayOfWeek);

        if (schedule is null)
            return new SlotResultDto(false, []);

        // Layer 2 — generate raw slots
        var bufferMins = type == "reservation" ? 90 : 30;
        var allSlots   = GenerateSlots(schedule.OpenTime, schedule.CloseTime,
                                       schedule.SlotIntervalMinutes, bufferMins);

        // Layer 3 — remove slots at or above capacity
        var slotTimeStrings = allSlots.Select(t => t.ToString("HH:mm")).ToList();

        var orderCounts = type == "order"
            ? await db.Orders
                .Where(o => o.BranchId == branchId
                         && o.ScheduledDate == date
                         && o.ScheduledTime != null)
                .GroupBy(o => o.ScheduledTime!)
                .Select(g => new { Time = g.Key, Count = g.Count() })
                .ToListAsync()
            : [];

        var dayStart  = date.ToDateTime(TimeOnly.MinValue);
        var dayEnd    = dayStart.AddDays(1);

        var resvnCounts = type == "reservation"
            ? await db.Reservations
                .Where(r => r.BranchId == branchId
                         && r.Date >= dayStart && r.Date < dayEnd
                         && r.TimeSlot != null)
                .GroupBy(r => r.TimeSlot!)
                .Select(g => new { Time = g.Key, Count = g.Count() })
                .ToListAsync()
            : [];

        var maxCapacity = type == "reservation"
            ? schedule.MaxReservationsPerSlot
            : schedule.MaxOrdersPerSlot;

        var fullSlots = new HashSet<string>(
            (type == "reservation"
                ? resvnCounts.Where(r => r.Count >= maxCapacity).Select(r => r.Time)
                : orderCounts.Where(r => r.Count >= maxCapacity).Select(r => r.Time))
            .OfType<string>()
        );

        // For today, also filter past slots (15-min buffer from now) — always in Denmark time
        var today = DenmarkTime.Today;
        if (date == today)
        {
            var now     = DenmarkTime.Now;
            var cutoff  = new TimeOnly(now.Hour, now.Minute).AddMinutes(15);
            allSlots    = allSlots.Where(s => s >= cutoff).ToList();
            slotTimeStrings = allSlots.Select(t => t.ToString("HH:mm")).ToList();
        }

        var available = slotTimeStrings.Where(s => !fullSlots.Contains(s)).ToList();
        return new SlotResultDto(true, available);
    }

    private static List<TimeOnly> GenerateSlots(
        TimeOnly open, TimeOnly close, int intervalMins, int bufferMins)
    {
        var slots   = new List<TimeOnly>();
        var lastSlot = close.AddMinutes(-bufferMins);
        var current  = open;

        while (current <= lastSlot)
        {
            slots.Add(current);
            current = current.AddMinutes(intervalMins);
        }
        return slots;
    }
}
