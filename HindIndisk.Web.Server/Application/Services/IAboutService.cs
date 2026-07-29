using HindIndisk.Api.Application.DTOs.About;

namespace HindIndisk.Api.Application.Services;

public interface IAboutService
{
    Task<AboutPageSettingsDto> GetSettingsAsync(long branchId);
    Task<AboutPageSettingsDto> UpdateSettingsAsync(long branchId, UpdateAboutSettingsRequest req);

    Task<IReadOnlyList<AboutStatDto>> GetStatsAsync();
    Task<AboutStatDto> CreateStatAsync(SaveAboutStatRequest req);
    Task<AboutStatDto> UpdateStatAsync(long id, SaveAboutStatRequest req);
    Task<bool> DeleteStatAsync(long id);

    Task<IReadOnlyList<AboutMvvDto>> GetMvvAsync();
    Task<AboutMvvDto> CreateMvvAsync(SaveAboutMvvRequest req);
    Task<AboutMvvDto> UpdateMvvAsync(long id, SaveAboutMvvRequest req);
    Task<bool> DeleteMvvAsync(long id);

    Task<IReadOnlyList<AboutTimelineDto>> GetTimelineAsync(long branchId);
    Task<AboutTimelineDto> CreateTimelineItemAsync(long branchId, SaveAboutTimelineRequest req);
    Task<AboutTimelineDto> UpdateTimelineItemAsync(long branchId, long id, SaveAboutTimelineRequest req);
    Task<bool> DeleteTimelineItemAsync(long branchId, long id);

    Task<IReadOnlyList<TeamMemberDto>> GetTeamAsync(long branchId);
    Task<IReadOnlyList<TeamMemberDto>> GetActiveTeamAsync(long branchId);
    Task<TeamMemberDto> CreateTeamMemberAsync(long branchId, SaveTeamMemberRequest req);
    Task<TeamMemberDto> UpdateTeamMemberAsync(long branchId, long id, SaveTeamMemberRequest req);
    Task<bool> DeleteTeamMemberAsync(long branchId, long id);

    Task<AboutPageDto> GetPublicPageAsync(long branchId);
}
