# Code Review Findings — PMS (Project & Task Management System)

**Review Date:** 2026-06-29  
**Stack:** ASP.NET Core 6 + React 19 + TypeScript + EF Core + SQL Server + SignalR  
**Scope:** Backend (C#), Frontend (TypeScript/React), Security, Performance, Architecture

---

## Prioritized Improvement Plan

### Quick Wins (fix in hours, high impact)
- F-02: Remove plaintext DB credentials from `appsettings.json`
- F-01: Add `[Authorize]` to `AuthController.reset-password`
- F-05: Remove inactive-user login bypass
- F-15: Add `[Authorize]` at controller class level for all controllers
- F-03: Add environment guard around Swagger
- F-20: Remove hardcoded "123456" reset password

### Systemic Architectural Concerns
- F-07: `AuthorizationService` uses blocking synchronous EF calls — affects every authenticated request
- F-09: No transaction wrapping on multi-step operations — data integrity risk throughout
- F-11: Entire dataset loaded into memory for effort/report queries — won't scale
- F-22: No pagination on any list endpoints — memory and latency scale with data
- F-23: `DataContext` loads all data on login — O(users × tasks × projects) waterfall per session

---

## CRITICAL

---

### F-01 — Unauthenticated Password Reset Endpoint

- **Severity:** Critical
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Security
- **Location:**
  - File: `Controllers/AuthController.cs`
  - Class: `AuthController`
  - Method: `ResetPassword` (line 92)
- **Problem:** `POST /api/auth/reset-password` accepts an email and a new password with no authentication token, no authorization check, and no rate limiting. Any unauthenticated caller on the internet can reset any user's password by knowing only their email address.
- **Impact:** Complete account takeover for any user whose email is known. Bypasses all authentication.
- **Recommendation:** Remove this endpoint entirely or add `[Authorize]` plus a role guard. A proper flow would use a time-limited token sent to the registered email address. At minimum, require a valid Bearer token and restrict to admins only.

---

### F-02 — Production Database Credentials in Source-Controlled Config File

- **Severity:** Critical
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Security
- **Location:**
  - File: `appsettings.json` line 4
- **Problem:** The production SQL Server connection string contains a plaintext username and password (`User ID=vishaldemo_db;Password=Fz@21345`). This file is committed to the repository. Anyone with repo read access has the production database password.
- **Impact:** Full database read/write access to production data. Credential leakage via git log is permanent even after removal.
- **Recommendation:** Move secrets to environment variables, Azure Key Vault, or `dotnet user-secrets`. Replace the connection string value with a placeholder: `"DefaultConnection": "#{DB_CONNECTION}#"`. Rotate the exposed credentials immediately.

---

### F-03 — Swagger Exposed in Production

- **Severity:** Critical
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Security
- **Location:**
  - File: `Program.cs` lines 137–138
- **Problem:** `app.UseSwagger()` and `app.UseSwaggerUI()` are called unconditionally, meaning Swagger is available in production. This exposes the full API surface, request schemas, and auth requirements to attackers.
- **Impact:** API reconnaissance attack surface. Attackers can discover all endpoints, parameters, and try automated exploitation.
- **Recommendation:**
  ```csharp
  if (app.Environment.IsDevelopment())
  {
      app.UseSwagger();
      app.UseSwaggerUI();
  }
  ```

---

### F-04 — Client-Controlled Comment Author Identity

- **Severity:** Critical
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Security / Bug
- **Location:**
  - File: `DTOs/GeneralDtos.cs` — `CreateTaskCommentDto` (line 325)
  - File: `Controllers/TasksController.cs` — `AddComment` (line 104)
  - File: `ClientApp/src/services/task.service.ts` — `addComment` (line 358)
- **Problem:** `CreateTaskCommentDto` exposes `UserId` and `UserName` as client-supplied body fields. The frontend sends the currently logged-in user's ID and name from local state. The backend saves these directly without verifying that the submitted `UserId` matches the JWT token's subject claim. Any user can forge another user's identity in comments by submitting a different `UserId`.
- **Impact:** Comment spoofing — an attacker can post comments that appear to be authored by any user, including managers or admins.
- **Recommendation:** Remove `UserId` and `UserName` from `CreateTaskCommentDto`. Derive both from the JWT claim inside the controller:
  ```csharp
  var userId = _authService.GetCurrentUserId();
  // pass userId to service; let service look up FullName from DB
  ```

---

### F-05 — Inactive Users Can Log In

- **Severity:** Critical
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Security / Bug
- **Location:**
  - File: `Services/AuthService.cs`
  - Class: `AuthService`
  - Method: `LoginAsync` (line 32)
- **Problem:** `LoginAsync` checks the user's password but never checks `user.IsActive`. A user who has been deactivated (soft-deleted via `UserService.DeleteUserAsync`) can still authenticate and receive a valid JWT token.
- **Impact:** Terminated or suspended accounts retain full system access indefinitely.
- **Recommendation:** Add after the null/password check:
  ```csharp
  if (!user.IsActive)
      return new ApiResponse<LoginResponseDto> { Success = false, Message = "Invalid username/email or password" };
  ```

---

### F-06 — Hardcoded JWT Key in appsettings.json and Code

- **Severity:** Critical
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Security
- **Location:**
  - File: `appsettings.json` line 8
  - File: `Program.cs` line 22
  - File: `Services/AuthService.cs` line 156
- **Problem:** The JWT signing key `"PMS_Secure_Key_For_JWT_Token_2024_MinLength32Chars"` is hardcoded in three places — including the source file `AuthService.cs` itself. Both `Program.cs` and `AuthService.cs` independently fall back to this hardcoded literal if the config key is missing. Additionally, `AuthService.GenerateJwtToken` hardcodes the issuer/audience as `"PMS"` instead of reading from configuration, causing a mismatch if config values are ever changed.
- **Impact:** Any attacker who reads the source code (public repo, insider threat) can forge valid JWTs for any user.
- **Recommendation:** Use a cryptographically random 256-bit key, stored in secrets management. Remove the fallback literals. Consolidate token generation in `JwtService` (which already reads from config) and inject it where needed. Delete the duplicate `GenerateJwtToken` from `AuthService`.

---

## HIGH

---

### F-07 — Blocking Synchronous EF Core Calls in AuthorizationService

- **Severity:** High
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Performance / Bug
- **Location:**
  - File: `Services/AuthorizationService.cs`
  - Class: `AuthorizationService`
  - Methods: `IsSystemAdmin`, `IsAdmin`, `CanView`, `HasPermission`
- **Problem:** All four methods call `_context.Users.FirstOrDefault(...)`, `_context.PageModules.FirstOrDefault(...)`, and `_context.RolePagePermissions.FirstOrDefault(...)` synchronously. In ASP.NET Core, calling synchronous EF Core database operations blocks a thread pool thread for the entire DB round-trip. Each authenticated request runs 3–5 blocking DB calls.
- **Impact:** Thread pool starvation under moderate load. Response time degrades non-linearly as concurrent requests increase. Can cause 503 errors before the server is meaningfully saturated.
- **Recommendation:** Make the interface and implementations fully async:
  ```csharp
  Task<bool> CanViewAsync(string pageRoute);
  // ...
  public async Task<bool> CanViewAsync(string pageRoute)
  {
      var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == userId);
      // ...
  }
  ```

---

### F-08 — No `[Authorize]` Attribute on Controllers

- **Severity:** High
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Security
- **Location:**
  - File: `Controllers/TasksController.cs`
  - File: `Controllers/UsersController.cs`
  - File: `Controllers/ProjectsController.cs`
  - File: `Controllers/RolesController.cs`
  - File: `Controllers/ReportsController.cs`
  - File: `Controllers/ActivitiesController.cs`
- **Problem:** None of these controllers carry `[Authorize]`. The security model relies entirely on manual `_authService.CanView(...)` checks within each action method. Any action that forgets the check is unprotected. Some endpoints (`dashboard-stats`, `effort-stats`) have no permission check at all.
- **Impact:** Missing permission checks on any new endpoint go unnoticed. `GET /api/tasks/dashboard-stats` and `GET /api/tasks/effort-stats` are publicly accessible without any token.
- **Recommendation:** Add `[Authorize]` at the controller class level as a security baseline. Use `[AllowAnonymous]` only where intentionally public. The custom permission system then provides RBAC on top of baseline authentication.

---

### F-09 — Multiple SaveChangesAsync Calls Without Transactions

- **Severity:** High
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Bug / Resilience
- **Location:**
  - File: `Services/TaskService.cs`
  - Methods: `ReassignTaskAsync` (lines 499–530), `SetTaskBlockAsync` (lines 1358–1407), `ToggleChecklistItemAsync` (lines 1131–1155), `AddChecklistItemAsync` (lines 1086–1102)
- **Problem:** Several service methods call `SaveChangesAsync()` multiple times in sequence. If the second save fails (DB error, constraint violation, network blip), the first write is already committed, leaving the database in a partial state. Example: In `ReassignTaskAsync`, block entries are resolved and saved, then the activity log is added and saved separately — a failure between these leaves the task unblocked but without an audit trail.
- **Impact:** Data inconsistency and incomplete audit logs in production. Silent partial commits are hard to diagnose.
- **Recommendation:** Wrap multi-step operations in `IDbContextTransaction`:
  ```csharp
  await using var tx = await _context.Database.BeginTransactionAsync();
  // ... all changes ...
  await _context.SaveChangesAsync();
  await tx.CommitAsync();
  ```

---

### F-10 — Entire Effort History Loaded into Memory

- **Severity:** High
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Performance
- **Location:**
  - File: `Services/TaskService.cs` — `GetEffortStatsAsync` (lines 774–889)
  - File: `Services/ReportService.cs` — `GetUserEffortReportAsync` (lines 40–50)
- **Problem:** Both methods load ALL `TaskStatusHistories` and ALL `TaskAssignmentHistories` into memory with `.ToListAsync()`, then perform in-memory grouping and calculation. With thousands of tasks, each having dozens of history entries, this materializes potentially millions of rows.
- **Impact:** High memory pressure and long response times as data grows. Can OOM the process. The dashboard panel calls this on every page load.
- **Recommendation:** Push aggregation to SQL. Date-window filtering should be applied in the query:
  ```csharp
  var statusRows = await _context.TaskStatusHistories
      .Where(h => h.ChangedAt >= winStart && h.ChangedAt <= winEnd)
      .OrderBy(h => h.TaskId).ThenBy(h => h.ChangedAt)
      .ToListAsync();
  ```
  Consider a materialized view or a dedicated `DailyEffortSummary` table populated by a background job.

---

### F-11 — No Pagination on Any List Endpoint

- **Severity:** High
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Performance / Architecture
- **Location:**
  - File: `Controllers/TasksController.cs` — `GetAll`
  - File: `Controllers/UsersController.cs` — `GetAll`
  - File: `Controllers/ActivitiesController.cs`
  - File: `Services/TaskService.cs` — `GetAllTasksAsync`
- **Problem:** `GET /api/tasks` returns every task with all nested includes (comments, checklist items, tags, block entries, assignment history). This is an unbounded query. With 1000 tasks, 20 comments each, 10 checklist items each, the EF query and JSON payload grow proportionally.
- **Impact:** Increasing latency and memory per request as data grows. Eventually causes timeouts.
- **Recommendation:** Add `page`/`pageSize` query parameters to all list endpoints. Return `{ data: T[], total: int, page: int, pageSize: int }`. Adjust the frontend DataContext to use lazy loading or server-side filtering rather than loading all data into a global store.

---

### F-12 — GetRoomsForUserAsync Loads All Room Messages

- **Severity:** High
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Performance
- **Location:**
  - File: `Services/ChatService.cs`
  - Method: `GetRoomsForUserAsync` (line 67)
- **Problem:** The query includes `.Include(r => r.Messages.Where(m => !m.IsDeleted)).ThenInclude(m => m.Sender)` which loads ALL non-deleted messages for every room. Only the last message is actually used (`last = r.Messages.OrderByDescending(...).FirstOrDefault()`).
- **Impact:** For rooms with thousands of messages, this loads the full message history into memory just to display the room list.
- **Recommendation:** Use a SQL MAX/subquery instead:
  ```csharp
  .Select(r => new {
      Room = r,
      LastMessage = r.Messages.Where(m => !m.IsDeleted)
                               .OrderByDescending(m => m.SentAt).FirstOrDefault()
  })
  ```

---

### F-13 — RecalculateTaskProgressAsync Auto-Advance Bypasses Role/Hours Gates

- **Severity:** High
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Bug / Security
- **Location:**
  - File: `Services/TaskService.cs`
  - Method: `RecalculateTaskProgressAsync` (lines 1469–1478)
- **Problem:** When all checklist items are checked, `RecalculateTaskProgressAsync` automatically changes the task status from `"in-progress"` to `"under-review"` by directly writing to `task.Status` and adding a `TaskStatusHistory` row — bypassing `ValidateStatusTransition`, the ActualHours requirement, and role gates. Similarly, unchecking an item while `"under-review"` auto-reverts to `"in-progress"` bypassing the manager gate.
- **Impact:** Checklist toggles can move tasks into states that are supposed to require ActualHours or manager approval. The status history for auto-transitions has no ActualHours recorded.
- **Recommendation:** Call `ChangeStatusAsync` instead of directly setting `task.Status`, passing `requireActualHours: false` for the auto-submit case. Or decouple progress from status — only compute progress, let the UI surface a "Submit for Review" button when 100%.

---

### F-14 — Task Unblocking on Reassign Silently Moves Status from "blocked" to "new"

- **Severity:** High
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Bug
- **Location:**
  - File: `Services/TaskService.cs`
  - Method: `ReassignTaskAsync` (line 497)
- **Problem:** When a task is reassigned while in `"blocked"` status, the code sets status to `"new"` if `StartedAt == null`, or `"in-progress"` otherwise. It does not create a `TaskStatusHistory` entry for this transition, so the status change is invisible in audit history.
- **Impact:** The Kanban board shows the task under a different column with no history of the status change.
- **Recommendation:** Add a `TaskStatusHistory` entry when auto-resolving the blocked status during reassignment:
  ```csharp
  _context.TaskStatusHistories.Add(new TaskStatusHistory {
      TaskId = taskId, FromStatus = "blocked",
      ToStatus = task.Status, ChangedById = changedById,
      Reason = "Reassigned", ChangedAt = AppClock.Now
  });
  ```

---

### F-15 — Reset Password Sets Hardcoded Weak Password

- **Severity:** High
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Security
- **Location:**
  - File: `Controllers/UsersController.cs`
  - Method: `ResetPassword` (line 113)
- **Problem:** The admin password-reset endpoint forces the target user's password to the literal string `"123456"` and returns this in the response body. This is an extremely weak credential that is the same for every reset.
- **Impact:** After an admin-triggered reset, the account is secured by a commonly-known password. If the user doesn't change it immediately, an attacker who knows a reset happened can access the account.
- **Recommendation:** Generate a cryptographically random temporary password, or use a self-service reset flow where a token is emailed to the user. If admin-forced reset is required, generate a random password and return it once:
  ```csharp
  var tempPassword = Convert.ToBase64String(RandomNumberGenerator.GetBytes(12));
  target.PasswordHash = PasswordHasher.HashPassword(tempPassword);
  ```

---

### F-16 — Username/Email Enumeration via Unauthenticated Endpoint

- **Severity:** High
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Security
- **Location:**
  - File: `Controllers/AuthController.cs`
  - Method: `CheckAvailability` (line 40)
- **Problem:** `GET /api/auth/check-availability?userName=alice` is publicly accessible without authentication. An attacker can enumerate every valid username and email address in the system by making automated requests.
- **Impact:** User enumeration enables targeted phishing, credential stuffing, and social engineering attacks.
- **Recommendation:** Require authentication (`[Authorize]`) for this endpoint so only logged-in users (e.g., admins creating new accounts) can check availability. Add rate limiting.

---

### F-17 — File Upload MIME Type Not Server-Validated

- **Severity:** High
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Security
- **Location:**
  - File: `Services/ChatService.cs`
  - Method: `ValidateFile` (line 269), `SaveAttachmentAsync` (line 221)
- **Problem:** File validation checks only the file extension from the client-provided filename. The `MimeType` is taken directly from `file.ContentType`, which is set by the client and can be forged. A malicious actor can rename a script file to `.jpg` and upload it. The extension check is the only gate.
- **Impact:** Potential stored cross-site scripting or server-side code execution depending on how files are served.
- **Recommendation:** Inspect the file's magic bytes (first few bytes) to verify the actual file type, regardless of what the client claims. Use a library like `MimeKit` or a custom magic-byte check. Also ensure uploaded files are never served with executable MIME types.

---

### F-18 — DataContext Loads All Data on Every Login

- **Severity:** High
- **Actionable:** Yes
- **Architecture:** Frontend
- **Category:** Performance / Architecture
- **Location:**
  - File: `ClientApp/src/context/DataContext.tsx`
  - Method: `fetchData` (line 75)
- **Problem:** On every login (and whenever `currentUser`, `isSystemAdmin`, or `isAdmin` changes), the context simultaneously fetches ALL projects, ALL tasks, ALL users, ALL assignable users, and ALL activities. Every checklist mutation also calls `taskService.getById(taskId)` to refresh a single task.
- **Impact:** The initial load waterfall fetches the entire dataset regardless of what the user views. As data grows (thousands of tasks, hundreds of users), load time and memory usage become unacceptable.
- **Recommendation:** Move to server-side filtering with pagination. Each page fetches only the data it needs. Replace the global context store with query-scoped state (React Query / SWR). Remove the `taskService.getById` calls after mutations — update state optimistically or use the data returned by the mutating endpoint.

---

### F-19 — `AuthorizationService.HasPermission` Runs 3 DB Queries Per Call

- **Severity:** High
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Performance
- **Location:**
  - File: `Services/AuthorizationService.cs`
  - Methods: `CanView`, `HasPermission`
- **Problem:** Each `CanView` or `CanCreate/Update/Delete` call runs: (1) load user + role, (2) load page module, (3) load role permission, (4) optionally load user permission. A controller action calling `CanView` + `CanCreate` runs 6+ sequential DB queries before the actual business logic begins. These are also synchronous (see F-07).
- **Impact:** Every API request has 3–6 additional blocking DB round-trips before useful work begins.
- **Recommendation:** Cache the current user's permissions for the lifetime of the HTTP request (use `IMemoryCache` keyed by `userId + route`, with a short TTL) or load them once per request via a middleware/action filter.

---

## MEDIUM

---

### F-20 — Dead Code: `JwtService` Is Never Registered or Used

- **Severity:** Medium
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Maintainability
- **Location:**
  - File: `Services/JwtService.cs`
  - Class: `JwtService`
- **Problem:** `JwtService` is defined but never registered in DI (`Program.cs`) and never injected anywhere. `AuthService` contains its own independent `GenerateJwtToken` method that duplicates the logic. Additionally, `JwtService.GenerateToken` reads `jwtSettings["Key"]` without null checking, which would throw `NullReferenceException` if called.
- **Impact:** Maintenance confusion — developers reading the code may assume `JwtService` is the canonical token generator when it isn't.
- **Recommendation:** Delete `JwtService`. Consolidate token generation into one well-tested location (or keep it in `AuthService`). Verify `JwtService.cs` also contains `PasswordHasher` — if so, move `PasswordHasher` to its own file with a clear name.

---

### F-21 — Controllers Inject `PMSDbContext` Directly

- **Severity:** Medium
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Architecture
- **Location:**
  - File: `Controllers/TasksController.cs` (line 19)
  - File: `Controllers/UsersController.cs` (line 20)
  - File: `Controllers/AuthController.cs` (line 17)
- **Problem:** Controllers directly inject and use `PMSDbContext` to perform database operations (project lookups in `TasksController`, user lookups in `AuthController`, password reset in `UsersController`). Business logic that belongs in services leaks into the controller layer, making it untestable and creating two paths to the data layer.
- **Impact:** No separation of concerns. Bypasses the service layer's validation and auditing. Makes unit testing controllers impossible without mocking EF Core.
- **Recommendation:** Move all DB interactions out of controllers into the appropriate service (e.g., `TaskService`, `UserService`, `AuthService`). Controllers should only call services and translate between HTTP results and service responses.

---

### F-22 — Error Message Parsing to Determine HTTP Status Code

- **Severity:** Medium
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Architecture / Maintainability
- **Location:**
  - File: `Controllers/TasksController.cs`
  - Methods: `Update` (line 77), `ChangeStatus` (line 185), `QaPass` (line 228), `QaFail` (line 240)
- **Problem:** Controllers infer the HTTP status code by inspecting the error message string (e.g., `result.Message.Contains("Only the", ...)`, `result.Message.StartsWith("Only")`). This couples the HTTP response semantics to English prose, breaks if the message is localized or reformatted, and requires every caller to know the message pattern.
- **Impact:** Brittle mapping. A typo in the service message changes the HTTP status code silently. Internationalization breaks it entirely.
- **Recommendation:** Return a typed error result from services:
  ```csharp
  public enum ServiceErrorCode { NotFound, Forbidden, InvalidInput, Conflict }
  public class ApiResponse<T> { public ServiceErrorCode? ErrorCode { get; set; } ... }
  ```
  Map error codes to HTTP status codes in the controller, not message strings.

---

### F-23 — Mutable Set in `useState` (React Anti-Pattern)

- **Severity:** Medium
- **Actionable:** Yes
- **Architecture:** Frontend
- **Category:** Bug
- **Location:**
  - File: `ClientApp/src/context/DataContext.tsx` line 62
- **Problem:** `const [shownAlerts] = useState<Set<string>>(new Set())` creates a `Set` reference that is never replaced — the set is mutated in-place (`shownAlerts.add(alertKey)` at lines 162, 180). React uses reference equality to detect state changes; since the reference never changes, React cannot track that the set has grown. Additionally, the `Set` is not in the `useEffect` dependency array, so the effect captures a stale closure.
- **Impact:** The deduplication logic for notifications is unreliable. Alerts may fire multiple times or never.
- **Recommendation:** Use a `useRef` for the mutable set (mutation doesn't need to trigger re-renders):
  ```tsx
  const shownAlertsRef = useRef(new Set<string>());
  // Usage:
  if (!shownAlertsRef.current.has(alertKey)) {
      shownAlertsRef.current.add(alertKey);
      setActiveAlert(newNotif);
  }
  ```

---

### F-24 — No CancellationToken Propagation

- **Severity:** Medium
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Resilience / Performance
- **Location:**
  - File: All service methods and controller actions
- **Problem:** No async method accepts or propagates `CancellationToken`. When a client disconnects mid-request (browser tab closed, timeout), the server-side EF Core queries continue to run to completion, wasting DB connections and compute.
- **Impact:** Under load with slow queries, abandoned requests accumulate held DB connections.
- **Recommendation:** Add `CancellationToken cancellationToken = default` to all controller actions and pass it to `ToListAsync(cancellationToken)`, `SaveChangesAsync(cancellationToken)`, etc.

---

### F-25 — Notification Sound Loaded from External CDN

- **Severity:** Medium
- **Actionable:** Yes
- **Architecture:** Frontend
- **Category:** Security / Resilience
- **Location:**
  - File: `ClientApp/src/context/DataContext.tsx` line 68
- **Problem:** `new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')` — an audio asset is loaded from a third-party CDN on every notification. This creates: (a) a dependency on external CDN availability, (b) a CSP violation risk, (c) potential privacy concern (outbound request exposes user activity to a third party).
- **Impact:** If the CDN is down or blocks the request, errors are silently swallowed — but every notification attempt still creates a failed network request visible in DevTools.
- **Recommendation:** Bundle the audio file in `ClientApp/public/` and reference it with a relative path: `new Audio('/notification.mp3')`.

---

### F-26 — `ChatHub.OnlineUsers` Is In-Process Static State

- **Severity:** Medium
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Architecture / Resilience
- **Location:**
  - File: `Hubs/ChatHub.cs` line 14
- **Problem:** `private static readonly ConcurrentDictionary<string, OnlineUserDto> OnlineUsers` stores online user state in-process static memory. In a multi-instance deployment (Azure App Service with 2+ instances, containers, etc.), each instance has its own dictionary, so users on different instances appear offline to each other.
- **Impact:** Incorrect online/offline presence in multi-instance deployments. Scaling out the app immediately breaks the feature.
- **Recommendation:** Configure a SignalR backplane (Redis or Azure SignalR Service): `builder.Services.AddSignalR().AddStackExchangeRedis(...)`. Move presence tracking to a shared store (Redis hash or dedicated table).

---

### F-27 — `DataContext` Effect Dependencies Suppress Warning

- **Severity:** Medium
- **Actionable:** Yes
- **Architecture:** Frontend
- **Category:** Bug / Correctness
- **Location:**
  - File: `ClientApp/src/context/DataContext.tsx` line 113
  - File: `ClientApp/src/context/ChatContext.tsx` line 188
- **Problem:** Both contexts use `// eslint-disable-next-line react-hooks/exhaustive-deps` to suppress exhaustive-deps warnings on `useEffect`. In `DataContext`, the effect depends on `currentUser`, `isSystemAdmin`, and `isAdmin` but `fetchData` is defined inside the component and captures all context variables — this could cause stale closures if `fetchData` is ever memoized.
- **Impact:** Potential for stale data fetching when user permissions change, or missing re-fetches when the dependency array is too narrow.
- **Recommendation:** Address the root cause rather than suppressing the warning. Wrap `fetchData` in `useCallback` with proper dependencies, or move the data fetching concern to a dedicated hook.

---

### F-28 — `MarkAllChecklistComplete` Controller/Service Permission Mismatch

- **Severity:** Medium
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Bug
- **Location:**
  - File: `Controllers/TasksController.cs` — `MarkAllChecklistComplete` (line 314)
  - File: `Services/TaskService.cs` — `MarkAllChecklistCompleteAsync` (line 1237)
- **Problem:** The controller allows task creator or project owner (`HasTaskEditAccess`). The service only allows the current assignee (`task.AssignedToId != userId`). A project owner who is not the assignee passes the controller check but fails the service check, receiving a 400 with a confusing "Only the current assignee" message. Conversely, the assignee is not checked at the controller level.
- **Impact:** The permission model is inconsistent. Project owners get an opaque 400 error. The service's real permission check is hidden from the controller.
- **Recommendation:** Align both layers. Decide the canonical rule (assignee only, or assignee/manager?) and enforce it in one place — ideally the service, with the controller relying on the service's response to emit the right HTTP status.

---

### F-29 — `GetOrCreateDirectRoomAsync` Count Check May Not Translate to SQL

- **Severity:** Medium
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Bug / Performance
- **Location:**
  - File: `Services/ChatService.cs`
  - Method: `GetOrCreateDirectRoomAsync` (line 124)
- **Problem:** The LINQ expression `.Where(r => ... && r.Members.Count() == 2)` applies `Count()` on a navigation property collection inside a `Where` clause. EF Core may not translate this to SQL and may instead evaluate it in-memory by loading all members for all "direct" rooms — or throw a translation error at runtime.
- **Impact:** Either an unhandled runtime exception or loading all chat room members into memory on every direct-message lookup.
- **Recommendation:** Rewrite using `.Select` with a count subquery:
  ```csharp
  .Where(r => r.RoomType == "direct"
      && r.Members.Any(m => m.UserId == userId)
      && r.Members.Any(m => m.UserId == otherUserId)
      && r.Members.Count() == 2)
  ```
  Test that EF Core generates valid SQL; if not, use `FromSqlRaw` or a raw count subquery.

---

### F-30 — `AssignTaskAsync` Does Not Record Assignment History

- **Severity:** Medium
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Bug / Architecture
- **Location:**
  - File: `Services/TaskService.cs`
  - Method: `AssignTaskAsync` (line 416)
- **Problem:** `AssignTaskAsync` updates `task.AssignedToId` directly without creating a `TaskAssignmentHistory` record and without validating a `ReasonTag`. It is a separate endpoint (`PUT /tasks/{id}/assign`) from `ReassignTaskAsync`. The existence of two assignment paths (one with audit, one without) can lead to untracked reassignments.
- **Impact:** Some assignments bypass the audit trail entirely, making the assignment history incomplete.
- **Recommendation:** Consolidate assignment into a single path. Either remove `AssignTaskAsync` / `PUT /tasks/{id}/assign` and direct all callers through `ReassignTaskAsync`, or add history creation to `AssignTaskAsync`.

---

### F-31 — `IsMemberAsync` Loads Entire Room to Check Membership

- **Severity:** Medium
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Performance
- **Location:**
  - File: `Services/ChatService.cs`
  - Method: `IsMemberAsync` (line 149)
- **Problem:** `IsMemberAsync` loads the entire `ChatRoom` with all members just to check if a user is a member. This runs on every SignalR `SendMessage` and `JoinRoom` call.
- **Impact:** Unnecessary data load on the most frequent chat operation.
- **Recommendation:**
  ```csharp
  public async Task<bool> IsMemberAsync(int roomId, int userId)
  {
      var room = await _db.ChatRooms.Select(r => new { r.Id, r.RoomType }).FirstOrDefaultAsync(r => r.Id == roomId);
      if (room == null) return false;
      if (room.RoomType == "public") return true;
      return await _db.ChatRoomMembers.AnyAsync(m => m.RoomId == roomId && m.UserId == userId);
  }
  ```

---

### F-32 — `ReasonTags.Valid` Is an Array — Linear Scan on Every Validation

- **Severity:** Medium
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Performance / Maintainability
- **Location:**
  - File: `DTOs/GeneralDtos.cs` lines 9–13
  - File: `Services/TaskService.cs` line 466
- **Problem:** `ReasonTags.Valid` is a `string[]`. `ReasonTags.Valid.Contains(dto.ReasonTag)` uses a linear O(n) scan. While the array is small (8 items), the method is also not case-insensitive — if the client sends `"resignation"` (lowercase), the check fails even though "Resignation" is valid.
- **Impact:** Case-sensitive mismatch causes validation failures for otherwise valid inputs. Minor performance issue.
- **Recommendation:**
  ```csharp
  public static readonly HashSet<string> Valid = new(StringComparer.OrdinalIgnoreCase)
  {
      "Resignation", "Workload Balancing", "Management Decision", "Unavailability",
      "No Resource", "Unable to Complete", "Admin Decision", "Other"
  };
  ```

---

### F-33 — `AuthController.Validate` Admin Check Uses `user.Id == 1`

- **Severity:** Medium
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Bug
- **Location:**
  - File: `Controllers/AuthController.cs`
  - Method: `Validate` (line 78)
- **Problem:** `IsAdmin = user.Id == 1 || (user.Role?.IsAdmin ?? false)` — uses `user.Id` (primary key of the user row) instead of `user.RoleId` to check for system admin. All other admin checks use `user.RoleId == 1`. This check will incorrectly mark user with database ID 1 as admin regardless of their role, and would incorrectly fail to mark a system admin whose user row happens to have a different auto-assigned ID (e.g., after a DB migration).
- **Impact:** Incorrect `isAdmin` flag returned to the frontend on token validation.
- **Recommendation:** Change to `IsAdmin = user.RoleId == 1 || (user.Role?.IsAdmin ?? false)` to match the pattern used everywhere else.

---

### F-34 — File Download Does Not Validate Path is Within wwwroot

- **Severity:** Medium
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Security
- **Location:**
  - File: `Controllers/ChatController.cs`
  - Method: `DownloadFile` (line 71)
- **Problem:** The file path is reconstructed as `Path.Combine(env.WebRootPath, attachment.FilePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar))`. While `FilePath` is server-generated, the attachment record is retrieved from the database by ID without verifying the caller has access to that attachment or that the path stays within `wwwroot`.
- **Impact:** If a `FilePath` record were manipulated (e.g., via SQL injection or direct DB access), the endpoint could serve arbitrary files from the server's filesystem. Also, there is no authorization check — any authenticated user can download any attachment by ID.
- **Recommendation:** Validate that the absolute path starts with `env.WebRootPath` after resolution:
  ```csharp
  var resolved = Path.GetFullPath(absolutePath);
  if (!resolved.StartsWith(Path.GetFullPath(env.WebRootPath)))
      return BadRequest();
  ```

---

## LOW

---

### F-35 — `FullName` Denormalized Across Multiple Tables

- **Severity:** Low
- **Actionable:** No
- **Architecture:** Database
- **Category:** Architecture / Maintainability
- **Location:**
  - File: `Data/PMSDbContext.cs` — `Activity`, `TaskBlockEntry`
  - File: `Services/TaskService.cs` — multiple
- **Problem:** `Activity.UserName`, `TaskBlockEntry.BlockedByName`, and similar fields store denormalized name data. If a user's name changes via `UpdateUserAsync`, historical activity records and block entries retain the old name.
- **Impact:** Stale display names in audit logs and activity feeds after a name change.
- **Recommendation:** Accept the denormalization as a deliberate audit-log choice (store name at time of event) and document it, or normalize by only storing the user ID and joining on read.

---

### F-36 — `UsersController.GetAssignable` Returns All Users Including SystemAdmin

- **Severity:** Low
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Bug
- **Location:**
  - File: `Controllers/UsersController.cs`
  - Method: `GetAssignable` (line 43)
- **Problem:** `GetAll` filters out users with `Id <= 1`, but `GetAssignable` returns all users without this filter. The SystemAdmin user appears in the assignee dropdown.
- **Impact:** Tasks can be assigned to the SystemAdmin account, which is a non-human system account.
- **Recommendation:** Apply the same `Id > 1` filter to `GetAssignable`, or introduce an explicit `IsAssignable` flag on the `User` entity.

---

### F-37 — `AuthService.RegisterAsync` Does Not Validate Email Format

- **Severity:** Low
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Bug / Resilience
- **Location:**
  - File: `Services/AuthService.cs`
  - Method: `RegisterAsync`
- **Problem:** `RegisterAsync` checks for non-empty email but not for valid email format. The `CreateUserDto` has `[EmailAddress]` validation, but `RegisterDto` (used by self-registration) has no such attribute and the service does not call `System.Net.Mail.MailAddress` or any validator.
- **Impact:** Invalid email addresses can be stored, making password recovery and notifications impossible.
- **Recommendation:** Add `[EmailAddress]` to `RegisterDto.Email` or add a format check in `RegisterAsync`.

---

### F-38 — `DashboardStatsAsync` Makes 4 Sequential DB Queries

- **Severity:** Low
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Performance
- **Location:**
  - File: `Services/TaskService.cs`
  - Method: `GetDashboardStatsAsync` (line 399)
- **Problem:** The method executes four separate `CountAsync` / `ToListAsync` queries in sequence. These could be combined into fewer queries or parallelized.
- **Impact:** Minor — 4 round-trips where 1–2 would suffice.
- **Recommendation:** Use `Task.WhenAll` to execute independent queries in parallel:
  ```csharp
  var (totalProjects, totalTasks, activeUsers, completedTasks, byStatus) = await (
      _context.Projects.CountAsync(),
      _context.Tasks.CountAsync(),
      ...
  ).WhenAll(); // or Task.WhenAll with individual awaits
  ```

---

### F-39 — `NotifyUsersAsync` Sends Notifications in a Sequential Loop

- **Severity:** Low
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Performance
- **Location:**
  - File: `Services/NotificationService.cs`
  - Method: `NotifyUsersAsync` (line 37)
- **Problem:** Notifications are sent in a `foreach` loop with sequential `await`. For task status changes that notify many users (e.g., completed task notifies assignee + creator + owner + QA), each notification adds a round-trip.
- **Impact:** Minor latency on status changes.
- **Recommendation:** Send all notifications in parallel:
  ```csharp
  await Task.WhenAll(userIds.Distinct().Select(id => NotifyUserAsync(id, notification)));
  ```

---

### F-40 — Notification Deduplication Uses `Date.now() + counter` as ID

- **Severity:** Low
- **Actionable:** Yes
- **Architecture:** Frontend
- **Category:** Bug
- **Location:**
  - File: `ClientApp/src/context/DataContext.tsx` lines 149, 180
- **Problem:** Notification IDs are generated as `Date.now() + idCounter`. If `checkReminders` runs with multiple tasks due simultaneously, two notifications created within the same millisecond get the same base timestamp and could collide if `idCounter` resets.
- **Impact:** React key collisions in notification list rendering.
- **Recommendation:** Use a monotonically incrementing counter from a `useRef` or a UUID library instead of `Date.now()` as ID.

---

### F-41 — `EffortHelpers.WorkingOverlap` Hardcodes IST Office Hours Without Timezone Handling

- **Severity:** Low
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Architecture / Correctness
- **Location:**
  - File: `Services/EffortHelpers.cs` lines 88–89
- **Problem:** Working hours are hardcoded to `10:00–19:00` and the code assumes timestamps are stored as IST (India Standard Time) wall-clock time (`DateTimeKind.Unspecified`). If the deployment timezone changes or records are created on a server in a different timezone, all effort calculations are silently wrong.
- **Impact:** Incorrect effort metrics for deployments outside IST or if the server time is UTC.
- **Recommendation:** Store all timestamps as UTC explicitly (`DateTimeKind.Utc`). Use `TimeZoneInfo.ConvertTimeFromUtc` to convert to the configured business timezone before applying working-hours logic. Make the timezone configurable.

---

### F-42 — `apiRequest` Shows Toast and Throws on 403

- **Severity:** Low
- **Actionable:** Yes
- **Architecture:** Frontend
- **Category:** UX / Bug
- **Location:**
  - File: `ClientApp/src/lib/api.ts` lines 36–39
- **Problem:** On 403, `apiRequest` calls `showError(...)` AND throws an `Error`. Any caller that also catches and shows the error will double-show the message. This is a leaky abstraction.
- **Impact:** Duplicate error messages shown to users on 403 responses.
- **Recommendation:** Remove the `showError` call from `apiRequest` and let callers decide how to surface the error. Or suppress toast in callers that handle 403 themselves.

---

### F-43 — `TasksController.Create` Falls Back to `userId = 1` on 0

- **Severity:** Low
- **Actionable:** Yes
- **Architecture:** Backend
- **Category:** Bug
- **Location:**
  - File: `Controllers/TasksController.cs` line 56
- **Problem:** `await _taskService.CreateTaskAsync(createTaskDto, userId > 0 ? userId : 1)` — if `GetCurrentUserId()` returns 0 (invalid/missing token), the task is attributed to user ID 1 (SystemAdmin) instead of returning Unauthorized.
- **Impact:** Tasks created by unauthenticated requests appear to have been created by the system admin.
- **Recommendation:** Return `Unauthorized` if `userId <= 0`:
  ```csharp
  if (userId <= 0) return Unauthorized(...);
  ```

---

### F-44 — `ChatContext` `loadHistory` Closure Captures `isLoadingHistory`

- **Severity:** Low
- **Actionable:** Yes
- **Architecture:** Frontend
- **Category:** Bug
- **Location:**
  - File: `ClientApp/src/context/ChatContext.tsx`
  - Hook: `loadHistory` (line 77)
- **Problem:** `loadHistory` is wrapped in `useCallback` with `[isLoadingHistory]` as a dependency. Every time `isLoadingHistory` changes (which happens at the start and end of every load), a new `loadHistory` reference is created, which causes `loadMoreMessages` (which depends on it) to also be recreated.
- **Impact:** Excessive callback recreation. Components using `loadMoreMessages` as a prop will see reference changes on every load cycle, potentially causing unnecessary re-renders.
- **Recommendation:** Use a `useRef` for the loading guard instead of state, or restructure so the guard is checked inside the callback, not captured as a dependency.

---

## Summary Table

| ID   | Title                                              | Severity | Category            | Actionable |
|------|----------------------------------------------------|----------|---------------------|------------|
| F-01 | Unauthenticated password reset                     | Critical | Security            | Yes        |
| F-02 | DB credentials in appsettings.json                 | Critical | Security            | Yes        |
| F-03 | Swagger in production                              | Critical | Security            | Yes        |
| F-04 | Client-controlled comment author identity          | Critical | Security / Bug      | Yes        |
| F-05 | Inactive users can log in                          | Critical | Security / Bug      | Yes        |
| F-06 | Hardcoded JWT key                                  | Critical | Security            | Yes        |
| F-07 | Blocking synchronous EF calls in AuthService       | High     | Performance / Bug   | Yes        |
| F-08 | No `[Authorize]` on controllers                    | High     | Security            | Yes        |
| F-09 | Multi-step ops without transactions                | High     | Bug / Resilience    | Yes        |
| F-10 | Full effort history loaded into memory             | High     | Performance         | Yes        |
| F-11 | No pagination on list endpoints                    | High     | Performance / Arch  | Yes        |
| F-12 | GetRooms loads all messages                        | High     | Performance         | Yes        |
| F-13 | Auto-advance bypasses role/hours gates             | High     | Bug / Security      | Yes        |
| F-14 | Untracked status on reassign from blocked          | High     | Bug                 | Yes        |
| F-15 | Hardcoded "123456" reset password                  | High     | Security            | Yes        |
| F-16 | Username/email enumeration endpoint                | High     | Security            | Yes        |
| F-17 | File upload MIME not validated server-side         | High     | Security            | Yes        |
| F-18 | DataContext loads all data on login                | High     | Performance / Arch  | Yes        |
| F-19 | AuthorizationService runs 3 DB queries per call    | High     | Performance         | Yes        |
| F-20 | JwtService dead code                               | Medium   | Maintainability     | Yes        |
| F-21 | Controllers inject DbContext directly              | Medium   | Architecture        | Yes        |
| F-22 | HTTP status derived from error message string      | Medium   | Architecture        | Yes        |
| F-23 | Mutable Set in React useState                      | Medium   | Bug                 | Yes        |
| F-24 | No CancellationToken propagation                   | Medium   | Resilience          | Yes        |
| F-25 | Notification sound from external CDN              | Medium   | Security / Resilience | Yes     |
| F-26 | ChatHub OnlineUsers is static in-process           | Medium   | Architecture        | Yes        |
| F-27 | useEffect dependency suppression                   | Medium   | Bug                 | Yes        |
| F-28 | MarkAllChecklistComplete permission mismatch       | Medium   | Bug                 | Yes        |
| F-29 | Members.Count() in LINQ may not translate to SQL   | Medium   | Bug / Performance   | Yes        |
| F-30 | AssignTaskAsync skips audit history                | Medium   | Bug / Architecture  | Yes        |
| F-31 | IsMemberAsync loads entire room                    | Medium   | Performance         | Yes        |
| F-32 | ReasonTags.Valid is an Array                       | Medium   | Performance         | Yes        |
| F-33 | Validate uses user.Id not user.RoleId              | Medium   | Bug                 | Yes        |
| F-34 | File download missing path boundary check          | Medium   | Security            | Yes        |
| F-35 | FullName denormalized in audit tables              | Low      | Architecture        | No         |
| F-36 | GetAssignable returns SystemAdmin                  | Low      | Bug                 | Yes        |
| F-37 | RegisterAsync lacks email format validation        | Low      | Bug / Resilience    | Yes        |
| F-38 | DashboardStatsAsync 4 sequential queries           | Low      | Performance         | Yes        |
| F-39 | NotifyUsersAsync sends sequentially                | Low      | Performance         | Yes        |
| F-40 | Notification ID collision risk                     | Low      | Bug                 | Yes        |
| F-41 | WorkingOverlap hardcodes IST without tz handling   | Low      | Architecture        | Yes        |
| F-42 | apiRequest double-shows error on 403               | Low      | UX / Bug            | Yes        |
| F-43 | CreateTask falls back to userId=1                  | Low      | Bug                 | Yes        |
| F-44 | loadHistory captures isLoadingHistory in closure   | Low      | Bug                 | Yes        |
