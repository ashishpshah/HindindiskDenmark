using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using TaskManagement.Services;

namespace TaskManagement.Data
{
    public class PMSDbContext : DbContext
    {
        public PMSDbContext(DbContextOptions<PMSDbContext> options)
            : base(options)
        {
        }

        public DbSet<Role> Roles => Set<Role>();
        public DbSet<User> Users => Set<User>();
        public DbSet<Project> Projects => Set<Project>();
        public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();
        public DbSet<ProjectModule> ProjectModules => Set<ProjectModule>();
        public DbSet<TaskEntity> Tasks => Set<TaskEntity>();
        public DbSet<TaskTag> TaskTags => Set<TaskTag>();
        public DbSet<TaskComment> TaskComments => Set<TaskComment>();
        public DbSet<Attachment> Attachments => Set<Attachment>();
        public DbSet<Activity> Activities => Set<Activity>();
        public DbSet<PageModule> PageModules => Set<PageModule>();
        public DbSet<RolePagePermission> RolePagePermissions => Set<RolePagePermission>();
        public DbSet<UserPagePermission> UserPagePermissions => Set<UserPagePermission>();
        public DbSet<ProjectAssignmentHistory> ProjectAssignmentHistories => Set<ProjectAssignmentHistory>();
        public DbSet<TaskAssignmentHistory> TaskAssignmentHistories => Set<TaskAssignmentHistory>();
        public DbSet<ChecklistItem> ChecklistItems => Set<ChecklistItem>();
        public DbSet<TaskBlockEntry> TaskBlockEntries => Set<TaskBlockEntry>();
        public DbSet<TaskStatusHistory> TaskStatusHistories => Set<TaskStatusHistory>();
        public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
        public DbSet<ChatAttachment> ChatAttachments => Set<ChatAttachment>();
        public DbSet<ChatRoom> ChatRooms => Set<ChatRoom>();
        public DbSet<ChatRoomMember> ChatRoomMembers => Set<ChatRoomMember>();
        public DbSet<WorkDiary> WorkDiaries => Set<WorkDiary>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Unique role code (filtered so multiple legacy NULLs are allowed)
            modelBuilder.Entity<Role>()
                .HasIndex(r => r.Code)
                .IsUnique()
                .HasFilter("[Code] IS NOT NULL");

            modelBuilder.Entity<ProjectMember>()
                .HasKey(pm => new { pm.ProjectId, pm.UserId });

            modelBuilder.Entity<ProjectMember>()
                .HasOne(pm => pm.Project)
                .WithMany(p => p.Members)
                .HasForeignKey(pm => pm.ProjectId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ProjectMember>()
                .HasOne(pm => pm.User)
                .WithMany()
                .HasForeignKey(pm => pm.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TaskTag>()
                .HasKey(tt => new { tt.TaskId, tt.Tag });

            modelBuilder.Entity<TaskTag>()
                .HasOne<TaskEntity>()
                .WithMany(t => t.Tags)
                .HasForeignKey(tt => tt.TaskId);

            modelBuilder.Entity<ProjectModule>()
                .HasKey(pm => new { pm.ProjectId, pm.Name });

            modelBuilder.Entity<ProjectModule>()
                .HasOne(pm => pm.Project)
                .WithMany(p => p.Modules)
                .HasForeignKey(pm => pm.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskComment>()
                .HasOne<TaskEntity>()
                .WithMany(t => t.Comments)
                .HasForeignKey(tc => tc.TaskId);

            modelBuilder.Entity<TaskComment>()
                .HasOne(tc => tc.User)
                .WithMany()
                .HasForeignKey(tc => tc.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Attachment>()
                .HasOne<TaskEntity>()
                .WithMany(t => t.Attachments)
                .HasForeignKey(a => a.TaskId);

            modelBuilder.Entity<Attachment>()
                .HasOne(a => a.UploadedBy)
                .WithMany()
                .HasForeignKey(a => a.UploadedById)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<User>()
                .HasOne(u => u.Role)
                .WithMany()
                .HasForeignKey(u => u.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            // Unique username/email (case-insensitive via SQL Server's default CI collation).
            modelBuilder.Entity<User>().Property(u => u.UserName).HasMaxLength(50);
            modelBuilder.Entity<User>().Property(u => u.Email).HasMaxLength(256);
            modelBuilder.Entity<User>().Property(u => u.FirstName).HasMaxLength(100);
            modelBuilder.Entity<User>().Property(u => u.LastName).HasMaxLength(100);
            modelBuilder.Entity<User>().HasIndex(u => u.UserName).IsUnique();
            modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();

            modelBuilder.Entity<Project>()
                .HasOne(p => p.CreatedBy)
                .WithMany()
                .HasForeignKey(p => p.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Project>()
                .HasOne(p => p.Owner)
                .WithMany()
                .HasForeignKey(p => p.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure decimal precision
            modelBuilder.Entity<TaskEntity>()
                .Property(t => t.EstimatedHours)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<TaskEntity>()
                .Property(t => t.ActualHours)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<TaskStatusHistory>()
                .Property(h => h.ActualHours)
                .HasColumnType("decimal(18,2)");

            // Self-referencing parent/child task link
            modelBuilder.Entity<TaskEntity>()
                .HasOne(t => t.ParentTask)
                .WithMany(t => t.ChildTasks)
                .HasForeignKey(t => t.ParentTaskId)
                .OnDelete(DeleteBehavior.Restrict);

            // Unique hierarchy codes (filtered so multiple legacy NULLs are allowed)
            modelBuilder.Entity<Project>()
                .HasIndex(p => p.Code)
                .IsUnique()
                .HasFilter("[Code] IS NOT NULL");
            modelBuilder.Entity<TaskEntity>()
                .HasIndex(t => t.Code)
                .IsUnique()
                .HasFilter("[Code] IS NOT NULL");

            modelBuilder.Entity<TaskEntity>()
                .HasOne(t => t.StartedBy)
                .WithMany()
                .HasForeignKey(t => t.StartedById)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TaskEntity>()
                .HasOne(t => t.QaAssignee)
                .WithMany()
                .HasForeignKey(t => t.QaAssigneeId)
                .OnDelete(DeleteBehavior.Restrict);

            // Task status change history
            modelBuilder.Entity<TaskStatusHistory>()
                .Property(h => h.Id).ValueGeneratedOnAdd();
            modelBuilder.Entity<TaskStatusHistory>()
                .HasOne(h => h.Task)
                .WithMany(t => t.StatusHistory)
                .HasForeignKey(h => h.TaskId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<TaskStatusHistory>()
                .HasOne(h => h.ChangedBy)
                .WithMany()
                .HasForeignKey(h => h.ChangedById)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure auto-increment for all primary keys
            modelBuilder.Entity<Role>().Property(r => r.Id).ValueGeneratedOnAdd();
            modelBuilder.Entity<User>().Property(u => u.Id).ValueGeneratedOnAdd();
            modelBuilder.Entity<Project>().Property(p => p.Id).ValueGeneratedOnAdd();
            modelBuilder.Entity<TaskEntity>().Property(t => t.Id).ValueGeneratedOnAdd();
            modelBuilder.Entity<TaskComment>().Property(c => c.Id).ValueGeneratedOnAdd();
            modelBuilder.Entity<Attachment>().Property(a => a.Id).ValueGeneratedOnAdd();
            modelBuilder.Entity<Activity>().Property(a => a.Id).ValueGeneratedOnAdd();

            // ProjectAssignmentHistory
            modelBuilder.Entity<ProjectAssignmentHistory>()
                .Property(h => h.Id).ValueGeneratedOnAdd();
            modelBuilder.Entity<ProjectAssignmentHistory>()
                .HasOne(h => h.Project)
                .WithMany(p => p.AssignmentHistory)
                .HasForeignKey(h => h.ProjectId)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<ProjectAssignmentHistory>()
                .HasOne(h => h.PreviousOwner)
                .WithMany()
                .HasForeignKey(h => h.PreviousOwnerId)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<ProjectAssignmentHistory>()
                .HasOne(h => h.NewOwner)
                .WithMany()
                .HasForeignKey(h => h.NewOwnerId)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<ProjectAssignmentHistory>()
                .HasOne(h => h.ChangedBy)
                .WithMany()
                .HasForeignKey(h => h.ChangedById)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<ProjectAssignmentHistory>()
                .Property(h => h.ReasonTag).HasMaxLength(50);

            // TaskAssignmentHistory
            modelBuilder.Entity<TaskAssignmentHistory>()
                .Property(h => h.Id).ValueGeneratedOnAdd();
            modelBuilder.Entity<TaskAssignmentHistory>()
                .HasOne(h => h.Task)
                .WithMany(t => t.AssignmentHistory)
                .HasForeignKey(h => h.TaskId)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<TaskAssignmentHistory>()
                .HasOne(h => h.PreviousAssignee)
                .WithMany()
                .HasForeignKey(h => h.PreviousAssigneeId)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<TaskAssignmentHistory>()
                .HasOne(h => h.NewAssignee)
                .WithMany()
                .HasForeignKey(h => h.NewAssigneeId)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<TaskAssignmentHistory>()
                .HasOne(h => h.ChangedBy)
                .WithMany()
                .HasForeignKey(h => h.ChangedById)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<TaskAssignmentHistory>()
                .Property(h => h.ReasonTag).HasMaxLength(50);

            // ChecklistItem
            modelBuilder.Entity<ChecklistItem>()
                .Property(c => c.Id).ValueGeneratedOnAdd();
            modelBuilder.Entity<ChecklistItem>()
                .HasOne<TaskEntity>()
                .WithMany(t => t.ChecklistItems)
                .HasForeignKey(c => c.TaskId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<ChecklistItem>()
                .HasOne(c => c.CompletedBy)
                .WithMany()
                .HasForeignKey(c => c.CompletedById)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<ChecklistItem>()
                .Property(c => c.Title).HasMaxLength(500);

            // TaskBlockEntry
            modelBuilder.Entity<TaskBlockEntry>()
                .Property(b => b.Id).ValueGeneratedOnAdd();
            modelBuilder.Entity<TaskBlockEntry>()
                .HasOne(b => b.Task)
                .WithMany(t => t.BlockEntries)
                .HasForeignKey(b => b.TaskId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<TaskBlockEntry>()
                .HasOne(b => b.BlockedBy)
                .WithMany()
                .HasForeignKey(b => b.BlockedById)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<TaskBlockEntry>()
                .Property(b => b.Reason).HasMaxLength(1000);
            // One active block per user per task
            modelBuilder.Entity<TaskBlockEntry>()
                .HasIndex(b => new { b.TaskId, b.BlockedById })
                .IsUnique();

            // ChatMessage
            modelBuilder.Entity<ChatMessage>()
                .Property(m => m.Id).ValueGeneratedOnAdd();
            modelBuilder.Entity<ChatMessage>()
                .HasOne(m => m.Sender)
                .WithMany()
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<ChatMessage>()
                .HasOne(m => m.ReplyTo)
                .WithMany()
                .HasForeignKey(m => m.ReplyToId)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<ChatMessage>()
                .HasOne(m => m.Attachment)
                .WithOne(a => a.Message)
                .HasForeignKey<ChatAttachment>(a => a.MessageId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<ChatMessage>()
                .Property(m => m.MessageType).HasMaxLength(20);
            modelBuilder.Entity<ChatMessage>()
                .HasOne(m => m.Room)
                .WithMany(r => r.Messages)
                .HasForeignKey(m => m.RoomId)
                .OnDelete(DeleteBehavior.Cascade);

            // ChatAttachment
            modelBuilder.Entity<ChatAttachment>()
                .Property(a => a.Id).ValueGeneratedOnAdd();

            // ChatRoom
            modelBuilder.Entity<ChatRoom>()
                .Property(r => r.Id).ValueGeneratedOnAdd();
            modelBuilder.Entity<ChatRoom>()
                .HasOne(r => r.CreatedBy)
                .WithMany()
                .HasForeignKey(r => r.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<ChatRoom>()
                .Property(r => r.RoomType).HasMaxLength(20);

            // ChatRoomMember
            modelBuilder.Entity<ChatRoomMember>()
                .HasKey(m => new { m.RoomId, m.UserId });
            modelBuilder.Entity<ChatRoomMember>()
                .HasOne(m => m.Room)
                .WithMany(r => r.Members)
                .HasForeignKey(m => m.RoomId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<ChatRoomMember>()
                .HasOne(m => m.User)
                .WithMany()
                .HasForeignKey(m => m.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // WorkDiary
            modelBuilder.Entity<WorkDiary>()
                .HasOne(wd => wd.User).WithMany()
                .HasForeignKey(wd => wd.UserId).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<WorkDiary>()
                .HasOne(wd => wd.Task).WithMany()
                .HasForeignKey(wd => wd.TaskId).OnDelete(DeleteBehavior.SetNull);
            modelBuilder.Entity<WorkDiary>()
                .Property(wd => wd.HoursSpent).HasColumnType("decimal(5,2)");
        }
    }

    public class Role
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Code { get; set; }          // unique, admin-supplied (e.g. ADMIN, SRDEV)
        public int Level { get; set; } = 0;          // integer rank, 1 = highest
        public string? Description { get; set; }
        public bool IsAdmin { get; set; } = false;
        public bool IsActive { get; set; } = true;
    }

    public class User
    {
        public int Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        // Derived display name (FirstName + " " + LastName); kept for the many
        // denormalized consumers (activities, history, notifications, chat).
        public string FullName { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public int RoleId { get; set; }              // the user's single role (1:1)
        public Role? Role { get; set; }
        public string? AvatarUrl { get; set; }
        public string? ContactNo { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = AppClock.Now;
        public DateTime? UpdatedAt { get; set; }
    }

    public class Project
    {
        public int Id { get; set; }
        public string? Code { get; set; }          // e.g. PRJ-01
        public int SeqNumber { get; set; }          // 1-based position used to build Code (PP)
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Status { get; set; } = "Active";
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int CreatedById { get; set; }
        public User? CreatedBy { get; set; }
        public int OwnerId { get; set; }
        public User? Owner { get; set; }
        public DateTime CreatedAt { get; set; } = AppClock.Now;
        public DateTime? UpdatedAt { get; set; }
        public ICollection<ProjectMember> Members { get; set; } = new List<ProjectMember>();
        public ICollection<TaskEntity> Tasks { get; set; } = new List<TaskEntity>();
        public ICollection<ProjectAssignmentHistory> AssignmentHistory { get; set; } = new List<ProjectAssignmentHistory>();
        public ICollection<ProjectModule> Modules { get; set; } = new List<ProjectModule>();
    }

    public class ProjectMember
    {
        public int ProjectId { get; set; }
        public Project? Project { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }
        public string? RoleInProject { get; set; }
        public DateTime JoinedAt { get; set; } = AppClock.Now;
    }

    public class ProjectModule
    {
        public int ProjectId { get; set; }
        public Project? Project { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class TaskEntity
    {
        public int Id { get; set; }
        public string? Code { get; set; }          // TSK-PP-TT for top-level, SUB-PP-TT-SS for subtasks
        public int SeqNumber { get; set; }          // 1-based position within its scope (TT for tasks, SS for subtasks)
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Status { get; set; } = "new";
        public string Priority { get; set; } = "Medium";
        public int ProjectId { get; set; }
        public Project? Project { get; set; }
        public int? AssignedToId { get; set; }
        public User? AssignedTo { get; set; }
        public int CreatedById { get; set; }
        public User? CreatedBy { get; set; }
        public DateTime? DueDate { get; set; }
        public decimal? EstimatedHours { get; set; }
        public decimal? ActualHours { get; set; }
        public int Progress { get; set; } = 0;
        public string? Module { get; set; }
        public DateTime CreatedAt { get; set; } = AppClock.Now;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? StartedAt { get; set; }
        public int? StartedById { get; set; }
        public User? StartedBy { get; set; }
        public int? ParentTaskId { get; set; }
        public TaskEntity? ParentTask { get; set; }
        public bool RequiresQA { get; set; } = false;
        public int? QaAssigneeId { get; set; }
        public User? QaAssignee { get; set; }
        public ICollection<TaskEntity> ChildTasks { get; set; } = new List<TaskEntity>();
        public ICollection<TaskTag> Tags { get; set; } = new List<TaskTag>();
        public ICollection<TaskComment> Comments { get; set; } = new List<TaskComment>();
        public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
        public ICollection<TaskAssignmentHistory> AssignmentHistory { get; set; } = new List<TaskAssignmentHistory>();
        public ICollection<ChecklistItem> ChecklistItems { get; set; } = new List<ChecklistItem>();
        public ICollection<TaskBlockEntry> BlockEntries { get; set; } = new List<TaskBlockEntry>();
        public ICollection<TaskStatusHistory> StatusHistory { get; set; } = new List<TaskStatusHistory>();
    }

    public class TaskStatusHistory
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public TaskEntity? Task { get; set; }
        public string FromStatus { get; set; } = string.Empty;
        public string ToStatus { get; set; } = string.Empty;
        public int ChangedById { get; set; }
        public User? ChangedBy { get; set; }
        public string? Reason { get; set; }
        // Hours the user reports for the status being entered (ToStatus).
        // Compulsory except when entering new / paused / blocked.
        public decimal? ActualHours { get; set; }
        public DateTime ChangedAt { get; set; } = AppClock.Now;
    }

    public class TaskTag
    {
        public int TaskId { get; set; }
        public string Tag { get; set; } = string.Empty;
    }

    public class TaskComment
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = AppClock.Now;
    }

    public class Attachment
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public string FileType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public int UploadedById { get; set; }
        public User? UploadedBy { get; set; }
        public DateTime UploadedAt { get; set; } = AppClock.Now;
    }

    public class Activity
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string TargetType { get; set; } = string.Empty;
        public int TargetId { get; set; }
        public string TargetName { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = AppClock.Now;
    }

    public class PageModule
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Route { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class RolePagePermission
    {
        public int Id { get; set; }
        public int RoleId { get; set; }
        public Role? Role { get; set; }
        public int PageModuleId { get; set; }
        public PageModule? PageModule { get; set; }
        public int Permissions { get; set; }
    }

    public class UserPagePermission
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }
        public int PageModuleId { get; set; }
        public PageModule? PageModule { get; set; }
        public int Permissions { get; set; }
    }

    public class ProjectAssignmentHistory
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public Project? Project { get; set; }
        public int PreviousOwnerId { get; set; }
        public User? PreviousOwner { get; set; }
        public int NewOwnerId { get; set; }
        public User? NewOwner { get; set; }
        public int ChangedById { get; set; }
        public User? ChangedBy { get; set; }
        public DateTime ChangedAt { get; set; } = AppClock.Now;
        public string ReasonTag { get; set; } = string.Empty;
    }

    public class TaskAssignmentHistory
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public TaskEntity? Task { get; set; }
        public int? PreviousAssigneeId { get; set; }
        public User? PreviousAssignee { get; set; }
        public int? NewAssigneeId { get; set; }
        public User? NewAssignee { get; set; }
        public int ChangedById { get; set; }
        public User? ChangedBy { get; set; }
        public DateTime ChangedAt { get; set; } = AppClock.Now;
        public string ReasonTag { get; set; } = string.Empty;
    }

    public class ChecklistItem
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public string Title { get; set; } = string.Empty;
        public bool IsCompleted { get; set; }
        public DateTime? CompletedAt { get; set; }
        public int? CompletedById { get; set; }
        public User? CompletedBy { get; set; }
        public int OrderIndex { get; set; }
        public DateTime CreatedAt { get; set; } = AppClock.Now;
    }

    public class TaskBlockEntry
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public TaskEntity? Task { get; set; }
        public int BlockedById { get; set; }
        public User? BlockedBy { get; set; }
        public string BlockedByName { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public DateTime BlockedAt { get; set; } = AppClock.Now;
        public DateTime? ResolvedAt { get; set; }
    }

    public class ChatMessage
    {
        public int Id { get; set; }
        public string? Content { get; set; }
        public int SenderId { get; set; }
        public User Sender { get; set; } = null!;
        public DateTime SentAt { get; set; } = AppClock.Now;
        public string MessageType { get; set; } = "text";
        public bool IsDeleted { get; set; } = false;
        public int? ReplyToId { get; set; }
        public ChatMessage? ReplyTo { get; set; }
        public ChatAttachment? Attachment { get; set; }
        // null = global public channel
        public int? RoomId { get; set; }
        public ChatRoom? Room { get; set; }
    }

    public class ChatRoom
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        // "public" | "private" | "direct"
        public string RoomType { get; set; } = "public";
        public int CreatedById { get; set; }
        public User CreatedBy { get; set; } = null!;
        public DateTime CreatedAt { get; set; } = AppClock.Now;
        public ICollection<ChatRoomMember> Members { get; set; } = new List<ChatRoomMember>();
        public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
    }

    public class ChatRoomMember
    {
        public int RoomId { get; set; }
        public ChatRoom Room { get; set; } = null!;
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public DateTime JoinedAt { get; set; } = AppClock.Now;
    }

    public class ChatAttachment
    {
        public int Id { get; set; }
        public int MessageId { get; set; }
        public ChatMessage Message { get; set; } = null!;
        public string FileName { get; set; } = string.Empty;
        public string StoredFileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public string FileType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string MimeType { get; set; } = string.Empty;
    }

    public class WorkDiary
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }
        public DateTime Date { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? Category { get; set; }
        public decimal? HoursSpent { get; set; }
        public int? TaskId { get; set; }
        public TaskEntity? Task { get; set; }
        public DateTime CreatedAt { get; set; } = AppClock.Now;
        public DateTime UpdatedAt { get; set; } = AppClock.Now;
    }
}
