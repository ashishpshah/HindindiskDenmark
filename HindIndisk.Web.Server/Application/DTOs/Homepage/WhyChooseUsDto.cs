namespace HindIndisk.Api.Application.DTOs.Homepage;

public record WhyChooseUsItemDto(long Id, string Title, string TitleDa, string Description, string DescriptionDa, string Icon, int SortOrder, bool IsActive);
public record SaveWhyChooseUsItemRequest(string Title, string TitleDa, string Description, string DescriptionDa, string Icon, int SortOrder, bool IsActive);
