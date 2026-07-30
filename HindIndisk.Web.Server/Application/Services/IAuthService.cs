using HindIndisk.Api.Application.DTOs.Auth;

namespace HindIndisk.Api.Application.Services;

public interface IAuthService
{
    Task                    StartRegistrationAsync(RegisterRequest request);
    Task<AuthResponse>      VerifyRegistrationOtpAsync(VerifyRegistrationOtpRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<UserDto>      GetMeAsync(long userId);
    Task<UserDto>      UpdateProfileAsync(long userId, UpdateProfileRequest request);
    Task                    ForgotPasswordAsync(string email);
    Task<VerifyOtpResponse> VerifyOtpAsync(VerifyOtpRequest request);
    Task                    ResetPasswordAsync(ResetPasswordRequest request);
    Task                    VerifyPasswordAsync(long userId, string password);
}
