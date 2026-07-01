using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TaskManagement.Data;
using TaskManagement.DTOs;
using AutoMapper;

namespace TaskManagement.Services
{
    public interface ITaskService
    {
        Task<ApiResponse<List<TaskDto>>> GetAllTasksAsync(string? status, string? priority, int? projectId, int? assigneeId = null, int page = 1, int pageSize = 100, CancellationToken ct = default);
        Task<ApiResponse<TaskDto>> GetTaskByIdAsync(int id, CancellationToken ct = default);
        Task<ApiResponse<TaskDto>> CreateTaskAsync(CreateTaskDto createTaskDto, int creatorId);
        Task<ApiResponse<TaskDto>> UpdateTaskAsync(int id, CreateTaskDto updateTaskDto, int userId);
        Task<ApiResponse<bool>> DeleteTaskAsync(int id);
        Task<ApiResponse<DashboardStatsDto>> GetDashboardStatsAsync(CancellationToken ct = default);
        Task<ApiResponse<TaskDto>> AssignTaskAsync(int taskId, int? assigneeId);
        Task<ApiResponse<TaskCommentDto>> AddCommentAsync(int taskId, CreateTaskCommentDto dto, int userId);
        Task<ApiResponse<TaskDto>> ReassignTaskAsync(int taskId, ReassignTaskDto dto, int changedById);
        Task<ApiResponse<TaskDto>> StartTaskAsync(int taskId, int userId);
        Task<ApiResponse<TaskDto>> ChangeStatusAsync(int taskId, ChangeStatusDto dto, int userId, bool isAdmin, bool requireActualHours = true);
        Task<ApiResponse<List<TaskStatusHistoryDto>>> GetStatusHistoryAsync(int taskId, CancellationToken ct = default);
        Task<ApiResponse<TaskEffortDto>> GetTaskEffortAsync(int taskId, CancellationToken ct = default);
        Task<ApiResponse<DashboardEffortDto>> GetEffortStatsAsync(DateTime? fromUtc, DateTime? toUtc, CancellationToken ct = default);
        Task<ApiResponse<List<TaskAssignmentHistoryDto>>> GetTaskAssignmentHistoryAsync(int taskId, CancellationToken ct = default);
        Task<ApiResponse<ChecklistItemDto>> AddChecklistItemAsync(int taskId, CreateChecklistItemDto dto, int userId);
        Task<ApiResponse<ChecklistItemDto>> ToggleChecklistItemAsync(int taskId, int itemId, bool isCompleted, int userId);
        Task<ApiResponse<ChecklistItemDto>> UpdateChecklistItemAsync(int taskId, int itemId, UpdateChecklistItemDto dto, int userId);
        Task<ApiResponse<bool>> DeleteChecklistItemAsync(int taskId, int itemId, int userId);
        Task<ApiResponse<bool>> MarkAllChecklistCompleteAsync(int taskId, int userId);
        Task<ApiResponse<List<TaskCommentDto>>> GetCommentsAsync(int taskId, int? userId, DateTime? from, DateTime? to, CancellationToken ct = default);
        Task<ApiResponse<TaskDto>> SetTaskBlockAsync(int taskId, SetTaskBlockDto dto, int requesterId);
        Task<ApiResponse<List<TaskBlockEntryDto>>> GetTaskBlockEntriesAsync(int taskId, CancellationToken ct = default);
        Task<TaskEntity?> GetTaskEntityAsync(int taskId);
        Task<bool> IsPreviousAssigneeAsync(int taskId, int userId);
    }

    public class TaskService : ITaskService
    {
        private readonly PMSDbContext _context;
        private readonly IMapper _mapper;
        private readonly INotificationService _notifications;

        public TaskService(PMSDbContext context, IMapper mapper, INotificationService notifications)
        {
            _context = context;
            _mapper = mapper;
            _notifications = notifications;
        }

        public async Task<ApiResponse<List<TaskDto>>> GetAllTasksAsync(string? status, string? priority, int? projectId, int? assigneeId = null, int page = 1, int pageSize = 100, CancellationToken ct = default)
        {
            // Lightweight base query for filter predicates — no includes, used for COUNT
            var baseQuery = _context.Tasks.AsQueryable();

            if (!string.IsNullOrEmpty(status))
                baseQuery = baseQuery.Where(t => t.Status == status);
            if (!string.IsNullOrEmpty(priority))
                baseQuery = baseQuery.Where(t => t.Priority == priority);
            if (projectId.HasValue)
                baseQuery = baseQuery.Where(t => t.ProjectId == projectId.Value);
            if (assigneeId.HasValue)
                baseQuery = baseQuery.Where(t => t.AssignedToId == assigneeId.Value);

            pageSize = Math.Clamp(pageSize, 1, 500);
            page     = Math.Max(1, page);

            var totalCount = await baseQuery.CountAsync(ct);
            var totalPages = totalCount == 0 ? 1 : (int)Math.Ceiling((double)totalCount / pageSize);

            // Full query with eager loads — scoped to requested page
            var tasks = await baseQuery
                .Include(t => t.Project)
                .Include(t => t.AssignedTo)
                .Include(t => t.CreatedBy)
                .Include(t => t.Tags)
                .Include(t => t.Comments).ThenInclude(c => c.User)
                .Include(t => t.ChecklistItems)
                .Include(t => t.BlockEntries).ThenInclude(b => b.BlockedBy)
                .AsSplitQuery()
                .OrderByDescending(t => t.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(ct);

            // Subtask counts per parent — one grouped query so the count is accurate
            // regardless of which tasks are visible to the current viewer.
            var taskIds = tasks.Select(t => t.Id).ToList();
            var childCounts = await _context.Tasks
                .Where(t => t.ParentTaskId.HasValue && taskIds.Contains(t.ParentTaskId.Value))
                .GroupBy(t => t.ParentTaskId!.Value)
                .Select(g => new { ParentId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.ParentId, x => x.Count, ct);

            var dtos = tasks.Select(t =>
            {
                var dto = _mapper.Map<TaskDto>(t);
                dto.ChecklistItems = _mapper.Map<List<ChecklistItemDto>>(
                    t.ChecklistItems.OrderBy(c => c.OrderIndex).ToList());
                dto.ChildTaskCount = childCounts.TryGetValue(t.Id, out var cc) ? cc : 0;
                // Blocked = any active block entry exists (assignee, admin, or owner may have blocked)
                dto.IsBlocked = t.BlockEntries.Any(b => b.IsActive);
                dto.BlockEntries = t.BlockEntries
                    .OrderByDescending(b => b.BlockedAt)
                    .Select(b => new TaskBlockEntryDto
                    {
                        Id = b.Id, TaskId = b.TaskId, BlockedById = b.BlockedById,
                        BlockedByName = b.BlockedBy?.FullName ?? b.BlockedByName,
                        Reason = b.Reason, IsActive = b.IsActive,
                        BlockedAt = b.BlockedAt, ResolvedAt = b.ResolvedAt
                    }).ToList();
                return dto;
            }).ToList();

            return new ApiResponse<List<TaskDto>>
            {
                Success    = true,
                Data       = dtos,
                TotalCount = totalCount,
                Page       = page,
                PageSize   = pageSize,
                TotalPages = totalPages,
            };
        }

        public async Task<ApiResponse<TaskDto>> GetTaskByIdAsync(int id, CancellationToken ct = default)
        {
            var task = await _context.Tasks
                .Include(t => t.Project)
                .Include(t => t.AssignedTo)
                .Include(t => t.CreatedBy)
                .Include(t => t.StartedBy)
                .Include(t => t.QaAssignee)
                .Include(t => t.ParentTask)
                .Include(t => t.ChildTasks).ThenInclude(c => c.AssignedTo)
                .Include(t => t.Tags)
                .Include(t => t.Comments).ThenInclude(c => c.User)
                .Include(t => t.ChecklistItems).ThenInclude(ci => ci.CompletedBy)
                .Include(t => t.AssignmentHistory).ThenInclude(h => h.PreviousAssignee)
                .Include(t => t.AssignmentHistory).ThenInclude(h => h.NewAssignee)
                .Include(t => t.AssignmentHistory).ThenInclude(h => h.ChangedBy)
                .Include(t => t.BlockEntries).ThenInclude(b => b.BlockedBy)
                .AsSplitQuery()
                .FirstOrDefaultAsync(t => t.Id == id, ct);

            if (task == null)
                return new ApiResponse<TaskDto> { Success = false, Message = "Task not found" };

            var dto = _mapper.Map<TaskDto>(task);

            dto.ChecklistItems = _mapper.Map<List<ChecklistItemDto>>(
                task.ChecklistItems.OrderBy(c => c.OrderIndex).ToList());

            dto.AssignmentHistory = task.AssignmentHistory
                .OrderByDescending(h => h.ChangedAt)
                .Select(h => new TaskAssignmentHistoryDto
                {
                    Id = h.Id,
                    TaskId = h.TaskId,
                    PreviousAssigneeId = h.PreviousAssigneeId,
                    PreviousAssigneeName = h.PreviousAssignee?.FullName,
                    NewAssigneeId = h.NewAssigneeId,
                    NewAssigneeName = h.NewAssignee?.FullName,
                    ChangedById = h.ChangedById,
                    ChangedByName = h.ChangedBy?.FullName ?? string.Empty,
                    ChangedAt = h.ChangedAt,
                    ReasonTag = h.ReasonTag
                }).ToList();

            dto.BlockEntries = task.BlockEntries
                .OrderByDescending(b => b.BlockedAt)
                .Select(b => new TaskBlockEntryDto
                {
                    Id = b.Id,
                    TaskId = b.TaskId,
                    BlockedById = b.BlockedById,
                    BlockedByName = b.BlockedBy?.FullName ?? b.BlockedByName,
                    Reason = b.Reason,
                    IsActive = b.IsActive,
                    BlockedAt = b.BlockedAt,
                    ResolvedAt = b.ResolvedAt
                }).ToList();

            // Blocked = any active block entry exists (assignee, admin, or owner may have blocked)
            dto.IsBlocked = task.BlockEntries.Any(b => b.IsActive);
            dto.ChildTaskCount = task.ChildTasks.Count;

            return new ApiResponse<TaskDto> { Success = true, Data = dto };
        }

        public async Task<ApiResponse<TaskDto>> CreateTaskAsync(CreateTaskDto createTaskDto, int creatorId)
        {
            // Every task must have a positive estimate.
            if (!createTaskDto.EstimatedHours.HasValue || createTaskDto.EstimatedHours.Value <= 0)
                return new ApiResponse<TaskDto> { Success = false, Message = "Estimated hours are required and must be greater than zero." };

            TaskEntity? parent = null;
            if (createTaskDto.ParentTaskId.HasValue)
            {
                parent = await _context.Tasks.FindAsync(createTaskDto.ParentTaskId.Value);
                if (parent == null)
                    return new ApiResponse<TaskDto> { Success = false, Message = "Parent task not found" };
                if (parent.ProjectId != createTaskDto.ProjectId)
                    return new ApiResponse<TaskDto> { Success = false, Message = "Parent task must be in the same project" };
            }

            var task = _mapper.Map<TaskEntity>(createTaskDto);
            task.CreatedById = creatorId;
            task.CreatedAt = AppClock.Now;

            // Generate hierarchy code: SUB-PP-TT-SS for subtasks, TSK-PP-TT for top-level tasks
            var (seq, code) = parent != null
                ? await CodeGenerator.NextSubtaskCodeAsync(_context, parent)
                : await CodeGenerator.NextTaskCodeAsync(_context, createTaskDto.ProjectId);
            task.SeqNumber = seq;
            task.Code = code;

            if (createTaskDto.Tags != null)
            {
                task.Tags = createTaskDto.Tags.Select(tag => new TaskTag { Tag = tag }).ToList();
            }

            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();

            return await GetTaskByIdAsync(task.Id);
        }

        public async Task<ApiResponse<TaskDto>> UpdateTaskAsync(int id, CreateTaskDto updateTaskDto, int userId)
        {
            // Every task must keep a positive estimate.
            if (!updateTaskDto.EstimatedHours.HasValue || updateTaskDto.EstimatedHours.Value <= 0)
                return new ApiResponse<TaskDto> { Success = false, Message = "Estimated hours are required and must be greater than zero." };

            var task = await _context.Tasks.Include(t => t.Tags).Include(t => t.Project).FirstOrDefaultAsync(t => t.Id == id);
            if (task == null)
                return new ApiResponse<TaskDto> { Success = false, Message = "Task not found" };

            // Status is NOT changed via the generic update — it flows only through ChangeStatusAsync
            // so the transition/role/checklist rules are always enforced. Preserve the current value.
            // Codes are immutable / system-generated — preserve them too.
            var preservedStatus = task.Status;
            var preservedStartedAt = task.StartedAt;
            var preservedStartedById = task.StartedById;
            var preservedCode = task.Code;
            var preservedSeq = task.SeqNumber;

            _mapper.Map(updateTaskDto, task);
            task.Status = preservedStatus;
            task.StartedAt = preservedStartedAt;
            task.StartedById = preservedStartedById;
            task.Code = preservedCode;
            task.SeqNumber = preservedSeq;
            task.UpdatedAt = AppClock.Now;

            if (updateTaskDto.Tags != null)
            {
                _context.TaskTags.RemoveRange(task.Tags);
                task.Tags = updateTaskDto.Tags.Select(tag => new TaskTag { Tag = tag }).ToList();
            }

            await _context.SaveChangesAsync();
            return await GetTaskByIdAsync(id);
        }

        private static readonly HashSet<string> ValidStatuses = new(StringComparer.OrdinalIgnoreCase)
        {
            "new", "in-progress", "paused", "blocked", "under-review", "issues", "completed"
        };

        // Allowed status edges (from -> set of reachable to). Mirrors TASK_WORKFLOW.md.
        private static readonly Dictionary<string, HashSet<string>> AllowedEdges = new(StringComparer.OrdinalIgnoreCase)
        {
            // "completed" reachable directly from any active stage (Complete option), plus the review path.
            ["new"]          = new(StringComparer.OrdinalIgnoreCase) { "in-progress", "completed" },
            ["in-progress"]  = new(StringComparer.OrdinalIgnoreCase) { "paused", "blocked", "under-review", "completed" },
            ["paused"]       = new(StringComparer.OrdinalIgnoreCase) { "in-progress", "completed" },
            ["blocked"]      = new(StringComparer.OrdinalIgnoreCase) { "in-progress", "completed" },
            ["under-review"] = new(StringComparer.OrdinalIgnoreCase) { "issues", "in-progress", "completed" },
            ["issues"]       = new(StringComparer.OrdinalIgnoreCase) { "in-progress", "completed" },
            ["completed"]    = new(StringComparer.OrdinalIgnoreCase) { "in-progress" }, // reopen (manager only)
        };

        // Statuses for which ActualHours is NOT required when entered.
        // Every working/parking status (in-progress, paused, blocked, under-review, issues, completed)
        // requires ActualHours; only the initial "new" state is exempt.
        private static readonly HashSet<string> ActualHoursExemptStatuses =
            new(StringComparer.OrdinalIgnoreCase) { "new" };

        // Returns null when transition is allowed, error message otherwise.
        // isAdmin bypasses role gates (still subject to edge + checklist + reason rules).
        private string? ValidateStatusTransition(TaskEntity task, string from, string to, int userId, bool isAdmin, string? reason, decimal? actualHours, bool requireActualHours)
        {
            if (!ValidStatuses.Contains(to))
                return $"Invalid status '{to}'. Allowed: {string.Join(", ", ValidStatuses)}";

            if (!AllowedEdges.TryGetValue(from, out var targets) || !targets.Contains(to))
                return $"Cannot move a task from '{from}' to '{to}'.";

            // Actual hours are compulsory when entering any status except the initial "new".
            if (requireActualHours && !ActualHoursExemptStatuses.Contains(to)
                && (!actualHours.HasValue || actualHours.Value <= 0))
                return $"Actual hours are required when moving a task to '{to}'.";

            var isAssignee = task.AssignedToId == userId;
            var isManager = isAdmin
                || task.CreatedById == userId
                || (task.Project != null && (task.Project.OwnerId == userId || task.Project.CreatedById == userId));
            var isQa = task.QaAssigneeId.HasValue && task.QaAssigneeId.Value == userId;

            // A task with an active block cannot change status — only an admin may override.
            // (Unblock via the Block Status panel, then change status normally.)
            if (!isAdmin && task.BlockEntries.Any(b => b.IsActive))
                return "This task is blocked. It must be unblocked before its status can be changed.";

            // Blocking requires a reason
            if (to.Equals("blocked", StringComparison.OrdinalIgnoreCase) && string.IsNullOrWhiteSpace(reason))
                return "A blocking reason is required to block a task.";

            // Submitting for review requires 100% checklist
            if (to.Equals("under-review", StringComparison.OrdinalIgnoreCase) && task.Progress < 100)
                return "Complete all checklist items before submitting for review.";

            // Completing requires 100% checklist (only enforced when the task has checklist items)
            if (to.Equals("completed", StringComparison.OrdinalIgnoreCase)
                && task.ChecklistItems.Count > 0 && task.Progress < 100)
                return "Complete all checklist items before completing the task.";

            // Role gates per target
            switch (to.ToLowerInvariant())
            {
                case "completed":
                    if (from.Equals("under-review", StringComparison.OrdinalIgnoreCase))
                    {
                        // Approval from review: QA passes (if RequiresQA) or manager approves
                        if (task.RequiresQA)
                        {
                            if (!isQa && !isManager)
                                return "Only the assigned QA reviewer can pass this task.";
                        }
                        else if (!isManager)
                        {
                            return "Only the task creator or project owner can complete this task.";
                        }
                    }
                    else
                    {
                        // Direct complete from an active stage: assignee or manager/admin
                        if (!isAssignee && !isManager)
                            return "Only the assignee, task creator, or project owner can complete this task.";
                    }
                    break;

                case "issues":
                    // QA fails or manager requests changes
                    if (!isManager && !isQa)
                        return "Only the manager or QA reviewer can send a task back with issues.";
                    break;

                case "under-review":
                    if (!isAssignee && !isManager)
                        return "Only the assignee can submit work for review.";
                    break;

                case "in-progress":
                    // resume / reopen / kickback — assignee (resume), manager (reopen/kickback)
                    if (from.Equals("completed", StringComparison.OrdinalIgnoreCase) && !isManager)
                        return "Only the manager can reopen a completed task.";
                    if (from.Equals("under-review", StringComparison.OrdinalIgnoreCase) && !isManager)
                        return "Only the manager can send a task back from review.";
                    if (!isAssignee && !isManager)
                        return "Only the assignee or manager can change this task's status.";
                    break;

                default: // paused, blocked
                    if (!isAssignee && !isManager)
                        return "Only the assignee or manager can change this task's status.";
                    break;
            }

            return null;
        }

        public async Task<ApiResponse<bool>> DeleteTaskAsync(int id)
        {
            var task = await _context.Tasks
                .Include(t => t.Tags)
                .Include(t => t.Comments)
                .Include(t => t.Attachments)
                .Include(t => t.ChecklistItems)
                .Include(t => t.AssignmentHistory)
                .Include(t => t.ChildTasks)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task == null)
                return new ApiResponse<bool> { Success = false, Message = "Task not found" };

            if (task.ChildTasks.Any())
                return new ApiResponse<bool> { Success = false, Message = "Cannot delete a task that has linked tasks. Remove or relink the child tasks first." };

            _context.ChecklistItems.RemoveRange(task.ChecklistItems);
            _context.TaskAssignmentHistories.RemoveRange(task.AssignmentHistory);
            _context.TaskTags.RemoveRange(task.Tags);
            _context.TaskComments.RemoveRange(task.Comments);
            _context.Attachments.RemoveRange(task.Attachments);
            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();

            return new ApiResponse<bool> { Success = true, Data = true };
        }

        public async Task<ApiResponse<DashboardStatsDto>> GetDashboardStatsAsync(CancellationToken ct = default)
        {
            // P4-E: run all count queries in parallel
            var projectCountTask   = _context.Projects.CountAsync(ct);
            var taskCountTask      = _context.Tasks.CountAsync(ct);
            var activeUsersTask    = _context.Users.CountAsync(u => u.IsActive, ct);
            var completedCountTask = _context.Tasks.CountAsync(t => t.Status == "completed", ct);
            var byStatusTask       = _context.Tasks
                .GroupBy(t => t.Status)
                .Select(g => new StatusCountDto { Status = g.Key, Count = g.Count() })
                .ToListAsync(ct);

            await Task.WhenAll(projectCountTask, taskCountTask, activeUsersTask, completedCountTask, byStatusTask);

            return new ApiResponse<DashboardStatsDto>
            {
                Success = true,
                Data = new DashboardStatsDto
                {
                    TotalProjects  = projectCountTask.Result,
                    TotalTasks     = taskCountTask.Result,
                    ActiveUsers    = activeUsersTask.Result,
                    CompletedTasks = completedCountTask.Result,
                    TasksByStatus  = byStatusTask.Result
                }
            };
        }

        public async Task<ApiResponse<TaskDto>> AssignTaskAsync(int taskId, int? assigneeId)
        {
            var task = await _context.Tasks.FindAsync(taskId);
            if (task == null)
                return new ApiResponse<TaskDto> { Success = false, Message = "Task not found" };

            var previousAssigneeId = task.AssignedToId;
            task.AssignedToId = assigneeId;
            task.UpdatedAt = AppClock.Now;

            // P2-E: record initial assignment for audit trail
            _context.TaskAssignmentHistories.Add(new TaskAssignmentHistory
            {
                TaskId = taskId,
                PreviousAssigneeId = previousAssigneeId,
                NewAssigneeId = assigneeId,
                ChangedById = task.CreatedById,
                ChangedAt = AppClock.Now,
                ReasonTag = "initial-assignment"
            });

            await _context.SaveChangesAsync();

            return await GetTaskByIdAsync(taskId);
        }

        public async Task<ApiResponse<TaskCommentDto>> AddCommentAsync(int taskId, CreateTaskCommentDto dto, int userId)
        {
            var task = await _context.Tasks.FindAsync(taskId);
            if (task == null)
                return new ApiResponse<TaskCommentDto> { Success = false, Message = "Task not found" };

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return new ApiResponse<TaskCommentDto> { Success = false, Message = "User not found" };

            var comment = new TaskComment
            {
                TaskId    = taskId,
                UserId    = userId,
                Content   = dto.Text,
                CreatedAt = AppClock.Now,
            };

            _context.TaskComments.Add(comment);
            await _context.SaveChangesAsync();

            return new ApiResponse<TaskCommentDto>
            {
                Success = true,
                Data = new TaskCommentDto
                {
                    Id        = comment.Id,
                    TaskId    = taskId,
                    UserId    = userId,
                    UserName  = user.FullName,
                    AvatarUrl = user.AvatarUrl,
                    Text      = comment.Content,
                    Timestamp = comment.CreatedAt,
                }
            };
        }

        public async Task<ApiResponse<TaskDto>> ReassignTaskAsync(int taskId, ReassignTaskDto dto, int changedById)
        {
            if (!ReasonTags.Valid.Contains(dto.ReasonTag))
                return new ApiResponse<TaskDto> { Success = false, Message = "Invalid reason tag. Must be one of: " + string.Join(", ", ReasonTags.Valid) };

            var task = await _context.Tasks
                .Include(t => t.Project)
                .Include(t => t.BlockEntries)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null)
                return new ApiResponse<TaskDto> { Success = false, Message = "Task not found" };

            if (task.Status == "completed")
                return new ApiResponse<TaskDto> { Success = false, Message = "Cannot reassign a completed task. Move it to In Progress first." };

            var isProjectOwnerOrCreator = task.Project != null &&
                (task.Project.OwnerId == changedById || task.Project.CreatedById == changedById);
            var isAdmin = await IsUserAdminAsync(changedById);
            if (task.CreatedById != changedById && !isProjectOwnerOrCreator && !isAdmin)
                return new ApiResponse<TaskDto> { Success = false, Message = "Only the task creator, project owner, or an admin can reassign this task" };

            var previousAssigneeId = task.AssignedToId;

            await using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                // Auto-resolve any active block entries when reassigning
                var activeBlocks = task.BlockEntries.Where(b => b.IsActive).ToList();
                foreach (var block in activeBlocks)
                {
                    block.IsActive = false;
                    block.ResolvedAt = AppClock.Now;
                }

                // P2-B: If the task was sitting in the Blocked column, record the auto-transition
                if (task.Status == "blocked")
                {
                    var resumeStatus = task.StartedAt == null ? "new" : "in-progress";
                    _context.TaskStatusHistories.Add(new TaskStatusHistory
                    {
                        TaskId = taskId, FromStatus = task.Status, ToStatus = resumeStatus,
                        ChangedById = changedById, Reason = $"Auto-resolved on reassign. Reason: {dto.ReasonTag}",
                        ChangedAt = AppClock.Now
                    });
                    task.Status = resumeStatus;
                }

                _context.TaskAssignmentHistories.Add(new TaskAssignmentHistory
                {
                    TaskId = taskId,
                    PreviousAssigneeId = previousAssigneeId,
                    NewAssigneeId = dto.NewAssigneeId,
                    ChangedById = changedById,
                    ChangedAt = AppClock.Now,
                    ReasonTag = dto.ReasonTag
                });

                task.AssignedToId = dto.NewAssigneeId;
                task.UpdatedAt = AppClock.Now;

                var changer = await _context.Users.FindAsync(changedById);
                var newAssignee = dto.NewAssigneeId.HasValue
                    ? await _context.Users.FindAsync(dto.NewAssigneeId.Value)
                    : null;

                _context.Activities.Add(new Activity
                {
                    UserId = changedById,
                    UserName = changer?.FullName ?? "Unknown",
                    Action = $"reassigned task to {newAssignee?.FullName ?? "Unassigned"}. Reason: {dto.ReasonTag}",
                    TargetType = "task",
                    TargetId = taskId,
                    TargetName = task.Title,
                    Timestamp = AppClock.Now
                });

                await _context.SaveChangesAsync();
                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

            return await GetTaskByIdAsync(taskId);
        }

        public async Task<ApiResponse<TaskDto>> StartTaskAsync(int taskId, int userId)
        {
            var task = await _context.Tasks.FindAsync(taskId);
            if (task == null)
                return new ApiResponse<TaskDto> { Success = false, Message = "Task not found" };
            if (task.AssignedToId != userId)
                return new ApiResponse<TaskDto> { Success = false, Message = "Only the assignee can start this task" };
            if (task.StartedAt != null)
                return new ApiResponse<TaskDto> { Success = false, Message = "Task already started" };
            if (task.Status == "completed")
                return new ApiResponse<TaskDto> { Success = false, Message = "Cannot start a completed task" };

            var fromStatus = task.Status;
            task.StartedAt = AppClock.Now;
            task.StartedById = userId;
            task.Status = "in-progress";
            task.UpdatedAt = AppClock.Now;

            var user = await _context.Users.FindAsync(userId);
            _context.Activities.Add(new Activity
            {
                UserId = userId,
                UserName = user?.FullName ?? "Unknown",
                Action = $"started task '{task.Title}'",
                TargetType = "task",
                TargetId = taskId,
                TargetName = task.Title,
                Timestamp = AppClock.Now
            });
            _context.TaskStatusHistories.Add(new TaskStatusHistory
            {
                TaskId = taskId,
                FromStatus = fromStatus,
                ToStatus = "in-progress",
                ChangedById = userId,
                ChangedAt = AppClock.Now
            });
            await _context.SaveChangesAsync();

            return await GetTaskByIdAsync(taskId);
        }

        public async Task<ApiResponse<TaskDto>> ChangeStatusAsync(int taskId, ChangeStatusDto dto, int userId, bool isAdmin, bool requireActualHours = true)
        {
            var task = await _context.Tasks
                .Include(t => t.Project)
                .Include(t => t.ChecklistItems)
                .Include(t => t.BlockEntries)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null)
                return new ApiResponse<TaskDto> { Success = false, Message = "Task not found" };

            var from = task.Status;
            var to = (dto.ToStatus ?? string.Empty).Trim();

            if (string.Equals(from, to, StringComparison.OrdinalIgnoreCase))
                return await GetTaskByIdAsync(taskId); // no-op

            var err = ValidateStatusTransition(task, from, to, userId, isAdmin, dto.Reason, dto.ActualHours, requireActualHours);
            if (err != null)
            {
                // "Only …" messages are authorization failures; the rest are validation failures.
                var code = err.StartsWith("Only", StringComparison.OrdinalIgnoreCase) ? "FORBIDDEN" : null;
                return new ApiResponse<TaskDto> { Success = false, Message = err, ErrorCode = code };
            }

            task.Status = to;
            task.UpdatedAt = AppClock.Now;
            // First time work starts, stamp StartedAt
            if (to.Equals("in-progress", StringComparison.OrdinalIgnoreCase) && task.StartedAt == null)
            {
                task.StartedAt = AppClock.Now;
                task.StartedById = userId;
            }

            // Block reason lifecycle reuses TaskBlockEntry
            if (to.Equals("blocked", StringComparison.OrdinalIgnoreCase) && task.AssignedToId.HasValue)
            {
                var existing = task.BlockEntries.FirstOrDefault(b => b.IsActive && b.BlockedById == task.AssignedToId.Value);
                if (existing == null)
                {
                    var blocker = await _context.Users.FindAsync(task.AssignedToId.Value);
                    _context.TaskBlockEntries.Add(new TaskBlockEntry
                    {
                        TaskId = taskId,
                        BlockedById = task.AssignedToId.Value,
                        BlockedByName = blocker?.FullName ?? "Unknown",
                        Reason = dto.Reason ?? string.Empty,
                        IsActive = true,
                        BlockedAt = AppClock.Now
                    });
                }
            }
            // Leaving blocked → resolve active blocks
            if (from.Equals("blocked", StringComparison.OrdinalIgnoreCase))
            {
                foreach (var b in task.BlockEntries.Where(b => b.IsActive))
                {
                    b.IsActive = false;
                    b.ResolvedAt = AppClock.Now;
                }
            }

            var actor = await _context.Users.FindAsync(userId);
            _context.TaskStatusHistories.Add(new TaskStatusHistory
            {
                TaskId = taskId,
                FromStatus = from,
                ToStatus = to,
                ChangedById = userId,
                Reason = dto.Reason,
                ActualHours = ActualHoursExemptStatuses.Contains(to) ? null : dto.ActualHours,
                ChangedAt = AppClock.Now
            });
            _context.Activities.Add(new Activity
            {
                UserId = userId,
                UserName = actor?.FullName ?? "Unknown",
                Action = $"changed status '{from}' → '{to}'" + (string.IsNullOrWhiteSpace(dto.Reason) ? "" : $". {dto.Reason}"),
                TargetType = "task",
                TargetId = taskId,
                TargetName = task.Title,
                Timestamp = AppClock.Now
            });
            await _context.SaveChangesAsync();

            await SendStatusNotificationsAsync(task, from, to, dto.Reason);

            return await GetTaskByIdAsync(taskId);
        }

        // Decide who hears about a transition and push in-app notifications.
        private async Task SendStatusNotificationsAsync(TaskEntity task, string from, string to, string? reason)
        {
            var recipients = new List<int>();
            void addManagers()
            {
                recipients.Add(task.CreatedById);
                if (task.Project != null) { recipients.Add(task.Project.OwnerId); recipients.Add(task.Project.CreatedById); }
            }

            switch (to.ToLowerInvariant())
            {
                case "under-review":
                    addManagers();
                    if (task.RequiresQA && task.QaAssigneeId.HasValue) recipients.Add(task.QaAssigneeId.Value);
                    break;
                case "issues":
                    if (task.AssignedToId.HasValue) recipients.Add(task.AssignedToId.Value);
                    break;
                case "completed":
                    if (task.AssignedToId.HasValue) recipients.Add(task.AssignedToId.Value);
                    addManagers();
                    break;
                case "blocked":
                    addManagers();
                    break;
                case "in-progress":
                    if (from.Equals("completed", StringComparison.OrdinalIgnoreCase) && task.AssignedToId.HasValue)
                        recipients.Add(task.AssignedToId.Value);
                    break;
            }

            recipients.RemoveAll(id => id <= 0);
            if (recipients.Count == 0) return;

            var body = $"\"{task.Title}\": {from} → {to}" + (string.IsNullOrWhiteSpace(reason) ? "" : $" — {reason}");
            await _notifications.NotifyUsersAsync(recipients, new NotificationDto
            {
                Title = "Task status updated",
                Body = body,
                Type = "task",
                TaskId = task.Id
            });
        }

        public async Task<ApiResponse<List<TaskStatusHistoryDto>>> GetStatusHistoryAsync(int taskId, CancellationToken ct = default)
        {
            var history = await _context.TaskStatusHistories
                .Where(h => h.TaskId == taskId)
                .Include(h => h.ChangedBy)
                .OrderByDescending(h => h.ChangedAt)
                .ToListAsync(ct);

            var dtos = history.Select(h => new TaskStatusHistoryDto
            {
                Id = h.Id,
                TaskId = h.TaskId,
                FromStatus = h.FromStatus,
                ToStatus = h.ToStatus,
                ChangedById = h.ChangedById,
                ChangedByName = h.ChangedBy?.FullName,
                Reason = h.Reason,
                ActualHours = h.ActualHours,
                ChangedAt = h.ChangedAt
            }).ToList();

            return new ApiResponse<List<TaskStatusHistoryDto>> { Success = true, Data = dtos };
        }

        // ── Effort time tracking (derived from status + assignment history) ──────
        // Productive = time in "in-progress". Non-productive (excluded but reported):
        // "paused", "blocked", "under-review". "new"/"issues"/unknown = "other".
        private static bool IsProductiveStatus(string status) => EffortHelpers.IsProductiveStatus(status);

        public async Task<ApiResponse<TaskEffortDto>> GetTaskEffortAsync(int taskId, CancellationToken ct = default)
        {
            var task = await _context.Tasks
                .FirstOrDefaultAsync(t => t.Id == taskId, ct);
            if (task == null)
                return new ApiResponse<TaskEffortDto> { Success = false, Message = "Task not found" };

            var statusRows = await _context.TaskStatusHistories
                .Where(h => h.TaskId == taskId)
                .OrderBy(h => h.ChangedAt)
                .ToListAsync(ct);

            var assignRows = await _context.TaskAssignmentHistories
                .Where(h => h.TaskId == taskId)
                .OrderBy(h => h.ChangedAt)
                .ToListAsync(ct);

            // Single name lookup for every user referenced (no N+1).
            var userIds = new HashSet<int>();
            if (task.AssignedToId.HasValue) userIds.Add(task.AssignedToId.Value);
            foreach (var r in assignRows)
            {
                if (r.PreviousAssigneeId.HasValue) userIds.Add(r.PreviousAssigneeId.Value);
                if (r.NewAssigneeId.HasValue) userIds.Add(r.NewAssigneeId.Value);
            }
            var userNames = await _context.Users
                .Where(u => userIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id, u => u.FullName, ct);

            var effort = ComputeEffort(task.CreatedAt, task.Status, statusRows, assignRows,
                task.AssignedToId, userNames, AppClock.Now);

            return new ApiResponse<TaskEffortDto> { Success = true, Data = effort };
        }

        // Org-wide effort summary for the dashboard, clipped to an optional [fromUtc, toUtc) window.
        // Working = productive (in-progress) + paused. Live snapshot counts use current task status.
        public async Task<ApiResponse<DashboardEffortDto>> GetEffortStatsAsync(DateTime? fromUtc, DateTime? toUtc, CancellationToken ct = default)
        {
            var now = AppClock.Now;
            var winStart = fromUtc ?? DateTime.MinValue;
            var winEnd = toUtc ?? now;

            // Pull only what we need for every task, in three bulk queries (no N+1).
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

            long totalProductive = 0, totalPaused = 0;
            var perUserProductive = new Dictionary<int, long>();
            var perUserPaused = new Dictionary<int, long>();
            var empty = new List<TaskStatusHistory>();
            var emptyAssign = new List<TaskAssignmentHistory>();

            foreach (var t in tasks)
            {
                var statusRows = statusByTask.TryGetValue(t.Id, out var sr) ? sr : empty;
                var assignRows = assignByTask.TryGetValue(t.Id, out var ar) ? ar : emptyAssign;

                // Build status segments for this task (same shape as the per-task view).
                var segments = BuildStatusSegments(t.CreatedAt, t.Status, statusRows, now);
                if (segments.Count == 0) continue;

                var windows = BuildAssignmentWindows(t.CreatedAt, assignRows, t.AssignedToId, now);

                foreach (var s in segments)
                {
                    var isProd = IsProductiveStatus(s.Status);
                    var isPaused = string.Equals(s.Status, "paused", StringComparison.OrdinalIgnoreCase);
                    if (!isProd && !isPaused) continue;

                    // Clip segment to the requested date window, then filter to working hours.
                    var segWinStart = s.StartAt > winStart ? s.StartAt : winStart;
                    var segWinEnd   = s.EndAt   < winEnd   ? s.EndAt   : winEnd;
                    if (segWinEnd <= segWinStart) continue;
                    var clip = EffortHelpers.WorkingOverlap(segWinStart, segWinEnd);
                    if (clip <= 0) continue;

                    if (isProd) totalProductive += clip; else totalPaused += clip;

                    // Attribute to whichever assignee held the task during the overlapping slice.
                    foreach (var w in windows)
                    {
                        if (w.UserId == 0) continue;
                        var intStart = segWinStart > w.Start ? segWinStart : w.Start;
                        var intEnd   = segWinEnd   < w.End   ? segWinEnd   : w.End;
                        if (intEnd <= intStart) continue;
                        var ov = EffortHelpers.WorkingOverlap(intStart, intEnd);
                        if (ov <= 0) continue;
                        var map = isProd ? perUserProductive : perUserPaused;
                        map.TryGetValue(w.UserId, out var acc);
                        map[w.UserId] = acc + ov;
                    }
                }
            }

            // Live snapshot from current task status (not windowed).
            var workingUserIds = tasks
                .Where(t => t.AssignedToId.HasValue && string.Equals(t.Status, "in-progress", StringComparison.OrdinalIgnoreCase))
                .Select(t => t.AssignedToId!.Value).Distinct().ToHashSet();
            var pauseReviewUserIds = tasks
                .Where(t => t.AssignedToId.HasValue &&
                    (string.Equals(t.Status, "paused", StringComparison.OrdinalIgnoreCase)
                     || string.Equals(t.Status, "under-review", StringComparison.OrdinalIgnoreCase)
                     || string.Equals(t.Status, "blocked", StringComparison.OrdinalIgnoreCase)))
                .Select(t => t.AssignedToId!.Value).Distinct().ToHashSet();

            // Names + avatars for the top-users list.
            var topIds = perUserProductive.OrderByDescending(kv => kv.Value).Take(5).Select(kv => kv.Key).ToList();
            var userInfo = await _context.Users
                .Where(u => topIds.Contains(u.Id))
                .Select(u => new { u.Id, u.FullName, u.AvatarUrl })
                .ToDictionaryAsync(u => u.Id, u => new { u.FullName, u.AvatarUrl });

            var topUsers = perUserProductive
                .OrderByDescending(kv => kv.Value)
                .Take(5)
                .Select(kv => new TopUserEffortDto
                {
                    UserId = kv.Key,
                    UserName = userInfo.TryGetValue(kv.Key, out var info) ? info.FullName : $"User #{kv.Key}",
                    AvatarUrl = userInfo.TryGetValue(kv.Key, out var info2) ? info2.AvatarUrl : null,
                    ProductiveSeconds = kv.Value,
                    PausedSeconds = perUserPaused.TryGetValue(kv.Key, out var p) ? p : 0
                })
                .ToList();

            var dto = new DashboardEffortDto
            {
                FromUtc = fromUtc,
                ToUtc = toUtc,
                TotalActiveUsers = await _context.Users.CountAsync(u => u.IsActive, ct),
                ProductiveSeconds = totalProductive,
                PausedSeconds = totalPaused,
                WorkingSeconds = totalProductive + totalPaused,
                UsersCurrentlyWorking = workingUserIds.Count,
                UsersInPauseReview = pauseReviewUserIds.Count,
                TopProductiveUsers = topUsers
            };

            return new ApiResponse<DashboardEffortDto> { Success = true, Data = dto };
        }

        private static List<EffortTimelineSegmentDto> BuildStatusSegments(
            DateTime createdAt, string currentStatus, IReadOnlyList<TaskStatusHistory> statusRows, DateTime now)
            => EffortHelpers.BuildStatusSegments(createdAt, currentStatus, statusRows, now);

        // Pure computation — no DB access. Walks the ordered timelines into segments.
        private static TaskEffortDto ComputeEffort(
            DateTime createdAt,
            string currentStatus,
            IReadOnlyList<TaskStatusHistory> statusRows,
            IReadOnlyList<TaskAssignmentHistory> assignRows,
            int? currentAssigneeId,
            IReadOnlyDictionary<int, string> userNames,
            DateTime now)
        {
            // 1) Build status segments [StartAt, EndAt) tagged with the status held.
            var segments = new List<EffortTimelineSegmentDto>();
            var initialStatus = statusRows.Count > 0 ? statusRows[0].FromStatus : currentStatus;
            var segStart = createdAt;
            var segStatus = initialStatus ?? currentStatus ?? string.Empty;

            void Close(DateTime end, string nextStatus)
            {
                var endClamped = end < segStart ? segStart : end;        // clamp skew
                var seconds = EffortHelpers.WorkingOverlap(segStart, endClamped);
                segments.Add(new EffortTimelineSegmentDto
                {
                    Status = segStatus,
                    StartAt = segStart,
                    EndAt = endClamped,
                    Seconds = seconds,
                    IsProductive = IsProductiveStatus(segStatus)
                });
                segStart = endClamped;
                segStatus = nextStatus ?? string.Empty;
            }

            foreach (var row in statusRows)
                Close(row.ChangedAt, row.ToStatus);

            // Final segment: completed tasks accrue no running tail; otherwise runs to now.
            if (string.Equals(currentStatus, "completed", StringComparison.OrdinalIgnoreCase))
                Close(segStart, currentStatus);  // zero-length close
            else
                Close(now, currentStatus);

            // Drop any zero-length trailing/duplicate segments for a clean timeline,
            // but keep them out of the displayed list only (totals already exclude 0s).
            var timeline = segments.Where(s => s.Seconds > 0).ToList();

            // 2) Group durations by status.
            long productive = 0, paused = 0, blocked = 0, underReview = 0, other = 0;
            var byStatusMap = new Dictionary<string, long>(StringComparer.OrdinalIgnoreCase);
            foreach (var s in segments)
            {
                if (s.Seconds <= 0) continue;
                byStatusMap.TryGetValue(s.Status, out var acc);
                byStatusMap[s.Status] = acc + s.Seconds;
                switch ((s.Status ?? string.Empty).ToLowerInvariant())
                {
                    case "in-progress": productive += s.Seconds; break;
                    case "paused": paused += s.Seconds; break;
                    case "blocked": blocked += s.Seconds; break;
                    case "under-review": underReview += s.Seconds; break;
                    default: other += s.Seconds; break;   // new, issues, unknown
                }
            }
            var byStatus = byStatusMap
                .Select(kv => new StatusDurationDto
                {
                    Status = kv.Key,
                    Seconds = kv.Value,
                    IsProductive = IsProductiveStatus(kv.Key)
                })
                .OrderByDescending(d => d.Seconds)
                .ToList();

            var total = productive + paused + blocked + underReview + other;

            // 3) Per-user attribution via assignment windows ∩ productive/paused segments.
            var windows = BuildAssignmentWindows(createdAt, assignRows, currentAssigneeId, now);
            var byUser = new List<UserEffortDto>();
            foreach (var w in windows.GroupBy(w => w.UserId))
            {
                var uid = w.Key;
                if (uid == 0) continue;  // unassigned periods belong to nobody
                long uProductive = 0, uPaused = 0;
                foreach (var win in w)
                {
                    foreach (var s in segments)
                    {
                        if (s.Seconds <= 0) continue;
                        // Intersect the segment with the assignment window, then filter to working hours.
                        var intStart = s.StartAt > win.Start ? s.StartAt : win.Start;
                        var intEnd   = s.EndAt   < win.End   ? s.EndAt   : win.End;
                        if (intEnd <= intStart) continue;
                        var ov = EffortHelpers.WorkingOverlap(intStart, intEnd);
                        if (ov <= 0) continue;
                        if (IsProductiveStatus(s.Status)) uProductive += ov;
                        else if (string.Equals(s.Status, "paused", StringComparison.OrdinalIgnoreCase)) uPaused += ov;
                    }
                }

                // Metadata for this user.
                DateTime? assignedAt = w.Min(x => x.Start) == createdAt ? createdAt : w.Min(x => x.Start);
                DateTime? firstStarted = segments
                    .Where(s => IsProductiveStatus(s.Status) && w.Any(win => Overlap(s.StartAt, s.EndAt, win.Start, win.End) > 0))
                    .Select(s => (DateTime?)s.StartAt)
                    .DefaultIfEmpty(null)
                    .Min();
                DateTime? completedAt = null;
                if (string.Equals(currentStatus, "completed", StringComparison.OrdinalIgnoreCase)
                    && currentAssigneeId == uid && statusRows.Count > 0)
                {
                    var lastCompleted = statusRows.LastOrDefault(r => string.Equals(r.ToStatus, "completed", StringComparison.OrdinalIgnoreCase));
                    completedAt = lastCompleted?.ChangedAt;
                }

                byUser.Add(new UserEffortDto
                {
                    UserId = uid,
                    UserName = userNames.TryGetValue(uid, out var n) ? n : $"User #{uid}",
                    ProductiveSeconds = uProductive,
                    PausedSeconds = uPaused,
                    AssignedAt = assignedAt,
                    FirstStartedAt = firstStarted,
                    CompletedAt = completedAt
                });
            }
            byUser = byUser.OrderByDescending(u => u.ProductiveSeconds).ToList();

            return new TaskEffortDto
            {
                TotalElapsedSeconds = total,
                ProductiveSeconds = productive,
                PausedSeconds = paused,
                BlockedSeconds = blocked,
                UnderReviewSeconds = underReview,
                OtherSeconds = other,
                IsRunning = IsProductiveStatus(currentStatus),
                ByStatus = byStatus,
                ByUser = byUser,
                Timeline = timeline
            };
        }

        private static List<EffortHelpers.AssignmentWindow> BuildAssignmentWindows(
            DateTime createdAt, IReadOnlyList<TaskAssignmentHistory> assignRows, int? currentAssigneeId, DateTime now)
            => EffortHelpers.BuildAssignmentWindows(createdAt, assignRows, currentAssigneeId, now);

        private static long Overlap(DateTime aStart, DateTime aEnd, DateTime bStart, DateTime bEnd)
            => EffortHelpers.Overlap(aStart, aEnd, bStart, bEnd);

        public async Task<ApiResponse<List<TaskAssignmentHistoryDto>>> GetTaskAssignmentHistoryAsync(int taskId, CancellationToken ct = default)
        {
            var history = await _context.TaskAssignmentHistories
                .Where(h => h.TaskId == taskId)
                .Include(h => h.PreviousAssignee)
                .Include(h => h.NewAssignee)
                .Include(h => h.ChangedBy)
                .OrderByDescending(h => h.ChangedAt)
                .ToListAsync(ct);

            var dtos = history.Select(h => new TaskAssignmentHistoryDto
            {
                Id = h.Id,
                TaskId = h.TaskId,
                PreviousAssigneeId = h.PreviousAssigneeId,
                PreviousAssigneeName = h.PreviousAssignee?.FullName,
                NewAssigneeId = h.NewAssigneeId,
                NewAssigneeName = h.NewAssignee?.FullName,
                ChangedById = h.ChangedById,
                ChangedByName = h.ChangedBy?.FullName ?? string.Empty,
                ChangedAt = h.ChangedAt,
                ReasonTag = h.ReasonTag
            }).ToList();

            return new ApiResponse<List<TaskAssignmentHistoryDto>> { Success = true, Data = dtos };
        }

        public async Task<ApiResponse<ChecklistItemDto>> AddChecklistItemAsync(int taskId, CreateChecklistItemDto dto, int userId)
        {
            var task = await _context.Tasks.FindAsync(taskId);
            if (task == null)
                return new ApiResponse<ChecklistItemDto> { Success = false, Message = "Task not found" };

            await using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                var item = new ChecklistItem
                {
                    TaskId = taskId,
                    Title = dto.Title,
                    IsCompleted = false,
                    OrderIndex = dto.OrderIndex,
                    CreatedAt = AppClock.Now
                };

                _context.ChecklistItems.Add(item);
                await _context.SaveChangesAsync();
                await RecalculateTaskProgressAsync(taskId);

                var user = await _context.Users.FindAsync(userId);
                _context.Activities.Add(new Activity
                {
                    UserId = userId,
                    UserName = user?.FullName ?? "Unknown",
                    Action = $"added checklist item '{dto.Title}'",
                    TargetType = "task",
                    TargetId = taskId,
                    TargetName = task.Title,
                    Timestamp = AppClock.Now
                });
                await _context.SaveChangesAsync();
                await tx.CommitAsync();

                return new ApiResponse<ChecklistItemDto>
                {
                    Success = true,
                    Data = _mapper.Map<ChecklistItemDto>(item)
                };
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }

        public async Task<ApiResponse<ChecklistItemDto>> ToggleChecklistItemAsync(int taskId, int itemId, bool isCompleted, int userId)
        {
            var item = await _context.ChecklistItems
                .Include(c => c.CompletedBy)
                .FirstOrDefaultAsync(c => c.Id == itemId && c.TaskId == taskId);

            if (item == null)
                return new ApiResponse<ChecklistItemDto> { Success = false, Message = "Checklist item not found" };

            var taskForAuth = await _context.Tasks.FindAsync(taskId);
            if (taskForAuth == null)
                return new ApiResponse<ChecklistItemDto> { Success = false, Message = "Task not found" };
            if (taskForAuth.AssignedToId != userId)
                return new ApiResponse<ChecklistItemDto> { Success = false, Message = "No permission: only the current assignee can toggle checklist items" };
            if (taskForAuth.StartedAt == null)
                return new ApiResponse<ChecklistItemDto> { Success = false, Message = "Press 'Start Task' before completing checklist items" };

            await using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                item.IsCompleted = isCompleted;
                item.CompletedAt = isCompleted ? AppClock.Now : null;
                item.CompletedById = isCompleted ? userId : null;

                await _context.SaveChangesAsync();
                await RecalculateTaskProgressAsync(taskId);

                var user = await _context.Users.FindAsync(userId);
                var task = await _context.Tasks.FindAsync(taskId);
                _context.Activities.Add(new Activity
                {
                    UserId = userId,
                    UserName = user?.FullName ?? "Unknown",
                    Action = isCompleted
                        ? $"completed checklist item '{item.Title}'"
                        : $"unchecked checklist item '{item.Title}'",
                    TargetType = "task",
                    TargetId = taskId,
                    TargetName = task?.Title ?? string.Empty,
                    Timestamp = AppClock.Now
                });
                await _context.SaveChangesAsync();
                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

            // Reload with navigation to get updated CompletedBy
            var updatedItem = await _context.ChecklistItems
                .Include(c => c.CompletedBy)
                .FirstOrDefaultAsync(c => c.Id == itemId);

            return new ApiResponse<ChecklistItemDto>
            {
                Success = true,
                Data = _mapper.Map<ChecklistItemDto>(updatedItem)
            };
        }

        public async Task<ApiResponse<ChecklistItemDto>> UpdateChecklistItemAsync(int taskId, int itemId, UpdateChecklistItemDto dto, int userId)
        {
            var item = await _context.ChecklistItems
                .Include(c => c.CompletedBy)
                .FirstOrDefaultAsync(c => c.Id == itemId && c.TaskId == taskId);

            if (item == null)
                return new ApiResponse<ChecklistItemDto> { Success = false, Message = "Checklist item not found" };

            var oldTitle = item.Title;
            item.Title = dto.Title;
            item.OrderIndex = dto.OrderIndex;
            await _context.SaveChangesAsync();

            var task = await _context.Tasks.FindAsync(taskId);
            var user = await _context.Users.FindAsync(userId);
            if (oldTitle != dto.Title)
            {
                _context.Activities.Add(new Activity
                {
                    UserId = userId,
                    UserName = user?.FullName ?? "Unknown",
                    Action = $"updated checklist item '{oldTitle}' to '{dto.Title}'",
                    TargetType = "task",
                    TargetId = taskId,
                    TargetName = task?.Title ?? string.Empty,
                    Timestamp = AppClock.Now
                });
                await _context.SaveChangesAsync();
            }

            return new ApiResponse<ChecklistItemDto>
            {
                Success = true,
                Data = _mapper.Map<ChecklistItemDto>(item)
            };
        }

        public async Task<ApiResponse<bool>> DeleteChecklistItemAsync(int taskId, int itemId, int userId)
        {
            var item = await _context.ChecklistItems
                .FirstOrDefaultAsync(c => c.Id == itemId && c.TaskId == taskId);

            if (item == null)
                return new ApiResponse<bool> { Success = false, Message = "Checklist item not found" };

            var title = item.Title;
            var task = await _context.Tasks.FindAsync(taskId);
            var user = await _context.Users.FindAsync(userId);

            await using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                _context.ChecklistItems.Remove(item);
                await _context.SaveChangesAsync();
                await RecalculateTaskProgressAsync(taskId);

                _context.Activities.Add(new Activity
                {
                    UserId = userId,
                    UserName = user?.FullName ?? "Unknown",
                    Action = $"deleted checklist item '{title}'",
                    TargetType = "task",
                    TargetId = taskId,
                    TargetName = task?.Title ?? string.Empty,
                    Timestamp = AppClock.Now
                });
                await _context.SaveChangesAsync();
                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

            return new ApiResponse<bool> { Success = true, Data = true };
        }

        public async Task<ApiResponse<bool>> MarkAllChecklistCompleteAsync(int taskId, int userId)
        {
            var task = await _context.Tasks.FindAsync(taskId);
            if (task == null)
                return new ApiResponse<bool> { Success = false, Message = "Task not found" };
            // P2-D: the service is canonical for who may mark-all-complete (only the assignee)
            if (task.AssignedToId != userId)
                return new ApiResponse<bool> { Success = false, Message = "Only the current assignee can mark items complete" };
            if (task.StartedAt == null)
                return new ApiResponse<bool> { Success = false, Message = "Press 'Start Task' before completing checklist items" };

            var items = await _context.ChecklistItems
                .Where(c => c.TaskId == taskId && !c.IsCompleted)
                .ToListAsync();

            if (items.Count == 0)
                return new ApiResponse<bool> { Success = true, Data = true };

            await using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                var now = AppClock.Now;
                foreach (var item in items)
                {
                    item.IsCompleted = true;
                    item.CompletedAt = now;
                    item.CompletedById = userId;
                }
                await _context.SaveChangesAsync();
                await RecalculateTaskProgressAsync(taskId);

                var user = await _context.Users.FindAsync(userId);
                _context.Activities.Add(new Activity
                {
                    UserId = userId,
                    UserName = user?.FullName ?? "Unknown",
                    Action = "marked all checklist items complete",
                    TargetType = "task",
                    TargetId = taskId,
                    TargetName = task.Title,
                    Timestamp = AppClock.Now
                });
                await _context.SaveChangesAsync();
                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

            return new ApiResponse<bool> { Success = true, Data = true };
        }

        public async Task<ApiResponse<List<TaskCommentDto>>> GetCommentsAsync(int taskId, int? userId, DateTime? from, DateTime? to, CancellationToken ct = default)
        {
            var query = _context.TaskComments
                .Include(c => c.User)
                .Where(c => c.TaskId == taskId)
                .AsQueryable();

            if (userId.HasValue)
                query = query.Where(c => c.UserId == userId.Value);
            if (from.HasValue)
                query = query.Where(c => c.CreatedAt >= from.Value);
            if (to.HasValue)
                query = query.Where(c => c.CreatedAt <= to.Value);

            var comments = await query.OrderBy(c => c.CreatedAt).ToListAsync(ct);

            return new ApiResponse<List<TaskCommentDto>>
            {
                Success = true,
                Data = _mapper.Map<List<TaskCommentDto>>(comments)
            };
        }

        public async Task<ApiResponse<TaskDto>> SetTaskBlockAsync(int taskId, SetTaskBlockDto dto, int requesterId)
        {
            var task = await _context.Tasks
                .Include(t => t.BlockEntries).ThenInclude(b => b.BlockedBy)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null)
                return new ApiResponse<TaskDto> { Success = false, Message = "Task not found" };

            var project = await _context.Projects.FindAsync(task.ProjectId);
            bool isTaskCreator = task.CreatedById == requesterId;
            bool isProjectOwnerOrCreator = project != null && (project.OwnerId == requesterId || project.CreatedById == requesterId);
            bool isAssignee = task.AssignedToId == requesterId;

            bool isAdmin = await IsUserAdminAsync(requesterId);

            if (dto.IsBlocked)
            {
                // Assignee, an admin, or the project owner/creator can block
                if (!isAssignee && !isAdmin && !isProjectOwnerOrCreator)
                    return new ApiResponse<TaskDto> { Success = false, Message = "Only the assignee, an admin, or the project owner can block this task" };
            }
            else
            {
                // Unblock: task creator, project owner/creator, admin, or current assignee (their own block)
                if (!isTaskCreator && !isProjectOwnerOrCreator && !isAssignee && !isAdmin)
                    return new ApiResponse<TaskDto> { Success = false, Message = "Only the task creator, project owner, or an admin can unblock this task" };
            }

            var requester = await _context.Users.FindAsync(requesterId);

            await using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                if (dto.IsBlocked)
                {
                    if (string.IsNullOrWhiteSpace(dto.Reason))
                        return new ApiResponse<TaskDto> { Success = false, Message = "A reason is required when blocking a task" };

                    // Upsert: one entry per user per task
                    var existing = task.BlockEntries.FirstOrDefault(b => b.BlockedById == requesterId);
                    if (existing != null)
                    {
                        existing.Reason = dto.Reason;
                        existing.IsActive = true;
                        existing.BlockedAt = AppClock.Now;
                        existing.ResolvedAt = null;
                    }
                    else
                    {
                        _context.TaskBlockEntries.Add(new TaskBlockEntry
                        {
                            TaskId = taskId,
                            BlockedById = requesterId,
                            BlockedByName = requester?.FullName ?? string.Empty,
                            Reason = dto.Reason,
                            IsActive = true,
                            BlockedAt = AppClock.Now
                        });
                    }

                    if (task.Status != "blocked") task.Status = "blocked";
                    task.UpdatedAt = AppClock.Now;

                    _context.Activities.Add(new Activity
                    {
                        UserId = requesterId,
                        UserName = requester?.FullName ?? "Unknown",
                        Action = $"blocked task. Reason: {dto.Reason}",
                        TargetType = "task",
                        TargetId = taskId,
                        TargetName = task.Title,
                        Timestamp = AppClock.Now
                    });
                }
                else
                {
                    // Deactivate ALL active block entries on the task.
                    var actives = task.BlockEntries.Where(b => b.IsActive).ToList();
                    foreach (var b in actives)
                    {
                        b.IsActive = false;
                        b.ResolvedAt = AppClock.Now;
                    }

                    // Leaving the Blocked column → resume work
                    if (task.Status == "blocked")
                    {
                        task.Status = "in-progress";
                        if (task.StartedAt == null)
                        {
                            task.StartedAt = AppClock.Now;
                            task.StartedById = requesterId;
                        }
                    }
                    task.UpdatedAt = AppClock.Now;

                    _context.Activities.Add(new Activity
                    {
                        UserId = requesterId,
                        UserName = requester?.FullName ?? "Unknown",
                        Action = "unblocked task",
                        TargetType = "task",
                        TargetId = taskId,
                        TargetName = task.Title,
                        Timestamp = AppClock.Now
                    });
                }

                await _context.SaveChangesAsync();
                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

            return await GetTaskByIdAsync(taskId);
        }

        public async Task<ApiResponse<List<TaskBlockEntryDto>>> GetTaskBlockEntriesAsync(int taskId, CancellationToken ct = default)
        {
            var entries = await _context.TaskBlockEntries
                .Include(b => b.BlockedBy)
                .Where(b => b.TaskId == taskId)
                .OrderByDescending(b => b.BlockedAt)
                .ToListAsync(ct);

            var dtos = entries.Select(b => new TaskBlockEntryDto
            {
                Id = b.Id,
                TaskId = b.TaskId,
                BlockedById = b.BlockedById,
                BlockedByName = b.BlockedBy?.FullName ?? b.BlockedByName,
                Reason = b.Reason,
                IsActive = b.IsActive,
                BlockedAt = b.BlockedAt,
                ResolvedAt = b.ResolvedAt
            }).ToList();

            return new ApiResponse<List<TaskBlockEntryDto>> { Success = true, Data = dtos };
        }

        public async Task<TaskEntity?> GetTaskEntityAsync(int taskId)
        {
            return await _context.Tasks.FindAsync(taskId);
        }

        // True if the user's role is SystemAdmin (RoleId 1) or a role flagged IsAdmin.
        private async Task<bool> IsUserAdminAsync(int userId)
        {
            var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return false;
            return user.RoleId == 1 || (user.Role?.IsAdmin ?? false);
        }

        public async Task<bool> IsPreviousAssigneeAsync(int taskId, int userId)
        {
            return await _context.TaskAssignmentHistories
                .AnyAsync(h => h.TaskId == taskId && h.PreviousAssigneeId == userId);
        }

        private async Task RecalculateTaskProgressAsync(int taskId)
        {
            var items = await _context.ChecklistItems
                .Where(c => c.TaskId == taskId)
                .ToListAsync();

            if (items.Count == 0) return;

            var task = await _context.Tasks.FindAsync(taskId);
            if (task == null) return;

            var completed = items.Count(c => c.IsCompleted);
            task.Progress = (int)Math.Round((double)completed / items.Count * 100);
            task.UpdatedAt = AppClock.Now;

            // Auto-submit for review when all items are checked while actively in progress
            if (task.Progress == 100 && task.Status == "in-progress")
            {
                _context.TaskStatusHistories.Add(new TaskStatusHistory
                {
                    TaskId = taskId, FromStatus = task.Status, ToStatus = "under-review",
                    ChangedById = task.AssignedToId ?? task.CreatedById,
                    Reason = "All checklist items completed", ChangedAt = AppClock.Now
                });
                task.Status = "under-review";
            }

            // Auto-revert to in-progress when an item is unchecked while waiting on review
            if (task.Progress < 100 && task.Status == "under-review")
            {
                _context.TaskStatusHistories.Add(new TaskStatusHistory
                {
                    TaskId = taskId, FromStatus = task.Status, ToStatus = "in-progress",
                    ChangedById = task.AssignedToId ?? task.CreatedById,
                    Reason = "Checklist item unchecked", ChangedAt = AppClock.Now
                });
                task.Status = "in-progress";
            }

            await _context.SaveChangesAsync();
        }
    }
}
