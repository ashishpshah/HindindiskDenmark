namespace HindIndisk.Api.Domain.Entities;

public class AboutTimelineItem
{
    public long   Id            { get; set; }
    public string Year          { get; set; } = string.Empty;
    public string Title         { get; set; } = string.Empty;
    public string TitleDa       { get; set; } = string.Empty;
    public string Description   { get; set; } = string.Empty;
    public string DescriptionDa { get; set; } = string.Empty;
    public int    SortOrder     { get; set; }
}
