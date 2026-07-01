using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TaskManagement.Data;
using TaskManagement.DTOs;

namespace TaskManagement.Services
{
    public interface IWorkDiaryService
    {
        Task<ApiResponse<List<WorkDiaryDto>>> GetMyDiaryAsync(int userId, int? month, int? year);
        Task<ApiResponse<WorkDiaryDto>> AddEntryAsync(int userId, CreateWorkDiaryDto dto);
        Task<ApiResponse<WorkDiaryDto>> UpdateEntryAsync(int userId, int id, UpdateWorkDiaryDto dto);
        Task<ApiResponse<bool>> DeleteEntryAsync(int userId, int id);
    }

    public class WorkDiaryService : IWorkDiaryService
    {
        private readonly PMSDbContext _context;

        public WorkDiaryService(PMSDbContext context) => _context = context;

        public static readonly string[] Categories =
            new[] { "Development", "Meeting", "Review", "Testing", "Documentation", "Other" };

        private static bool IsWorkingDay(DateTime d)
        {
            if (d.DayOfWeek == DayOfWeek.Sunday) return false;
            if (d.DayOfWeek == DayOfWeek.Saturday)
            {
                int week = (int)Math.Ceiling(d.Day / 7.0);
                if (week == 2 || week == 4) return false;
            }
            return true;
        }

        private static bool IsAllowedDate(DateTime date)
        {
            var today = AppClock.Today;
            var d = date.Date;
            if (d > today) return false;
            if (d == today) return true;
            return IsWorkingDay(d);
        }

        public async Task<ApiResponse<List<WorkDiaryDto>>> GetMyDiaryAsync(int userId, int? month, int? year)
        {
            var query = _context.WorkDiaries
                .Include(wd => wd.Task)
                .Where(wd => wd.UserId == userId);

            if (month.HasValue) query = query.Where(wd => wd.Date.Month == month.Value);
            if (year.HasValue) query = query.Where(wd => wd.Date.Year == year.Value);

            var list = await query
                .OrderByDescending(wd => wd.Date)
                .ThenByDescending(wd => wd.CreatedAt)
                .ToListAsync();

            return new ApiResponse<List<WorkDiaryDto>>
            {
                Success = true,
                Data = list.Select(ToDto).ToList()
            };
        }

        public async Task<ApiResponse<WorkDiaryDto>> AddEntryAsync(int userId, CreateWorkDiaryDto dto)
        {
            if (!IsAllowedDate(dto.Date))
                return new ApiResponse<WorkDiaryDto>
                {
                    Success = false,
                    Message = "Date must be today or a past working day (Mon–Sat, excl. 2nd/4th Saturdays)."
                };

            var entry = new WorkDiary
            {
                UserId = userId,
                Date = dto.Date.Date,
                Description = dto.Description,
                Category = dto.Category,
                HoursSpent = dto.HoursSpent,
                TaskId = dto.TaskId,
                CreatedAt = AppClock.Now,
                UpdatedAt = AppClock.Now
            };

            _context.WorkDiaries.Add(entry);
            await _context.SaveChangesAsync();
            await _context.Entry(entry).Reference(e => e.Task).LoadAsync();

            return new ApiResponse<WorkDiaryDto> { Success = true, Data = ToDto(entry) };
        }

        public async Task<ApiResponse<WorkDiaryDto>> UpdateEntryAsync(int userId, int id, UpdateWorkDiaryDto dto)
        {
            var entry = await _context.WorkDiaries
                .Include(wd => wd.Task)
                .FirstOrDefaultAsync(wd => wd.Id == id && wd.UserId == userId);

            if (entry == null)
                return ApiResponse<WorkDiaryDto>.NotFound("Entry not found or not yours.");

            entry.Description = dto.Description;
            entry.Category = dto.Category;
            entry.HoursSpent = dto.HoursSpent;
            entry.TaskId = dto.TaskId;
            entry.UpdatedAt = AppClock.Now;

            await _context.SaveChangesAsync();
            await _context.Entry(entry).Reference(e => e.Task).LoadAsync();

            return new ApiResponse<WorkDiaryDto> { Success = true, Data = ToDto(entry) };
        }

        public async Task<ApiResponse<bool>> DeleteEntryAsync(int userId, int id)
        {
            var entry = await _context.WorkDiaries
                .FirstOrDefaultAsync(wd => wd.Id == id && wd.UserId == userId);

            if (entry == null)
                return ApiResponse<bool>.NotFound("Entry not found or not yours.");

            _context.WorkDiaries.Remove(entry);
            await _context.SaveChangesAsync();

            return new ApiResponse<bool> { Success = true, Data = true };
        }

        private static WorkDiaryDto ToDto(WorkDiary w) => new()
        {
            Id = w.Id,
            UserId = w.UserId,
            Date = w.Date,
            Description = w.Description,
            Category = w.Category,
            HoursSpent = w.HoursSpent,
            TaskId = w.TaskId,
            TaskTitle = w.Task?.Title,
            CreatedAt = w.CreatedAt,
            UpdatedAt = w.UpdatedAt
        };
    }
}
