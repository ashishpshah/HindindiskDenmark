namespace HindIndisk.Api.Application.DTOs.About;

public record AboutPageSettingsDto(string HeroImage, string StoryImage);
public record UpdateAboutSettingsRequest(string? HeroImage, string? StoryImage);

public record AboutStatDto(long Id, string Value, string Label, string LabelDa, int SortOrder);
public record SaveAboutStatRequest(string Value, string Label, string LabelDa, int SortOrder);

public record AboutMvvDto(long Id, string Title, string TitleDa, string Description, string DescriptionDa, string Icon, int SortOrder);
public record SaveAboutMvvRequest(string Title, string TitleDa, string Description, string DescriptionDa, string Icon, int SortOrder);

public record AboutTimelineDto(long Id, string Year, string Title, string TitleDa, string Description, string DescriptionDa, int SortOrder);
public record SaveAboutTimelineRequest(string Year, string Title, string TitleDa, string Description, string DescriptionDa, int SortOrder);

public record TeamMemberDto(long Id, string Name, string Role, string RoleDa, string Image, int SortOrder, bool IsActive);
public record SaveTeamMemberRequest(string Name, string Role, string RoleDa, string Image, int SortOrder, bool IsActive);

public record AboutPageDto(
    AboutPageSettingsDto Settings,
    IReadOnlyList<AboutStatDto> Stats,
    IReadOnlyList<AboutMvvDto> Mvv,
    IReadOnlyList<AboutTimelineDto> Timeline,
    IReadOnlyList<TeamMemberDto> Team
);
