namespace HindIndisk.Api.Domain.Entities;

public class GalleryImage
{
    public long      Id         { get; set; }
    public string    Url        { get; set; } = string.Empty;
    public string    Caption    { get; set; } = string.Empty;
    public string    CaptionDa  { get; set; } = string.Empty;
    public int       SortOrder  { get; set; }
    public bool      IsActive   { get; set; } = true;
    public DateTime  CreatedAt  { get; set; }
}
