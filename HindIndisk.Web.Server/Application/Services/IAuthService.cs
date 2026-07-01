using HindIndisk.Api.Application.DTOs.Auth;

namespace HindIndisk.Api.Application.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<UserDto>      GetMeAsync(long userId);
    Task<UserDto>      UpdateProfileAsync(long userId, UpdateProfileRequest request);
    Task               ForgotPasswordAsync(string email);
    Task               ResetPasswordAsync(ResetPasswordRequest request);
}
