using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TaskManagement.DTOs
{
    public static class ReasonTags
    {
        public static readonly HashSet<string> Valid = new(StringComparer.OrdinalIgnoreCase)
        {
            "Resignation", "Workload Balancing", "Management Decision", "Unavailability",
            "No Resource", "Unable to Complete", "Admin Decision", "Other"
        };
    }

    public class UserDto
    {
        public int Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public int RoleId { get; set; }
        public string? RoleName { get; set; }
        public bool IsAdmin { get; set; }
        public string? AvatarUrl { get; set; }
        public string? ContactNo { get; set; }
        public bool IsActive { get; set; }
    }

    public class ProjectMemberDto
    {
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public string? RoleInProject { get; set; }
    }

    public class ProjectDto
    {
        public int Id { get; set; }
        public string? Code { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int OwnerId { get; set; }
        public string? OwnerName { get; set; }
        public int CreatedById { get; set; }
        public string? CreatedByName { get; set; }
        public int MemberCount { get; set; }
        public List<int> MemberIds { get; set; } = new();
        public List<ProjectMemberDto> Members { get; set; } = new();
        public int TaskCount { get; set; }
        public int Progress { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<ProjectAssignmentHistoryDto> AssignmentHistory { get; set; } = new();
        public List<string> Modules { get; set; } = new();
    }

    public class ReassignProjectDto
    {
        public int NewOwnerId { get; set; }
        public string ReasonTag { get; set; } = string.Empty;
    }

    public class ProjectAssignmentHistoryDto
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public int PreviousOwnerId { get; set; }
        public string? PreviousOwnerName { get; set; }
        public int NewOwnerId { get; set; }
        public string? NewOwnerName { get; set; }
        public int ChangedById { get; set; }
        public string ChangedByName { get; set; } = string.Empty;
        public DateTime ChangedAt { get; set; }
        public string ReasonTag { get; set; } = string.Empty;
    }

    public class TaskDto
    {
        public int Id { get; set; }
        public string? Code { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public int ProjectId { get; set; }
        public string? ProjectName { get; set; }
        public string? ProjectCode { get; set; }
        public int? AssignedToId { get; set; }
        public string? AssignedToName { get; set; }
        public string? AssignedToAvatarUrl { get; set; }
        public DateTime? DueDate { get; set; }
        public int Progress { get; set; }
        public decimal? EstimatedHours { get; set; }
        public decimal? ActualHours { get; set; }
        public string? Module { get; set; }
        public bool IsBlocked { get; set; }
        public List<string> Tags { get; set; } = new List<string>();
        public int CommentCount { get; set; }
        public List<TaskCommentDto> Comments { get; set; } = new List<TaskCommentDto>();
        public List<ChecklistItemDto> ChecklistItems { get; set; } = new List<ChecklistItemDto>();
        public List<TaskAssignmentHistoryDto> AssignmentHistory { get; set; } = new List<TaskAssignmentHistoryDto>();
        public List<TaskBlockEntryDto> BlockEntries { get; set; } = new List<TaskBlockEntryDto>();
        public int CreatedById { get; set; }
        public string? CreatedByName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? StartedAt { get; set; }
        public int? StartedById { get; set; }
        public string? StartedByName { get; set; }
        public int? ParentTaskId { get; set; }
        public string? ParentTaskTitle { get; set; }
        public bool RequiresQA { get; set; }
        public int? QaAssigneeId { get; set; }
        public string? QaAssigneeName { get; set; }
        public List<LinkedTaskDto> ChildTasks { get; set; } = new List<LinkedTaskDto>();
        public int ChildTaskCount { get; set; }
    }

    public class ChangeStatusDto
    {
        public string ToStatus { get; set; } = string.Empty;
        public string? Reason { get; set; }
        public decimal? ActualHours { get; set; }
    }

    public class TaskStatusHistoryDto
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public string FromStatus { get; set; } = string.Empty;
        public string ToStatus { get; set; } = string.Empty;
        public int ChangedById { get; set; }
        public string? ChangedByName { get; set; }
        public string? Reason { get; set; }
        public decimal? ActualHours { get; set; }
        public DateTime ChangedAt { get; set; }
    }

    // ── Effort time tracking (derived from status + assignment history) ──────────
    public class StatusDurationDto
    {
        public string Status { get; set; } = string.Empty;
        public long Seconds { get; set; }
        public bool IsProductive { get; set; }
    }

    public class UserEffortDto
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public long ProductiveSeconds { get; set; }
        public long PausedSeconds { get; set; }
        public DateTime? AssignedAt { get; set; }
        public DateTime? FirstStartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }

    public class EffortTimelineSegmentDto
    {
        public string Status { get; set; } = string.Empty;
        public DateTime StartAt { get; set; }
        public DateTime EndAt { get; set; }
        public long Seconds { get; set; }
        public bool IsProductive { get; set; }
    }

    public class TaskEffortDto
    {
        public long TotalElapsedSeconds { get; set; }
        public long ProductiveSeconds { get; set; }
        public long PausedSeconds { get; set; }
        public long BlockedSeconds { get; set; }
        public long UnderReviewSeconds { get; set; }
        public long OtherSeconds { get; set; }
        public bool IsRunning { get; set; }
        public List<StatusDurationDto> ByStatus { get; set; } = new();
        public List<UserEffortDto> ByUser { get; set; } = new();
        public List<EffortTimelineSegmentDto> Timeline { get; set; } = new();
    }

    // ── Dashboard effort summary (org-wide, windowed) ────────────────────────────
    public class TopUserEffortDto
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public long ProductiveSeconds { get; set; }
        public long PausedSeconds { get; set; }
    }

    public class DashboardEffortDto
    {
        // Window covered (echoed back for display); null = all matched data.
        public DateTime? FromUtc { get; set; }
        public DateTime? ToUtc { get; set; }
        // Active users (IsActive) — not windowed.
        public int TotalActiveUsers { get; set; }
        // Windowed totals.
        public long ProductiveSeconds { get; set; }   // time in-progress
        public long PausedSeconds { get; set; }        // time paused
        public long WorkingSeconds { get; set; }       // productive + paused
        // Live snapshot (current task status, not windowed).
        public int UsersCurrentlyWorking { get; set; }     // assignee on an in-progress task
        public int UsersInPauseReview { get; set; }        // paused / under-review / blocked
        public List<TopUserEffortDto> TopProductiveUsers { get; set; } = new();
    }

    public class LinkedTaskDto
    {
        public int Id { get; set; }
        public string? Code { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int? AssignedToId { get; set; }
        public string? AssignedToName { get; set; }
    }

    public class CreateTaskDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Status { get; set; } = "new";
        public string Priority { get; set; } = "Medium";
        public int ProjectId { get; set; }
        public int? AssignedToId { get; set; }
        public DateTime? DueDate { get; set; }
        public string? Module { get; set; }
        public List<string>? Tags { get; set; }
        public int? ParentTaskId { get; set; }
        public bool RequiresQA { get; set; } = false;
        public int? QaAssigneeId { get; set; }
        // Every task must have an estimate (> 0). ActualHours is an optional manual figure.
        [Range(0.01, 100000)]
        public decimal? EstimatedHours { get; set; }
        public decimal? ActualHours { get; set; }
    }

    public class DashboardStatsDto
    {
        public int TotalProjects { get; set; }
        public int TotalTasks { get; set; }
        public int ActiveUsers { get; set; }
        public int CompletedTasks { get; set; }
        public List<StatusCountDto> TasksByStatus { get; set; } = new();
    }

    public class StatusCountDto
    {
        public string Status { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class RoleDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Code { get; set; }
        public int Level { get; set; }
        public string? Description { get; set; }
        public bool IsAdmin { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class CreateUserDto
    {
        [Required, StringLength(50, MinimumLength = 3)]
        public string UserName { get; set; } = string.Empty;
        [Required, EmailAddress, StringLength(256)]
        public string Email { get; set; } = string.Empty;
        [Required, StringLength(100)]
        public string FirstName { get; set; } = string.Empty;
        [Required, StringLength(100)]
        public string LastName { get; set; } = string.Empty;
        [Required, MinLength(6)]
        public string Password { get; set; } = string.Empty;
        public int RoleId { get; set; }
        public string? AvatarUrl { get; set; }
        [Phone]
        public string? ContactNo { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class UpdateUserDto
    {
        [Required, StringLength(50, MinimumLength = 3)]
        public string UserName { get; set; } = string.Empty;
        [Required, StringLength(100)]
        public string FirstName { get; set; } = string.Empty;
        [Required, StringLength(100)]
        public string LastName { get; set; } = string.Empty;
        [Required, EmailAddress, StringLength(256)]
        public string Email { get; set; } = string.Empty;
        public int RoleId { get; set; }
        public string? AvatarUrl { get; set; }
        [Phone]
        public string? ContactNo { get; set; }
        public bool IsActive { get; set; }
    }

    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public T? Data { get; set; }
        public List<string>? Errors { get; set; }
        public string? ErrorCode { get; set; }

        // Pagination metadata — populated only on paginated list endpoints.
        public int? TotalCount { get; set; }
        public int? Page { get; set; }
        public int? PageSize { get; set; }
        public int? TotalPages { get; set; }

        public static ApiResponse<T> Forbidden(string message) =>
            new() { Success = false, Message = message, ErrorCode = "FORBIDDEN" };

        public static ApiResponse<T> NotFound(string message) =>
            new() { Success = false, Message = message, ErrorCode = "NOT_FOUND" };
    }

    public class TaskCommentDto
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public string Text { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }

    public class CreateTaskCommentDto
    {
        // UserId and UserName are intentionally omitted — the controller
        // derives these from the authenticated JWT claim.
        public string Text { get; set; } = string.Empty;
    }

    public class ActivityDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string TargetType { get; set; } = string.Empty;
        public int TargetId { get; set; }
        public string TargetName { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }

    public class CreateActivityDto
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string TargetType { get; set; } = string.Empty;
        public int TargetId { get; set; }
        public string TargetName { get; set; } = string.Empty;
    }

    // Task Reassignment
    public class ReassignTaskDto
    {
        public int? NewAssigneeId { get; set; }
        public string ReasonTag { get; set; } = string.Empty;
    }

    public class TaskAssignmentHistoryDto
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public int? PreviousAssigneeId { get; set; }
        public string? PreviousAssigneeName { get; set; }
        public int? NewAssigneeId { get; set; }
        public string? NewAssigneeName { get; set; }
        public int ChangedById { get; set; }
        public string ChangedByName { get; set; } = string.Empty;
        public DateTime ChangedAt { get; set; }
        public string ReasonTag { get; set; } = string.Empty;
    }

    // Checklist Items
    public class CreateChecklistItemDto
    {
        public string Title { get; set; } = string.Empty;
        public int OrderIndex { get; set; }
    }

    public class ChecklistItemDto
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public string Title { get; set; } = string.Empty;
        public bool IsCompleted { get; set; }
        public DateTime? CompletedAt { get; set; }
        public int? CompletedById { get; set; }
        public string? CompletedByName { get; set; }
        public int OrderIndex { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ToggleChecklistItemDto
    {
        public bool IsCompleted { get; set; }
    }

    public class UpdateChecklistItemDto
    {
        public string Title { get; set; } = string.Empty;
        public int OrderIndex { get; set; }
    }

    public class ReorderChecklistItemDto
    {
        public int ItemId { get; set; }
        public int OrderIndex { get; set; }
    }

    // Task Block
    public class TaskBlockEntryDto
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public int BlockedById { get; set; }
        public string BlockedByName { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime BlockedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
    }

    public class SetTaskBlockDto
    {
        public bool IsBlocked { get; set; }
        public string Reason { get; set; } = string.Empty;
    }

    // ── Chat DTOs ──────────────────────────────────────────────

    public class ChatAttachmentDto
    {
        public int Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FileType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string MimeType { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
    }

    public class ChatMessageDto
    {
        public int Id { get; set; }
        public string? Content { get; set; }
        public int SenderId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public string? SenderAvatar { get; set; }
        public DateTime SentAt { get; set; }
        public string MessageType { get; set; } = "text";
        public ChatAttachmentDto? Attachment { get; set; }
        public ChatMessageDto? ReplyTo { get; set; }
        public int? RoomId { get; set; }
    }

    public class SendMessageDto
    {
        public string? Content { get; set; }
        public string MessageType { get; set; } = "text";
        public int? ReplyToId { get; set; }
        public int? AttachmentId { get; set; }
        public int? RoomId { get; set; }
    }

    public class OnlineUserDto
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public DateTime ConnectedAt { get; set; }
    }

    public class ChatRoomDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string RoomType { get; set; } = "public";
        public int CreatedById { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<ChatRoomMemberDto> Members { get; set; } = new();
        public ChatMessageDto? LastMessage { get; set; }
        public int UnreadCount { get; set; }
    }

    public class ChatRoomMemberDto
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
    }

    public class CreateChatRoomDto
    {
        public string Name { get; set; } = string.Empty;
        public string RoomType { get; set; } = "public";
        public List<int> MemberIds { get; set; } = new();
    }

    // ── Reports: user-wise effort breakdown ───────────────────────────────────
    public class UserEffortReportItemDto
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public int TaskCount { get; set; }
        public long ProductiveSeconds { get; set; }
        public long PausedSeconds { get; set; }
        public long BlockedSeconds { get; set; }
        public long UnderReviewSeconds { get; set; }
        public long TotalElapsedSeconds { get; set; }
    }

    public class UserEffortReportDto
    {
        public DateTime? FromUtc { get; set; }
        public DateTime? ToUtc { get; set; }
        public List<UserEffortReportItemDto> Users { get; set; } = new();
    }

    // ── Reports: user-wise status transition summary ──────────────────────────
    public class TransitionCountDto
    {
        public string FromStatus { get; set; } = string.Empty;
        public string ToStatus { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class UserTransitionReportItemDto
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public int TotalTransitions { get; set; }
        public string MostCommonTransition { get; set; } = string.Empty;
        public List<TransitionCountDto> Breakdown { get; set; } = new();
    }

    public class UserTransitionReportDto
    {
        public DateTime? FromUtc { get; set; }
        public DateTime? ToUtc { get; set; }
        public List<UserTransitionReportItemDto> Users { get; set; } = new();
    }

    // ── Reports: per-task effort breakdown for a single user ─────────────────
    public class UserTaskEffortItemDto
    {
        public int TaskId { get; set; }
        public string TaskCode { get; set; } = string.Empty;
        public string TaskTitle { get; set; } = string.Empty;
        public string TaskStatus { get; set; } = string.Empty;
        public long ProductiveSeconds { get; set; }
        public long PausedSeconds { get; set; }
        public long BlockedSeconds { get; set; }
        public long UnderReviewSeconds { get; set; }
        public long TotalElapsedSeconds { get; set; }
    }

    public class UserTaskEffortReportDto
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public DateTime? FromUtc { get; set; }
        public DateTime? ToUtc { get; set; }
        public List<UserTaskEffortItemDto> Tasks { get; set; } = new();
    }

    // ── Reports: per-day effort for a single user ─────────────────────────────
    public class DailyEffortItemDto
    {
        public DateTime Date { get; set; }              // calendar date (time = 00:00)
        public long ProductiveSeconds { get; set; }
        public long PausedSeconds { get; set; }
        public long BlockedSeconds { get; set; }
        public long UnderReviewSeconds { get; set; }
        public long TotalElapsedSeconds { get; set; }
        public int TaskCount { get; set; }             // distinct tasks that had effort this day
    }

    public class UserDailyEffortReportDto
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public DateTime? FromUtc { get; set; }
        public DateTime? ToUtc { get; set; }
        public List<DailyEffortItemDto> Days { get; set; } = new();
    }

    // ── Reports: hours summary (user / task / project breakdown) ─────────────
    public class HoursSummaryUserRowDto
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public long ProductiveSeconds { get; set; }
        public long PausedSeconds { get; set; }
        public long BlockedSeconds { get; set; }
        public long UnderReviewSeconds { get; set; }
        public long TotalSeconds { get; set; }
        public int TaskCount { get; set; }
    }

    public class HoursSummaryTaskRowDto
    {
        public int TaskId { get; set; }
        public string TaskCode { get; set; } = string.Empty;
        public string TaskTitle { get; set; } = string.Empty;
        public string TaskStatus { get; set; } = string.Empty;
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public long ProductiveSeconds { get; set; }
        public long PausedSeconds { get; set; }
        public long BlockedSeconds { get; set; }
        public long UnderReviewSeconds { get; set; }
        public long TotalSeconds { get; set; }
    }

    public class HoursSummaryProjectRowDto
    {
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public long ProductiveSeconds { get; set; }
        public long PausedSeconds { get; set; }
        public long BlockedSeconds { get; set; }
        public long UnderReviewSeconds { get; set; }
        public long TotalSeconds { get; set; }
        public int TaskCount { get; set; }
        public int UserCount { get; set; }
    }

    public class HoursSummaryDto
    {
        public DateTime? FromUtc { get; set; }
        public DateTime? ToUtc { get; set; }
        public long TotalProductiveSeconds { get; set; }
        public long TotalWorkingSeconds { get; set; }    // productive + paused + blocked + under-review
        public int? FilterUserId { get; set; }
        public int? FilterProjectId { get; set; }
        public List<HoursSummaryUserRowDto> ByUser { get; set; } = new();
        public List<HoursSummaryTaskRowDto> ByTask { get; set; } = new();
        public List<HoursSummaryProjectRowDto> ByProject { get; set; } = new();
    }

    public class WorkDiaryDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public DateTime Date { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? Category { get; set; }
        public decimal? HoursSpent { get; set; }
        public int? TaskId { get; set; }
        public string? TaskTitle { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateWorkDiaryDto
    {
        [System.ComponentModel.DataAnnotations.Required]
        public DateTime Date { get; set; }
        [System.ComponentModel.DataAnnotations.Required]
        public string Description { get; set; } = string.Empty;
        public string? Category { get; set; }
        public decimal? HoursSpent { get; set; }
        public int? TaskId { get; set; }
    }

    public class UpdateWorkDiaryDto
    {
        [System.ComponentModel.DataAnnotations.Required]
        public string Description { get; set; } = string.Empty;
        public string? Category { get; set; }
        public decimal? HoursSpent { get; set; }
        public int? TaskId { get; set; }
    }
}
