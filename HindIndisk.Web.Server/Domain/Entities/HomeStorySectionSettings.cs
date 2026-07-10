namespace HindIndisk.Api.Domain.Entities;

public class HomeStorySectionSettings
{
    public int    Id                    { get; set; }
    public string Eyebrow               { get; set; } = string.Empty;
    public string EyebrowDa             { get; set; } = string.Empty;
    public string Title                 { get; set; } = string.Empty;
    public string TitleDa               { get; set; } = string.Empty;
    public string Subtitle              { get; set; } = string.Empty;
    public string SubtitleDa            { get; set; } = string.Empty;
    public string HeritageBadgeLabel    { get; set; } = string.Empty;
    public string HeritageBadgeLabelDa  { get; set; } = string.Empty;
    public string HeritageBadgeSince    { get; set; } = string.Empty;
    public string HeritageBadgeSinceDa  { get; set; } = string.Empty;
    public string ButtonText            { get; set; } = string.Empty;
    public string ButtonTextDa          { get; set; } = string.Empty;
    public string ButtonLink            { get; set; } = string.Empty;
    public string MainImage             { get; set; } = string.Empty;
    public string OverlayImage          { get; set; } = string.Empty;
}
