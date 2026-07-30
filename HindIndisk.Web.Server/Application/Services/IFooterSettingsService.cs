using HindIndisk.Api.Application.DTOs.Footer;

namespace HindIndisk.Api.Application.Services;

public interface IFooterSettingsService
{
    Task<FooterSettingsDto> GetAsync();
    Task<FooterSettingsDto> UpdateAsync(UpdateFooterSettingsRequest req);
}
