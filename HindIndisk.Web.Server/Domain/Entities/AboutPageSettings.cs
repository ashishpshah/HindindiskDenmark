namespace HindIndisk.Api.Domain.Entities;

public class AboutPageSettings
{
    public long   Id                   { get; set; }
    public long   BranchId             { get; set; }
    public string HeroImage            { get; set; } = string.Empty;
    public string StoryImage           { get; set; } = string.Empty;

    public virtual Branch Branch { get; set; } = null!;
}
