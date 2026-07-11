using HindIndisk.Api.Application.DTOs.Admin;
using HindIndisk.Api.Domain.Entities;

namespace HindIndisk.Api.Application.Services;

public interface IEmailSettingsService
{
    Task<EmailSettingsDto> GetAsync();
    Task<EmailSettingsDto> UpdateAsync(UpdateEmailSettingsRequest request);
    Task<EmailConfig>      GetEntityAsync();
}
