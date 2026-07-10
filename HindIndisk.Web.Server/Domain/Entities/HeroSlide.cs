namespace HindIndisk.Api.Domain.Entities;

/// <summary>
/// A hero banner slide for the homepage carousel. Supports bilingual content (EN/DA)
/// and multiple call-to-action buttons stored as JSON.
/// </summary>
public class HeroSlide
{
    public long      Id          { get; set; }
    public string    Title       { get; set; } = string.Empty;
    public string    TitleDa     { get; set; } = string.Empty;
    public string    Subtitle    { get; set; } = string.Empty;
    public string    SubtitleDa  { get; set; } = string.Empty;
    public string    Tagline     { get; set; } = string.Empty;
    public string    TaglineDa   { get; set; } = string.Empty;
    public string    ImageUrl    { get; set; } = string.Empty;
    public bool      IsActive    { get; set; } = true;
    public int       SortOrder   { get; set; }
    public string    CtaData     { get; set; } = "[]"; // JSON array of CTA objects
    public DateTime  CreatedAt   { get; set; }
    public DateTime? UpdatedAt   { get; set; }
}