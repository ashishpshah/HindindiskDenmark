using HindIndisk.Api.Application.DTOs.Schedule;
using HindIndisk.Api.Domain.Entities;
using HindIndisk.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace HindIndisk.Api.Application.Services;

public class ScheduleService(ApplicationDbContext db)
{
    private static readonly string[] DayNames =
        ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    public async Task<IReadOnlyList<BranchDayScheduleDto>> GetScheduleAsync(long branchId)
    {
        var rows = await db.BranchDaySchedules
            .AsNoTracking()
            .Where(s => s.BranchId == branchId)
            .OrderBy(s => s.DayOfWeek)
            .ToListAsync();

        return rows.Select(ToDto).ToList();
    }

    public async Task<IReadOnlyList<BranchDayScheduleDto>> UpsertScheduleAsync(
        long branchId, IEnumerable<UpsertDayScheduleRequest> requests)
    {
        var requestList = requests.ToList();
        if (requestList.Count == 0)
            throw new InvalidOperationException("At least one open day is required. Mark at least one day as open before saving.");

        var existing = await db.BranchDaySchedules
            .Where(s => s.BranchId == branchId)
            .ToListAsync();

        db.BranchDaySchedules.RemoveRange(existing);

        var newRows = requestList.Select(r => new BranchDaySchedule
        {
            BranchId               = branchId,
            DayOfWeek              = (DayOfWeek)r.DayOfWeek,
            OpenTime               = TimeOnly.Parse(r.OpenTime),
            CloseTime              = TimeOnly.Parse(r.CloseTime),
            SlotIntervalMinutes    = r.SlotIntervalMinutes,
            MaxOrdersPerSlot       = r.MaxOrdersPerSlot,
            MaxReservationsPerSlot = r.MaxReservationsPerSlot,
        }).ToList();

        await db.BranchDaySchedules.AddRangeAsync(newRows);
        await db.SaveChangesAsync();
        return newRows.OrderBy(s => s.DayOfWeek).Select(ToDto).ToList();
    }

    private static BranchDayScheduleDto ToDto(BranchDaySchedule s) =>
        new((int)s.DayOfWeek, DayNames[(int)s.DayOfWeek],
            s.OpenTime.ToString("HH:mm"), s.CloseTime.ToString("HH:mm"),
            s.SlotIntervalMinutes, s.MaxOrdersPerSlot, s.MaxReservationsPerSlot);
}
