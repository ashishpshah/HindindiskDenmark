using HindIndisk.Api.Application.DTOs.Reservation;

namespace HindIndisk.Api.Application.Services;

public interface IReservationService
{
    Task<ReservationDto>              CreateAsync(CreateReservationRequest request);
    Task<IReadOnlyList<ReservationDto>> GetMyAsync(long userId);
    Task<IReadOnlyList<ReservationDto>> CheckDuplicateAsync(string phone, string? email, string date, string timeSlot);
}
