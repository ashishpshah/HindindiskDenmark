using HindIndisk.Api.Application.DTOs.Admin;
using HindIndisk.Api.Domain.Entities;
using HindIndisk.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace HindIndisk.Api.Application.Services;

public class EmailRecipientsService : IEmailRecipientsService
{
    private readonly ApplicationDbContext _db;
    public EmailRecipientsService(ApplicationDbContext db) => _db = db;

    public async Task<IReadOnlyList<BranchEmailRecipientsDto>> GetAllAsync()
    {
        // Ensure every branch has a row (covers branches created before this feature existed)
        var branchIds = await _db.Branches.Select(b => b.Id).ToListAsync();
        var existing  = await _db.BranchEmailRecipients.Select(r => r.BranchId).ToListAsync();
        var missing   = branchIds.Except(existing).ToList();
        if (missing.Count > 0)
        {
            foreach (var id in missing)
                _db.BranchEmailRecipients.Add(new BranchEmailRecipients { BranchId = id });
            await _db.SaveChangesAsync();
        }

        return await _db.BranchEmailRecipients
            .Include(r => r.Branch)
            .OrderBy(r => r.BranchId)
            .Select(r => new BranchEmailRecipientsDto(r.BranchId, r.Branch.Name, r.AdminToMail, r.CC, r.BCC))
            .ToListAsync();
    }

    public async Task<BranchEmailRecipientsDto> UpdateAsync(long branchId, UpdateBranchEmailRecipientsRequest request)
    {
        var entity = await GetEntityAsync(branchId);
        entity.AdminToMail = request.AdminToMail;
        entity.CC          = request.CC;
        entity.BCC         = request.BCC;
        await _db.SaveChangesAsync();

        var branchName = await _db.Branches.Where(b => b.Id == branchId).Select(b => b.Name).FirstAsync();
        return new BranchEmailRecipientsDto(branchId, branchName, entity.AdminToMail, entity.CC, entity.BCC);
    }

    public async Task<BranchEmailRecipients> GetEntityAsync(long branchId)
    {
        var entity = await _db.BranchEmailRecipients.FirstOrDefaultAsync(r => r.BranchId == branchId);
        if (entity is null)
        {
            entity = new BranchEmailRecipients { BranchId = branchId };
            _db.BranchEmailRecipients.Add(entity);
            await _db.SaveChangesAsync();
        }
        return entity;
    }

    public async Task<BranchEmailRecipients?> GetDefaultEntityAsync()
        => await _db.BranchEmailRecipients.OrderBy(r => r.BranchId).FirstOrDefaultAsync();
}
