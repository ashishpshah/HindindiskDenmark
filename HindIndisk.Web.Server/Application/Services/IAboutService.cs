using HindIndisk.Api.Application.DTOs.About;

namespace HindIndisk.Api.Application.Services;

public interface IAboutService
{
    Task<AboutPageSettingsDto> GetSettingsAsync();
    Task<AboutPageSettingsDto> UpdateSettingsAsync(UpdateAboutSettingsRequest req);

    Task<IReadOnlyList<AboutStatDto>> GetStatsAsync();
    Task<AboutStatDto> CreateStatAsync(SaveAboutStatRequest req);
    Task<AboutStatDto> UpdateStatAsync(long id, SaveAboutStatRequest req);
    Task<bool> DeleteStatAsync(long id);

    Task<IReadOnlyList<AboutMvvDto>> GetMvvAsync();
    Task<AboutMvvDto> CreateMvvAsync(SaveAboutMvvRequest req);
    Task<AboutMvvDto> UpdateMvvAsync(long id, SaveAboutMvvRequest req);
    Task<bool> DeleteMvvAsync(long id);

    Task<IReadOnlyList<AboutTimelineDto>> GetTimelineAsync();
    Task<AboutTimelineDto> CreateTimelineItemAsync(SaveAboutTimelineRequest req);
    Task<AboutTimelineDto> UpdateTimelineItemAsync(long id, SaveAboutTimelineRequest req);
    Task<bool> DeleteTimelineItemAsync(long id);

    Task<IReadOnlyList<TeamMemberDto>> GetTeamAsync();
    Task<IReadOnlyList<TeamMemberDto>> GetActiveTeamAsync();
    Task<TeamMemberDto> CreateTeamMemberAsync(SaveTeamMemberRequest req);
    Task<TeamMemberDto> UpdateTeamMemberAsync(long id, SaveTeamMemberRequest req);
    Task<bool> DeleteTeamMemberAsync(long id);

    Task<AboutPageDto> GetPublicPageAsync();
}
