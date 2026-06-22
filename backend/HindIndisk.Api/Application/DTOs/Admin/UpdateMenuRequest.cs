using System.ComponentModel.DataAnnotations;

namespace HindIndisk.Api.Application.DTOs.Admin;

public class UpdateMenuRequest
{
    [Required, MaxLength(100)] public string Name          { get; set; } = string.Empty;
    [MaxLength(100)]           public string NameDa        { get; set; } = string.Empty;
    [MaxLength(300)]           public string Description   { get; set; } = string.Empty;
    [MaxLength(300)]           public string DescriptionDa { get; set; } = string.Empty;
    public List<long>                        BranchIds     { get; set; } = [];
}
