using HindIndisk.Api.Application.DTOs.Reservation;

namespace HindIndisk.Api.Application.Services;

public interface IReservationService
{
    Task<ReservationDto> CreateAsync(long? userId, CreateReservationRequest request);
    Task<IReadOnlyList<ReservationDto>> GetMyAsync(long userId);
}
