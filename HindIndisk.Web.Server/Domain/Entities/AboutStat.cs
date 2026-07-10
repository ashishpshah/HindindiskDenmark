namespace HindIndisk.Api.Domain.Entities;

public class AboutStat
{
    public long   Id        { get; set; }
    public string Value     { get; set; } = string.Empty;
    public string Label     { get; set; } = string.Empty;
    public string LabelDa   { get; set; } = string.Empty;
    public int    SortOrder { get; set; }
}
