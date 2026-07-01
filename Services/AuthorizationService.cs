using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using TaskManagement.Data;

namespace TaskManagement.Services
{
    public interface IAuthorizationService
    {
        Task<bool> IsSystemAdminAsync();
        Task<bool> IsAdminAsync();
        int GetCurrentUserId();
        string? GetCurrentUserRole();
        Task<bool> CanViewAsync(string pageRoute);
        Task<bool> CanCreateAsync(string pageRoute);
        Task<bool> CanUpdateAsync(string pageRoute);
        Task<bool> CanDeleteAsync(string pageRoute);

        // Synchronous shims kept for the few call-sites that cannot be awaited.
        // They resolve on the async path internally; prefer the Async variants.
        bool IsSystemAdmin();
        bool IsAdmin();
        bool CanView(string pageRoute);
        bool CanCreate(string pageRoute);
        bool CanUpdate(string pageRoute);
        bool CanDelete(string pageRoute);
    }

    public class AuthorizationService : IAuthorizationService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly PMSDbContext _context;

        // Per-request cache: loaded once then reused within the same request.
        private User? _cachedUser;
        private bool _userLoaded;

        public AuthorizationService(IHttpContextAccessor httpContextAccessor, PMSDbContext context)
        {
            _httpContextAccessor = httpContextAccessor;
            _context = context;
        }

        public int GetCurrentUserId()
        {
            var claim = _httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var id) ? id : 0;
        }

        public string? GetCurrentUserRole()
        {
            return _httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.Role)?.Value
                ?? _httpContextAccessor.HttpContext?.User.FindFirst("role")?.Value;
        }

        private async Task<User?> GetCurrentUserAsync()
        {
            if (_userLoaded) return _cachedUser;
            _userLoaded = true;
            var userId = GetCurrentUserId();
            if (userId == 0) return _cachedUser = null;
            _cachedUser = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == userId);
            return _cachedUser;
        }

        public async Task<bool> IsSystemAdminAsync()
        {
            var user = await GetCurrentUserAsync();
            return user?.RoleId == 1;
        }

        public async Task<bool> IsAdminAsync()
        {
            var user = await GetCurrentUserAsync();
            return user != null && (user.RoleId == 1 || (user.Role?.IsAdmin ?? false));
        }

        public async Task<bool> CanViewAsync(string pageRoute)
        {
            if (string.IsNullOrEmpty(pageRoute) || pageRoute.Equals("/", StringComparison.Ordinal)
                || pageRoute.Equals("dashboard", StringComparison.OrdinalIgnoreCase)) return true;

            var user = await GetCurrentUserAsync();
            if (user == null) return false;
            if (user.RoleId == 1 || (user.Role?.IsAdmin ?? false)) return true;

            var pageModule = await _context.PageModules
                .FirstOrDefaultAsync(pm => pm.Route.ToLower() == pageRoute.ToLower());
            if (pageModule == null) return false;

            var userPerm = await _context.UserPagePermissions
                .FirstOrDefaultAsync(up => up.UserId == user.Id && up.PageModuleId == pageModule.Id);
            if (userPerm != null) return (userPerm.Permissions & 1) == 1;

            var rolePerm = await _context.RolePagePermissions
                .FirstOrDefaultAsync(rp => rp.RoleId == user.RoleId && rp.PageModuleId == pageModule.Id);
            return rolePerm == null || (rolePerm.Permissions & 1) == 1;
        }

        public Task<bool> CanCreateAsync(string pageRoute) => HasPermissionAsync(pageRoute, 2);
        public Task<bool> CanUpdateAsync(string pageRoute) => HasPermissionAsync(pageRoute, 4);
        public Task<bool> CanDeleteAsync(string pageRoute) => HasPermissionAsync(pageRoute, 8);

        private async Task<bool> HasPermissionAsync(string pageRoute, int bit)
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return false;
            if (user.RoleId == 1 || (user.Role?.IsAdmin ?? false)) return true;

            var pageModule = await _context.PageModules
                .FirstOrDefaultAsync(pm => pm.Route.ToLower() == pageRoute.ToLower());
            if (pageModule == null) return false;

            var userPerm = await _context.UserPagePermissions
                .FirstOrDefaultAsync(up => up.UserId == user.Id && up.PageModuleId == pageModule.Id);
            if (userPerm != null) return (userPerm.Permissions & bit) == bit;

            var rolePerm = await _context.RolePagePermissions
                .FirstOrDefaultAsync(rp => rp.RoleId == user.RoleId && rp.PageModuleId == pageModule.Id);
            return rolePerm != null && (rolePerm.Permissions & bit) == bit;
        }

        // Synchronous shims — use Task.GetAwaiter().GetResult() only as a last resort.
        // Controllers should call the Async variants instead.
        public bool IsSystemAdmin() => IsSystemAdminAsync().GetAwaiter().GetResult();
        public bool IsAdmin()       => IsAdminAsync().GetAwaiter().GetResult();
        public bool CanView(string r)   => CanViewAsync(r).GetAwaiter().GetResult();
        public bool CanCreate(string r) => CanCreateAsync(r).GetAwaiter().GetResult();
        public bool CanUpdate(string r) => CanUpdateAsync(r).GetAwaiter().GetResult();
        public bool CanDelete(string r) => CanDeleteAsync(r).GetAwaiter().GetResult();
    }
}
