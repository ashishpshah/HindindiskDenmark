using HindIndisk.Api.Application.DTOs.Location;
using HindIndisk.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace HindIndisk.Api.Application.Services;

public class LocationService : ILocationService
{
    private readonly ApplicationDbContext _db;

    public LocationService(ApplicationDbContext db) => _db = db;

    public async Task<IReadOnlyList<BranchDto>> GetBranchesAsync()
    {
        var branches = await _db.Branches.AsNoTracking().OrderBy(b => b.Id).ToListAsync();

        return branches.Select(b => new BranchDto(
            b.Id,
            b.Name,
            b.AddressLine1,
            b.City,
            b.PostalCode,
            b.Phone,
            b.Email,
            b.GoogleMapsLink,
            $"{b.WeekdayOpenTime:HH\\:mm} – {b.WeekdayCloseTime:HH\\:mm}",
            $"{b.WeekendOpenTime:HH\\:mm} – {b.WeekendCloseTime:HH\\:mm}"
        )).ToList();
    }
}
