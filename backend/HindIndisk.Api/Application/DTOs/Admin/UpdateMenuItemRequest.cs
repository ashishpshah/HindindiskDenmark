using System.ComponentModel.DataAnnotations;

namespace HindIndisk.Api.Application.DTOs.Admin;

public class UpdateMenuItemRequest
{
    [Required, MaxLength(100)] public string Name          { get; set; } = string.Empty;
    [MaxLength(100)]           public string NameDa        { get; set; } = string.Empty;
    [MaxLength(500)]           public string Description   { get; set; } = string.Empty;
    [MaxLength(500)]           public string DescriptionDa { get; set; } = string.Empty;
    [MaxLength(500)]           public string ImageUrl      { get; set; } = string.Empty;
    [Range(0, 3)]              public int    SpicyLevel    { get; set; }
}
