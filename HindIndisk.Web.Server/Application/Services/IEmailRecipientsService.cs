using HindIndisk.Api.Application.DTOs.Admin;
using HindIndisk.Api.Domain.Entities;

namespace HindIndisk.Api.Application.Services;

public interface IEmailRecipientsService
{
    Task<IReadOnlyList<BranchEmailRecipientsDto>> GetAllAsync();
    Task<BranchEmailRecipientsDto> UpdateAsync(long branchId, UpdateBranchEmailRecipientsRequest request);

    /// <summary>Entity lookup for a specific branch (auto-creates an empty row if missing).</summary>
    Task<BranchEmailRecipients> GetEntityAsync(long branchId);

    /// <summary>
    /// Resolves recipients when there's no branch context (defensive fallback only —
    /// the Contact form always sends the header's currently-selected branch id).
    /// Falls back to the lowest-Id branch's recipients.
    /// </summary>
    Task<BranchEmailRecipients?> GetDefaultEntityAsync();
}
