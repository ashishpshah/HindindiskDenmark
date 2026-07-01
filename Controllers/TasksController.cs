using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManagement.DTOs;
using TaskManagement.Services;
using TaskManagement.Data;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using IAuthorizationService = TaskManagement.Services.IAuthorizationService;

namespace TaskManagement.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TasksController : ControllerBase
    {
        private readonly ITaskService _taskService;
        private readonly IAuthorizationService _authService;
        private readonly PMSDbContext _context;

        public TasksController(ITaskService taskService, IAuthorizationService authService, PMSDbContext context)
        {
            _taskService = taskService;
            _authService = authService;
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<TaskDto>>>> GetAll(
            [FromQuery] string? status, [FromQuery] string? priority,
            [FromQuery] int? projectId, [FromQuery] int? assigneeId,
            [FromQuery] int page = 1, [FromQuery] int pageSize = 100)
        {
            if (!await _authService.CanViewAsync("/tasks"))
                return Forbid("You do not have permission to view tasks");
            var result = await _taskService.GetAllTasksAsync(status, priority, projectId, assigneeId, page, pageSize, HttpContext.RequestAborted);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<TaskDto>>> GetById(int id)
        {
            if (!await _authService.CanViewAsync("/tasks"))
                return Forbid("You do not have permission to view tasks");
            var result = await _taskService.GetTaskByIdAsync(id, HttpContext.RequestAborted);
            if (!result.Success) return NotFound(result);
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<TaskDto>>> Create(CreateTaskDto createTaskDto)
        {
            var userId = _authService.GetCurrentUserId();
            if (!await _authService.CanCreateAsync("/tasks"))
            {
                // Also allow project creator or current project owner
                var project = await _context.Projects.FindAsync(createTaskDto.ProjectId);
                if (project == null || (project.CreatedById != userId && project.OwnerId != userId))
                    return Forbid("You do not have permission to create tasks");
            }
            if (userId <= 0)
                return Unauthorized(new ApiResponse<TaskDto> { Success = false, Message = "Unable to determine current user" });
            var result = await _taskService.CreateTaskAsync(createTaskDto, userId);
            return CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<TaskDto>>> Update(int id, CreateTaskDto updateTaskDto)
        {
            var userId = _authService.GetCurrentUserId();
            if (!await _authService.CanUpdateAsync("/tasks"))
            {
                var task = await _taskService.GetTaskEntityAsync(id);
                if (task == null) return NotFound(new ApiResponse<TaskDto> { Success = false, Message = "Task not found" });
                var project = await _context.Projects.FindAsync(task.ProjectId);
                bool isTaskCreator = task.CreatedById == userId;
                bool isProjectOwnerOrCreator = project != null && (project.OwnerId == userId || project.CreatedById == userId);
                if (!isTaskCreator && !isProjectOwnerOrCreator)
                    return Forbid("You do not have permission to update this task");
            }
            var result = await _taskService.UpdateTaskAsync(id, updateTaskDto, userId);
            if (!result.Success)
                return result.ErrorCode == "FORBIDDEN" ? StatusCode(403, result) : BadRequest(result);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
        {
            var userId = _authService.GetCurrentUserId();
            if (!await _authService.CanDeleteAsync("/tasks"))
            {
                var task = await _taskService.GetTaskEntityAsync(id);
                if (task == null) return NotFound(new ApiResponse<bool> { Success = false, Message = "Task not found" });
                var project = await _context.Projects.FindAsync(task.ProjectId);
                bool isTaskCreator = task.CreatedById == userId;
                bool isProjectOwnerOrCreator = project != null && (project.OwnerId == userId || project.CreatedById == userId);
                if (!isTaskCreator && !isProjectOwnerOrCreator)
                    return Forbid("You do not have permission to delete this task");
            }
            var result = await _taskService.DeleteTaskAsync(id);
            if (!result.Success) return NotFound(result);
            return Ok(result);
        }

        [HttpPost("{id}/comments")]
        public async Task<ActionResult<ApiResponse<TaskCommentDto>>> AddComment(int id, [FromBody] CreateTaskCommentDto dto)
        {
            var userId = _authService.GetCurrentUserId();
            if (userId <= 0)
                return Unauthorized(new ApiResponse<TaskCommentDto> { Success = false, Message = "Unable to determine current user" });
            var task = await _taskService.GetTaskEntityAsync(id);
            if (task == null)
                return NotFound(new ApiResponse<TaskCommentDto> { Success = false, Message = "Task not found" });
            var project = await _context.Projects.FindAsync(task.ProjectId);
            var isProjectOwnerOrCreator = project != null && (project.OwnerId == userId || project.CreatedById == userId);
            if (task.CreatedById != userId && task.AssignedToId != userId && !isProjectOwnerOrCreator)
                return Forbid("Only the task creator, current assignee, or project owner/creator can comment on this task");
            var result = await _taskService.AddCommentAsync(id, dto, userId);
            if (!result.Success) return NotFound(result);
            return Ok(result);
        }

        [HttpGet("{id}/comments")]
        public async Task<ActionResult<ApiResponse<List<TaskCommentDto>>>> GetComments(
            int id,
            [FromQuery] int? userId,
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to)
        {
            if (!await _authService.CanViewAsync("/tasks"))
                return Forbid("You do not have permission to view task comments");
            var result = await _taskService.GetCommentsAsync(id, userId, from, to, HttpContext.RequestAborted);
            return Ok(result);
        }

        [HttpGet("dashboard-stats")]
        public async Task<ActionResult<ApiResponse<DashboardStatsDto>>> GetStats()
        {
            var result = await _taskService.GetDashboardStatsAsync(HttpContext.RequestAborted);
            return Ok(result);
        }

        [HttpPut("{id}/assign")]
        public async Task<ActionResult<ApiResponse<TaskDto>>> AssignTask(int id, [FromBody] int? assigneeId)
        {
            var userId = _authService.GetCurrentUserId();
            var task = await _taskService.GetTaskEntityAsync(id);
            if (task == null) return NotFound(new ApiResponse<TaskDto> { Success = false, Message = "Task not found" });
            if (task.CreatedById != userId)
                return Forbid("Only the task creator can assign this task");
            var result = await _taskService.AssignTaskAsync(id, assigneeId);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        [HttpPut("{id}/reassign")]
        public async Task<ActionResult<ApiResponse<TaskDto>>> ReassignTask(int id, [FromBody] ReassignTaskDto dto)
        {
            var userId = _authService.GetCurrentUserId();
            if (userId <= 0)
                return Unauthorized(new ApiResponse<TaskDto> { Success = false, Message = "Unable to determine current user" });
            var result = await _taskService.ReassignTaskAsync(id, dto, userId);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        [HttpPost("{id}/start")]
        public async Task<ActionResult<ApiResponse<TaskDto>>> StartTask(int id)
        {
            var userId = _authService.GetCurrentUserId();
            if (userId <= 0)
                return Unauthorized(new ApiResponse<TaskDto> { Success = false, Message = "Unable to determine current user" });
            var result = await _taskService.StartTaskAsync(id, userId);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        [HttpPut("{id}/status")]
        public async Task<ActionResult<ApiResponse<TaskDto>>> ChangeStatus(int id, [FromBody] ChangeStatusDto dto)
        {
            var userId = _authService.GetCurrentUserId();
            if (userId <= 0)
                return Unauthorized(new ApiResponse<TaskDto> { Success = false, Message = "Unable to determine current user" });
            var result = await _taskService.ChangeStatusAsync(id, dto, userId, await _authService.IsAdminAsync());
            if (!result.Success)
                return result.ErrorCode == "FORBIDDEN" ? StatusCode(403, result) : BadRequest(result);
            return Ok(result);
        }

        [HttpGet("{id}/status-history")]
        public async Task<ActionResult<ApiResponse<List<TaskStatusHistoryDto>>>> GetStatusHistory(int id)
        {
            if (!await _authService.CanViewAsync("/tasks"))
                return Forbid("You do not have permission to view task history");
            var result = await _taskService.GetStatusHistoryAsync(id, HttpContext.RequestAborted);
            return Ok(result);
        }

        [HttpGet("{id}/effort")]
        public async Task<ActionResult<ApiResponse<TaskEffortDto>>> GetEffort(int id)
        {
            if (!await _authService.CanViewAsync("/tasks"))
                return Forbid("You do not have permission to view task effort");
            var result = await _taskService.GetTaskEffortAsync(id, HttpContext.RequestAborted);
            if (!result.Success) return NotFound(result);
            return Ok(result);
        }

        // Org-wide effort summary for dashboard widgets. Optional UTC window [from, to).
        [HttpGet("effort-stats")]
        public async Task<ActionResult<ApiResponse<DashboardEffortDto>>> GetEffortStats(
            [FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            var result = await _taskService.GetEffortStatsAsync(from, to, HttpContext.RequestAborted);
            return Ok(result);
        }

        [HttpPost("{id}/qa/pass")]
        public async Task<ActionResult<ApiResponse<TaskDto>>> QaPass(int id)
        {
            var userId = _authService.GetCurrentUserId();
            if (userId <= 0)
                return Unauthorized(new ApiResponse<TaskDto> { Success = false, Message = "Unable to determine current user" });
            // QA approval is a reviewer action, not the assignee logging effort — no ActualHours required.
            var result = await _taskService.ChangeStatusAsync(id, new ChangeStatusDto { ToStatus = "completed" }, userId, await _authService.IsAdminAsync(), requireActualHours: false);
            if (!result.Success) return result.ErrorCode == "FORBIDDEN" ? StatusCode(403, result) : BadRequest(result);
            return Ok(result);
        }

        [HttpPost("{id}/qa/fail")]
        public async Task<ActionResult<ApiResponse<TaskDto>>> QaFail(int id, [FromBody] ChangeStatusDto dto)
        {
            var userId = _authService.GetCurrentUserId();
            if (userId <= 0)
                return Unauthorized(new ApiResponse<TaskDto> { Success = false, Message = "Unable to determine current user" });
            // QA rejection is a reviewer action — no ActualHours required.
            var result = await _taskService.ChangeStatusAsync(id, new ChangeStatusDto { ToStatus = "issues", Reason = dto?.Reason }, userId, await _authService.IsAdminAsync(), requireActualHours: false);
            if (!result.Success) return result.ErrorCode == "FORBIDDEN" ? StatusCode(403, result) : BadRequest(result);
            return Ok(result);
        }

        [HttpGet("{id}/assignment-history")]
        public async Task<ActionResult<ApiResponse<List<TaskAssignmentHistoryDto>>>> GetTaskAssignmentHistory(int id)
        {
            if (!await _authService.CanViewAsync("/tasks"))
                return Forbid("You do not have permission to view task history");
            var result = await _taskService.GetTaskAssignmentHistoryAsync(id, HttpContext.RequestAborted);
            return Ok(result);
        }

        // Returns true if userId is the task creator OR the project owner/creator
        private async Task<bool> HasTaskEditAccess(TaskEntity task, int userId)
        {
            if (task.CreatedById == userId) return true;
            var project = await _context.Projects.FindAsync(task.ProjectId);
            return project != null && (project.OwnerId == userId || project.CreatedById == userId);
        }

        [HttpPost("{id}/checklist")]
        public async Task<ActionResult<ApiResponse<ChecklistItemDto>>> AddChecklistItem(int id, [FromBody] CreateChecklistItemDto dto)
        {
            var userId = _authService.GetCurrentUserId();
            if (userId <= 0) return Unauthorized(new ApiResponse<ChecklistItemDto> { Success = false, Message = "Unable to determine current user" });
            var task = await _taskService.GetTaskEntityAsync(id);
            if (task == null) return NotFound(new ApiResponse<ChecklistItemDto> { Success = false, Message = "Task not found" });
            if (!await HasTaskEditAccess(task, userId))
                return Forbid("Only the task creator or project owner can add checklist items");
            var result = await _taskService.AddChecklistItemAsync(id, dto, userId);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        [HttpPut("{id}/checklist/{itemId}/toggle")]
        public async Task<ActionResult<ApiResponse<ChecklistItemDto>>> ToggleChecklistItem(int id, int itemId, [FromBody] ToggleChecklistItemDto dto)
        {
            var userId = _authService.GetCurrentUserId();
            if (userId <= 0)
                return Unauthorized(new ApiResponse<ChecklistItemDto> { Success = false, Message = "Unable to determine current user" });
            var result = await _taskService.ToggleChecklistItemAsync(id, itemId, dto.IsCompleted, userId);
            if (!result.Success) return result.Message?.Contains("permission") == true ? Forbid(result.Message) : NotFound(result);
            return Ok(result);
        }

        [HttpPut("{id}/checklist/{itemId}")]
        public async Task<ActionResult<ApiResponse<ChecklistItemDto>>> UpdateChecklistItem(int id, int itemId, [FromBody] UpdateChecklistItemDto dto)
        {
            var userId = _authService.GetCurrentUserId();
            if (userId <= 0) return Unauthorized(new ApiResponse<ChecklistItemDto> { Success = false, Message = "Unable to determine current user" });
            var task = await _taskService.GetTaskEntityAsync(id);
            if (task == null) return NotFound(new ApiResponse<ChecklistItemDto> { Success = false, Message = "Task not found" });
            if (!await HasTaskEditAccess(task, userId))
                return Forbid("Only the task creator or project owner can edit checklist items");
            var result = await _taskService.UpdateChecklistItemAsync(id, itemId, dto, userId);
            if (!result.Success) return NotFound(result);
            return Ok(result);
        }

        [HttpDelete("{id}/checklist/{itemId}")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteChecklistItem(int id, int itemId)
        {
            var userId = _authService.GetCurrentUserId();
            if (userId <= 0) return Unauthorized(new ApiResponse<bool> { Success = false, Message = "Unable to determine current user" });
            var task = await _taskService.GetTaskEntityAsync(id);
            if (task == null) return NotFound(new ApiResponse<bool> { Success = false, Message = "Task not found" });
            if (!await HasTaskEditAccess(task, userId))
                return Forbid("Only the task creator or project owner can delete checklist items");
            var result = await _taskService.DeleteChecklistItemAsync(id, itemId, userId);
            if (!result.Success) return NotFound(result);
            return Ok(result);
        }

        [HttpPost("{id}/checklist/mark-all-complete")]
        public async Task<ActionResult<ApiResponse<bool>>> MarkAllChecklistComplete(int id)
        {
            var userId = _authService.GetCurrentUserId();
            if (userId <= 0) return Unauthorized(new ApiResponse<bool> { Success = false, Message = "Unable to determine current user" });
            // P2-D: service enforces assignee-only rule; no redundant pre-check here
            var result = await _taskService.MarkAllChecklistCompleteAsync(id, userId);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        [HttpPut("{id}/block")]
        public async Task<ActionResult<ApiResponse<TaskDto>>> SetBlock(int id, [FromBody] SetTaskBlockDto dto)
        {
            var userId = _authService.GetCurrentUserId();
            if (userId <= 0)
                return Unauthorized(new ApiResponse<TaskDto> { Success = false, Message = "Unable to determine current user" });
            var result = await _taskService.SetTaskBlockAsync(id, dto, userId);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        [HttpGet("{id}/block-entries")]
        public async Task<ActionResult<ApiResponse<List<TaskBlockEntryDto>>>> GetBlockEntries(int id)
        {
            if (!await _authService.CanViewAsync("/tasks"))
                return Forbid("You do not have permission to view task details");
            var result = await _taskService.GetTaskBlockEntriesAsync(id, HttpContext.RequestAborted);
            return Ok(result);
        }
    }
}
