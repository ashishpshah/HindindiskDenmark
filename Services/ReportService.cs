using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TaskManagement.Data;
using TaskManagement.DTOs;

namespace TaskManagement.Services
{
    public interface IReportService
    {
        Task<ApiResponse<UserEffortReportDto>> GetUserEffortReportAsync(DateTime? fromUtc, DateTime? toUtc, int requestingUserId, bool isAdmin, CancellationToken ct = default);
        Task<ApiResponse<UserTransitionReportDto>> GetUserTransitionReportAsync(DateTime? fromUtc, DateTime? toUtc, int requestingUserId, bool isAdmin, CancellationToken ct = default);
        Task<ApiResponse<UserTaskEffortReportDto>> GetUserTaskEffortAsync(int targetUserId, DateTime? fromUtc, DateTime? toUtc, int requestingUserId, bool isAdmin, CancellationToken ct = default);
        Task<ApiResponse<UserDailyEffortReportDto>> GetUserDailyEffortAsync(int targetUserId, DateTime? fromUtc, DateTime? toUtc, int requestingUserId, bool isAdmin, CancellationToken ct = default);
        Task<ApiResponse<HoursSummaryDto>> GetHoursSummaryAsync(DateTime? fromUtc, DateTime? toUtc, int? filterUserId, int? filterProjectId, int requestingUserId, bool isAdmin, CancellationToken ct = default);
    }

    public class ReportService : IReportService
    {
        private readonly PMSDbContext _context;

        public ReportService(PMSDbContext context)
        {
            _context = context;
        }

        public async Task<ApiResponse<UserEffortReportDto>> GetUserEffortReportAsync(
            DateTime? fromUtc, DateTime? toUtc, int requestingUserId, bool isAdmin, CancellationToken ct = default)
        {
            var now = AppClock.Now;
            var winStart = fromUtc ?? DateTime.MinValue;
            var winEnd = toUtc ?? now;

            var tasks = await _context.Tasks
                .Select(t => new { t.Id, t.CreatedAt, t.Status, t.AssignedToId })
                .ToListAsync(ct);

            var statusByTask = (await _context.TaskStatusHistories
                    .OrderBy(h => h.ChangedAt)
                    .ToListAsync(ct))
                .GroupBy(h => h.TaskId)
                .ToDictionary(g => g.Key, g => (IReadOnlyList<TaskStatusHistory>)g.ToList());

            var assignByTask = (await _context.TaskAssignmentHistories
                    .OrderBy(h => h.ChangedAt)
                    .ToListAsync(ct))
                .GroupBy(h => h.TaskId)
                .ToDictionary(g => g.Key, g => (IReadOnlyList<TaskAssignmentHistory>)g.ToList());

            var perUserProductive = new Dictionary<int, long>();
            var perUserPaused = new Dictionary<int, long>();
            var perUserBlocked = new Dictionary<int, long>();
            var perUserUnderReview = new Dictionary<int, long>();
            var perUserTotal = new Dictionary<int, long>();
            var perUserTaskIds = new Dictionary<int, HashSet<int>>();

            var emptyStatus = new List<TaskStatusHistory>();
            var emptyAssign = new List<TaskAssignmentHistory>();

            foreach (var t in tasks)
            {
                var statusRows = statusByTask.TryGetValue(t.Id, out var sr) ? sr : emptyStatus;
                var assignRows = assignByTask.TryGetValue(t.Id, out var ar) ? ar : emptyAssign;

                var segments = EffortHelpers.BuildStatusSegments(t.CreatedAt, t.Status, statusRows, now);
                if (segments.Count == 0) continue;

                var windows = EffortHelpers.BuildAssignmentWindows(t.CreatedAt, assignRows, t.AssignedToId, now);

                foreach (var s in segments)
                {
                    // Clip segment to the requested date window.
                    var segWinStart = s.StartAt > winStart ? s.StartAt : winStart;
                    var segWinEnd   = s.EndAt   < winEnd   ? s.EndAt   : winEnd;
                    if (segWinEnd <= segWinStart) continue;

                    var statusLower = (s.Status ?? string.Empty).ToLowerInvariant();
                    bool isProd = statusLower == "in-progress";
                    bool isPaused = statusLower == "paused";
                    bool isBlocked = statusLower == "blocked";
                    bool isUnderReview = statusLower == "under-review";

                    foreach (var w in windows)
                    {
                        if (w.UserId == 0) continue;
                        // Intersect with assignment window, then filter to working hours.
                        var intStart = segWinStart > w.Start ? segWinStart : w.Start;
                        var intEnd   = segWinEnd   < w.End   ? segWinEnd   : w.End;
                        if (intEnd <= intStart) continue;
                        var ov = EffortHelpers.WorkingOverlap(intStart, intEnd);
                        if (ov <= 0) continue;

                        if (isProd) Add(perUserProductive, w.UserId, ov);
                        else if (isPaused) Add(perUserPaused, w.UserId, ov);
                        else if (isBlocked) Add(perUserBlocked, w.UserId, ov);
                        else if (isUnderReview) Add(perUserUnderReview, w.UserId, ov);
                        Add(perUserTotal, w.UserId, ov);

                        if (!perUserTaskIds.TryGetValue(w.UserId, out var taskSet))
                            perUserTaskIds[w.UserId] = taskSet = new HashSet<int>();
                        taskSet.Add(t.Id);
                    }
                }
            }

            var allUserIds = perUserTotal.Keys.ToList();
            var userInfo = await _context.Users
                .Where(u => allUserIds.Contains(u.Id))
                .Select(u => new { u.Id, u.FullName, u.AvatarUrl })
                .ToDictionaryAsync(u => u.Id, u => new { u.FullName, u.AvatarUrl }, ct);

            var items = allUserIds
                .Select(uid => new UserEffortReportItemDto
                {
                    UserId = uid,
                    UserName = userInfo.TryGetValue(uid, out var info) ? info.FullName : $"User #{uid}",
                    AvatarUrl = userInfo.TryGetValue(uid, out var info2) ? info2.AvatarUrl : null,
                    TaskCount = perUserTaskIds.TryGetValue(uid, out var ts) ? ts.Count : 0,
                    ProductiveSeconds = perUserProductive.TryGetValue(uid, out var prod) ? prod : 0,
                    PausedSeconds = perUserPaused.TryGetValue(uid, out var pau) ? pau : 0,
                    BlockedSeconds = perUserBlocked.TryGetValue(uid, out var blk) ? blk : 0,
                    UnderReviewSeconds = perUserUnderReview.TryGetValue(uid, out var rev) ? rev : 0,
                    TotalElapsedSeconds = perUserTotal.TryGetValue(uid, out var tot) ? tot : 0,
                })
                .OrderByDescending(i => i.ProductiveSeconds)
                .ToList();

            if (!isAdmin)
                items = items.Where(i => i.UserId == requestingUserId).ToList();

            return new ApiResponse<UserEffortReportDto>
            {
                Success = true,
                Data = new UserEffortReportDto { FromUtc = fromUtc, ToUtc = toUtc, Users = items }
            };
        }

        public async Task<ApiResponse<UserTransitionReportDto>> GetUserTransitionReportAsync(
            DateTime? fromUtc, DateTime? toUtc, int requestingUserId, bool isAdmin, CancellationToken ct = default)
        {
            var now = AppClock.Now;
            var winStart = fromUtc ?? DateTime.MinValue;
            var winEnd = toUtc ?? now;

            // Load tasks for assignment window computation.
            var tasks = await _context.Tasks
                .Select(t => new { t.Id, t.CreatedAt, t.Status, t.AssignedToId })
                .ToListAsync(ct);

            // Load status histories within the window.
            var historyRows = await _context.TaskStatusHistories
                .Where(h => h.ChangedAt >= winStart && h.ChangedAt < winEnd)
                .OrderBy(h => h.ChangedAt)
                .ToListAsync(ct);

            // Load all assignment histories to determine who was assigned at each transition time.
            var assignByTask = (await _context.TaskAssignmentHistories
                    .OrderBy(h => h.ChangedAt)
                    .ToListAsync(ct))
                .GroupBy(h => h.TaskId)
                .ToDictionary(g => g.Key, g => (IReadOnlyList<TaskAssignmentHistory>)g.ToList());

            var taskMap = tasks.ToDictionary(t => t.Id);
            var emptyAssign = new List<TaskAssignmentHistory>();

            // Per-assignee: (fromStatus, toStatus) → count
            var perUserTransitions = new Dictionary<int, Dictionary<(string from, string to), int>>();

            foreach (var h in historyRows)
            {
                if (!taskMap.TryGetValue(h.TaskId, out var task)) continue;
                var assignRows = assignByTask.TryGetValue(h.TaskId, out var ar) ? ar : emptyAssign;
                var windows = EffortHelpers.BuildAssignmentWindows(task.CreatedAt, assignRows, task.AssignedToId, now);

                // Find who was assigned at the time of this transition.
                var assignee = windows.FirstOrDefault(w => w.UserId != 0 && h.ChangedAt >= w.Start && h.ChangedAt < w.End);
                var uid = assignee.UserId == 0
                    ? windows.LastOrDefault(w => w.UserId != 0 && h.ChangedAt >= w.Start).UserId
                    : assignee.UserId;

                if (uid == 0) continue;

                if (!perUserTransitions.TryGetValue(uid, out var tmap))
                    perUserTransitions[uid] = tmap = new Dictionary<(string, string), int>();

                var key = (h.FromStatus ?? string.Empty, h.ToStatus ?? string.Empty);
                tmap.TryGetValue(key, out var cnt);
                tmap[key] = cnt + 1;
            }

            var allUserIds = perUserTransitions.Keys.ToList();
            var userInfo = await _context.Users
                .Where(u => allUserIds.Contains(u.Id))
                .Select(u => new { u.Id, u.FullName, u.AvatarUrl })
                .ToDictionaryAsync(u => u.Id, u => new { u.FullName, u.AvatarUrl }, ct);

            var items = allUserIds
                .Select(uid =>
                {
                    var tmap = perUserTransitions[uid];
                    var breakdown = tmap
                        .Select(kv => new TransitionCountDto
                        {
                            FromStatus = kv.Key.from,
                            ToStatus = kv.Key.to,
                            Count = kv.Value
                        })
                        .OrderByDescending(t => t.Count)
                        .ToList();

                    var top = breakdown.FirstOrDefault();
                    var mostCommon = top != null ? $"{top.FromStatus} → {top.ToStatus}" : string.Empty;

                    return new UserTransitionReportItemDto
                    {
                        UserId = uid,
                        UserName = userInfo.TryGetValue(uid, out var info) ? info.FullName : $"User #{uid}",
                        AvatarUrl = userInfo.TryGetValue(uid, out var info2) ? info2.AvatarUrl : null,
                        TotalTransitions = tmap.Values.Sum(),
                        MostCommonTransition = mostCommon,
                        Breakdown = breakdown
                    };
                })
                .OrderByDescending(i => i.TotalTransitions)
                .ToList();

            if (!isAdmin)
                items = items.Where(i => i.UserId == requestingUserId).ToList();

            return new ApiResponse<UserTransitionReportDto>
            {
                Success = true,
                Data = new UserTransitionReportDto { FromUtc = fromUtc, ToUtc = toUtc, Users = items }
            };
        }

        public async Task<ApiResponse<UserTaskEffortReportDto>> GetUserTaskEffortAsync(
            int targetUserId, DateTime? fromUtc, DateTime? toUtc, int requestingUserId, bool isAdmin, CancellationToken ct = default)
        {
            // Non-admins may only query their own data.
            if (!isAdmin && targetUserId != requestingUserId)
                return new ApiResponse<UserTaskEffortReportDto> { Success = false, Message = "Forbidden" };

            var now = AppClock.Now;
            var winStart = fromUtc ?? DateTime.MinValue;
            var winEnd   = toUtc   ?? now;

            // Load only tasks that were ever assigned to this user (or currently assigned).
            var tasks = await _context.Tasks
                .Select(t => new { t.Id, t.Code, t.Title, t.Status, t.CreatedAt, t.AssignedToId })
                .ToListAsync(ct);

            var taskIds = tasks.Select(t => t.Id).ToList();

            var statusByTask = (await _context.TaskStatusHistories
                    .Where(h => taskIds.Contains(h.TaskId))
                    .OrderBy(h => h.ChangedAt)
                    .ToListAsync(ct))
                .GroupBy(h => h.TaskId)
                .ToDictionary(g => g.Key, g => (IReadOnlyList<TaskStatusHistory>)g.ToList());

            var assignByTask = (await _context.TaskAssignmentHistories
                    .Where(h => taskIds.Contains(h.TaskId))
                    .OrderBy(h => h.ChangedAt)
                    .ToListAsync(ct))
                .GroupBy(h => h.TaskId)
                .ToDictionary(g => g.Key, g => (IReadOnlyList<TaskAssignmentHistory>)g.ToList());

            var emptyStatus = new List<TaskStatusHistory>();
            var emptyAssign = new List<TaskAssignmentHistory>();

            var taskEfforts = new List<UserTaskEffortItemDto>();

            foreach (var t in tasks)
            {
                var statusRows = statusByTask.TryGetValue(t.Id, out var sr) ? sr : emptyStatus;
                var assignRows = assignByTask.TryGetValue(t.Id, out var ar) ? ar : emptyAssign;

                var segments = EffortHelpers.BuildStatusSegments(t.CreatedAt, t.Status, statusRows, now);
                if (segments.Count == 0) continue;

                var windows = EffortHelpers.BuildAssignmentWindows(t.CreatedAt, assignRows, t.AssignedToId, now);

                // Check if targetUser ever held this task.
                bool userEverAssigned = windows.Any(w => w.UserId == targetUserId);
                if (!userEverAssigned) continue;

                long prod = 0, paused = 0, blocked = 0, underReview = 0, total = 0;

                foreach (var s in segments)
                {
                    var segWinStart = s.StartAt > winStart ? s.StartAt : winStart;
                    var segWinEnd   = s.EndAt   < winEnd   ? s.EndAt   : winEnd;
                    if (segWinEnd <= segWinStart) continue;

                    var statusLower = (s.Status ?? string.Empty).ToLowerInvariant();

                    foreach (var w in windows)
                    {
                        if (w.UserId != targetUserId) continue;
                        var intStart = segWinStart > w.Start ? segWinStart : w.Start;
                        var intEnd   = segWinEnd   < w.End   ? segWinEnd   : w.End;
                        if (intEnd <= intStart) continue;
                        var ov = EffortHelpers.WorkingOverlap(intStart, intEnd);
                        if (ov <= 0) continue;

                        switch (statusLower)
                        {
                            case "in-progress":   prod        += ov; break;
                            case "paused":        paused      += ov; break;
                            case "blocked":       blocked     += ov; break;
                            case "under-review":  underReview += ov; break;
                        }
                        total += ov;
                    }
                }

                if (total == 0) continue;

                taskEfforts.Add(new UserTaskEffortItemDto
                {
                    TaskId              = t.Id,
                    TaskCode            = t.Code ?? string.Empty,
                    TaskTitle           = t.Title,
                    TaskStatus          = t.Status,
                    ProductiveSeconds   = prod,
                    PausedSeconds       = paused,
                    BlockedSeconds      = blocked,
                    UnderReviewSeconds  = underReview,
                    TotalElapsedSeconds = total,
                });
            }

            taskEfforts = taskEfforts.OrderByDescending(x => x.ProductiveSeconds).ToList();

            var userInfo = await _context.Users
                .Where(u => u.Id == targetUserId)
                .Select(u => new { u.FullName, u.AvatarUrl })
                .FirstOrDefaultAsync(ct);

            return new ApiResponse<UserTaskEffortReportDto>
            {
                Success = true,
                Data = new UserTaskEffortReportDto
                {
                    UserId    = targetUserId,
                    UserName  = userInfo?.FullName ?? $"User #{targetUserId}",
                    AvatarUrl = userInfo?.AvatarUrl,
                    FromUtc   = fromUtc,
                    ToUtc     = toUtc,
                    Tasks     = taskEfforts,
                }
            };
        }

        public async Task<ApiResponse<UserDailyEffortReportDto>> GetUserDailyEffortAsync(
            int targetUserId, DateTime? fromUtc, DateTime? toUtc, int requestingUserId, bool isAdmin, CancellationToken ct = default)
        {
            if (!isAdmin && targetUserId != requestingUserId)
                return new ApiResponse<UserDailyEffortReportDto> { Success = false, Message = "Forbidden" };

            var now = AppClock.Now;
            var winStart = (fromUtc ?? DateTime.MinValue).Date;
            var winEnd   = (toUtc   ?? now).Date;

            var tasks = await _context.Tasks
                .Select(t => new { t.Id, t.CreatedAt, t.Status, t.AssignedToId })
                .ToListAsync(ct);

            var taskIds = tasks.Select(t => t.Id).ToList();

            var statusByTask = (await _context.TaskStatusHistories
                    .Where(h => taskIds.Contains(h.TaskId))
                    .OrderBy(h => h.ChangedAt)
                    .ToListAsync(ct))
                .GroupBy(h => h.TaskId)
                .ToDictionary(g => g.Key, g => (IReadOnlyList<TaskStatusHistory>)g.ToList());

            var assignByTask = (await _context.TaskAssignmentHistories
                    .Where(h => taskIds.Contains(h.TaskId))
                    .OrderBy(h => h.ChangedAt)
                    .ToListAsync(ct))
                .GroupBy(h => h.TaskId)
                .ToDictionary(g => g.Key, g => (IReadOnlyList<TaskAssignmentHistory>)g.ToList());

            var emptyStatus = new List<TaskStatusHistory>();
            var emptyAssign = new List<TaskAssignmentHistory>();

            // dayProd[date] = { prod, paused, blocked, underReview, total, taskIds }
            var dayProd        = new Dictionary<DateTime, long>();
            var dayPaused      = new Dictionary<DateTime, long>();
            var dayBlocked     = new Dictionary<DateTime, long>();
            var dayUnderReview = new Dictionary<DateTime, long>();
            var dayTotal       = new Dictionary<DateTime, long>();
            var dayTaskIds     = new Dictionary<DateTime, HashSet<int>>();

            foreach (var t in tasks)
            {
                var statusRows = statusByTask.TryGetValue(t.Id, out var sr) ? sr : emptyStatus;
                var assignRows = assignByTask.TryGetValue(t.Id, out var ar) ? ar : emptyAssign;

                var segments = EffortHelpers.BuildStatusSegments(t.CreatedAt, t.Status, statusRows, now);
                if (segments.Count == 0) continue;

                var windows = EffortHelpers.BuildAssignmentWindows(t.CreatedAt, assignRows, t.AssignedToId, now);
                if (!windows.Any(w => w.UserId == targetUserId)) continue;

                foreach (var s in segments)
                {
                    // Clip segment to the user's assignment windows for this task.
                    foreach (var w in windows)
                    {
                        if (w.UserId != targetUserId) continue;

                        var intStart = s.StartAt > w.Start ? s.StartAt : w.Start;
                        var intEnd   = s.EndAt   < w.End   ? s.EndAt   : w.End;
                        if (intEnd <= intStart) continue;

                        var statusLower = (s.Status ?? string.Empty).ToLowerInvariant();

                        // Iterate each calendar day covered by this intersection.
                        var day = intStart.Date;
                        while (day <= intEnd.Date)
                        {
                            if (day >= winStart && day <= winEnd)
                            {
                                var ov = EffortHelpers.WorkingOverlapForDay(intStart, intEnd, day);
                                if (ov > 0)
                                {
                                    switch (statusLower)
                                    {
                                        case "in-progress":  AddDay(dayProd,        day, ov); break;
                                        case "paused":       AddDay(dayPaused,      day, ov); break;
                                        case "blocked":      AddDay(dayBlocked,     day, ov); break;
                                        case "under-review": AddDay(dayUnderReview, day, ov); break;
                                    }
                                    AddDay(dayTotal, day, ov);

                                    if (!dayTaskIds.TryGetValue(day, out var ts))
                                        dayTaskIds[day] = ts = new HashSet<int>();
                                    ts.Add(t.Id);
                                }
                            }
                            day = day.AddDays(1);
                        }
                    }
                }
            }

            // Build day list for the entire requested window (include days with zero effort too,
            // so the UI can navigate smoothly without gaps).
            var days = new List<DailyEffortItemDto>();
            if (dayTotal.Count > 0)
            {
                var firstDay = dayTotal.Keys.Min();
                var lastDay  = dayTotal.Keys.Max();
                for (var d = firstDay; d <= lastDay; d = d.AddDays(1))
                {
                    days.Add(new DailyEffortItemDto
                    {
                        Date               = d,
                        ProductiveSeconds  = dayProd.TryGetValue(d, out var p)  ? p  : 0,
                        PausedSeconds      = dayPaused.TryGetValue(d, out var pa) ? pa : 0,
                        BlockedSeconds     = dayBlocked.TryGetValue(d, out var b)  ? b  : 0,
                        UnderReviewSeconds = dayUnderReview.TryGetValue(d, out var u) ? u : 0,
                        TotalElapsedSeconds= dayTotal.TryGetValue(d, out var tt) ? tt : 0,
                        TaskCount          = dayTaskIds.TryGetValue(d, out var ts) ? ts.Count : 0,
                    });
                }
            }

            var userInfo = await _context.Users
                .Where(u => u.Id == targetUserId)
                .Select(u => new { u.FullName, u.AvatarUrl })
                .FirstOrDefaultAsync(ct);

            return new ApiResponse<UserDailyEffortReportDto>
            {
                Success = true,
                Data = new UserDailyEffortReportDto
                {
                    UserId    = targetUserId,
                    UserName  = userInfo?.FullName ?? $"User #{targetUserId}",
                    AvatarUrl = userInfo?.AvatarUrl,
                    FromUtc   = fromUtc,
                    ToUtc     = toUtc,
                    Days      = days,
                }
            };
        }

        public async Task<ApiResponse<HoursSummaryDto>> GetHoursSummaryAsync(
            DateTime? fromUtc, DateTime? toUtc, int? filterUserId, int? filterProjectId,
            int requestingUserId, bool isAdmin, CancellationToken ct = default)
        {
            // Non-admins can only see their own data.
            if (!isAdmin) filterUserId = requestingUserId;

            var now = AppClock.Now;
            var winStart = fromUtc ?? DateTime.MinValue;
            var winEnd   = toUtc   ?? now;

            // Load tasks (with project info).
            var allTasks = await _context.Tasks
                .Select(t => new { t.Id, t.Code, t.Title, t.Status, t.CreatedAt, t.AssignedToId, t.ProjectId })
                .ToListAsync(ct);

            // Apply project filter at task level.
            var tasks = filterProjectId.HasValue
                ? allTasks.Where(t => t.ProjectId == filterProjectId.Value).ToList()
                : allTasks;

            var taskIds = tasks.Select(t => t.Id).ToList();

            var statusByTask = (await _context.TaskStatusHistories
                    .Where(h => taskIds.Contains(h.TaskId))
                    .OrderBy(h => h.ChangedAt)
                    .ToListAsync(ct))
                .GroupBy(h => h.TaskId)
                .ToDictionary(g => g.Key, g => (IReadOnlyList<TaskStatusHistory>)g.ToList());

            var assignByTask = (await _context.TaskAssignmentHistories
                    .Where(h => taskIds.Contains(h.TaskId))
                    .OrderBy(h => h.ChangedAt)
                    .ToListAsync(ct))
                .GroupBy(h => h.TaskId)
                .ToDictionary(g => g.Key, g => (IReadOnlyList<TaskAssignmentHistory>)g.ToList());

            var projectIds = tasks.Select(t => t.ProjectId).Distinct().ToList();
            var projectNames = await _context.Projects
                .Where(p => projectIds.Contains(p.Id))
                .Select(p => new { p.Id, p.Name })
                .ToDictionaryAsync(p => p.Id, p => p.Name, ct);

            var emptyStatus = new List<TaskStatusHistory>();
            var emptyAssign = new List<TaskAssignmentHistory>();

            // Accumulators keyed by userId / taskId / projectId
            var byUser    = new Dictionary<int, HoursSummaryUserRowDto>();
            var byTask    = new Dictionary<int, HoursSummaryTaskRowDto>();
            var byProject = new Dictionary<int, HoursSummaryProjectRowDto>();

            // Track distinct users per project
            var projectUsers = new Dictionary<int, HashSet<int>>();

            foreach (var t in tasks)
            {
                var statusRows = statusByTask.TryGetValue(t.Id, out var sr) ? sr : emptyStatus;
                var assignRows = assignByTask.TryGetValue(t.Id, out var ar) ? ar : emptyAssign;

                var segments = EffortHelpers.BuildStatusSegments(t.CreatedAt, t.Status, statusRows, now);
                if (segments.Count == 0) continue;

                var windows = EffortHelpers.BuildAssignmentWindows(t.CreatedAt, assignRows, t.AssignedToId, now);

                // If filtering by user, skip tasks where user was never assigned.
                if (filterUserId.HasValue && !windows.Any(w => w.UserId == filterUserId.Value)) continue;

                foreach (var s in segments)
                {
                    var segWinStart = s.StartAt > winStart ? s.StartAt : winStart;
                    var segWinEnd   = s.EndAt   < winEnd   ? s.EndAt   : winEnd;
                    if (segWinEnd <= segWinStart) continue;

                    var statusLower = (s.Status ?? string.Empty).ToLowerInvariant();
                    bool isProd   = statusLower == "in-progress";
                    bool isPaused = statusLower == "paused";
                    bool isBlock  = statusLower == "blocked";
                    bool isReview = statusLower == "under-review";
                    bool counts   = isProd || isPaused || isBlock || isReview;
                    if (!counts) continue;

                    foreach (var w in windows)
                    {
                        if (w.UserId == 0) continue;
                        if (filterUserId.HasValue && w.UserId != filterUserId.Value) continue;

                        var intStart = segWinStart > w.Start ? segWinStart : w.Start;
                        var intEnd   = segWinEnd   < w.End   ? segWinEnd   : w.End;
                        if (intEnd <= intStart) continue;

                        var ov = EffortHelpers.WorkingOverlap(intStart, intEnd);
                        if (ov <= 0) continue;

                        // ── by User ──
                        if (!byUser.TryGetValue(w.UserId, out var uRow))
                            byUser[w.UserId] = uRow = new HoursSummaryUserRowDto { UserId = w.UserId };
                        if (isProd)   uRow.ProductiveSeconds  += ov;
                        if (isPaused) uRow.PausedSeconds      += ov;
                        if (isBlock)  uRow.BlockedSeconds     += ov;
                        if (isReview) uRow.UnderReviewSeconds += ov;
                        uRow.TotalSeconds += ov;

                        // ── by Task ──
                        if (!byTask.TryGetValue(t.Id, out var tRow))
                            byTask[t.Id] = tRow = new HoursSummaryTaskRowDto
                            {
                                TaskId      = t.Id,
                                TaskCode    = t.Code ?? string.Empty,
                                TaskTitle   = t.Title,
                                TaskStatus  = t.Status,
                                ProjectId   = t.ProjectId,
                                ProjectName = projectNames.TryGetValue(t.ProjectId, out var pn) ? pn : string.Empty,
                            };
                        if (isProd)   tRow.ProductiveSeconds  += ov;
                        if (isPaused) tRow.PausedSeconds      += ov;
                        if (isBlock)  tRow.BlockedSeconds     += ov;
                        if (isReview) tRow.UnderReviewSeconds += ov;
                        tRow.TotalSeconds += ov;

                        // ── by Project ──
                        if (!byProject.TryGetValue(t.ProjectId, out var pRow))
                            byProject[t.ProjectId] = pRow = new HoursSummaryProjectRowDto
                            {
                                ProjectId   = t.ProjectId,
                                ProjectName = projectNames.TryGetValue(t.ProjectId, out var pn2) ? pn2 : string.Empty,
                            };
                        if (isProd)   pRow.ProductiveSeconds  += ov;
                        if (isPaused) pRow.PausedSeconds      += ov;
                        if (isBlock)  pRow.BlockedSeconds     += ov;
                        if (isReview) pRow.UnderReviewSeconds += ov;
                        pRow.TotalSeconds += ov;

                        if (!projectUsers.TryGetValue(t.ProjectId, out var pu))
                            projectUsers[t.ProjectId] = pu = new HashSet<int>();
                        pu.Add(w.UserId);
                    }
                }

                // Count distinct tasks per user and per project
                foreach (var uid in windows.Where(w => w.UserId != 0).Select(w => w.UserId).Distinct())
                {
                    if (filterUserId.HasValue && uid != filterUserId.Value) continue;
                    if (byUser.TryGetValue(uid, out var ur) && ur.TotalSeconds > 0) ur.TaskCount++;
                }
                if (byTask.ContainsKey(t.Id))
                {
                    if (!byProject.TryGetValue(t.ProjectId, out var pr)) { }
                    else pr.TaskCount++;
                }
            }

            // Populate UserCount for projects
            foreach (var kv in projectUsers)
                if (byProject.TryGetValue(kv.Key, out var pr)) pr.UserCount = kv.Value.Count;

            // Bulk-load user names + avatars
            var userIds = byUser.Keys.ToList();
            var userInfo = await _context.Users
                .Where(u => userIds.Contains(u.Id))
                .Select(u => new { u.Id, u.FullName, u.AvatarUrl })
                .ToDictionaryAsync(u => u.Id, u => new { u.FullName, u.AvatarUrl }, ct);

            foreach (var kv in byUser)
            {
                if (!userInfo.TryGetValue(kv.Key, out var info)) continue;
                kv.Value.UserName  = info.FullName;
                kv.Value.AvatarUrl = info.AvatarUrl;
            }

            var totalProd    = byUser.Values.Sum(u => u.ProductiveSeconds);
            var totalWorking = byUser.Values.Sum(u => u.TotalSeconds);

            return new ApiResponse<HoursSummaryDto>
            {
                Success = true,
                Data = new HoursSummaryDto
                {
                    FromUtc                = fromUtc,
                    ToUtc                  = toUtc,
                    TotalProductiveSeconds = totalProd,
                    TotalWorkingSeconds    = totalWorking,
                    FilterUserId           = filterUserId,
                    FilterProjectId        = filterProjectId,
                    ByUser    = byUser.Values.OrderByDescending(u => u.ProductiveSeconds).ToList(),
                    ByTask    = byTask.Values.OrderByDescending(t => t.ProductiveSeconds).ToList(),
                    ByProject = byProject.Values.OrderByDescending(p => p.ProductiveSeconds).ToList(),
                }
            };
        }

        private static void AddDay(Dictionary<DateTime, long> dict, DateTime key, long value)
        {
            dict.TryGetValue(key, out var cur);
            dict[key] = cur + value;
        }

        private static void Add(Dictionary<int, long> dict, int key, long value)
        {
            dict.TryGetValue(key, out var cur);
            dict[key] = cur + value;
        }
    }
}
