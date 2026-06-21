using HindIndisk.Api.Application.DTOs.Order;
using HindIndisk.Api.Application.DTOs.Reservation;

namespace HindIndisk.Api.Application.Services;

public interface IEmailService
{
    Task SendOrderConfirmationAsync(string toEmail, string toName, OrderDto order);
    Task SendReservationConfirmationAsync(string toEmail, ReservationDto reservation);
    Task SendOrderStatusUpdateAsync(string toEmail, string toName, long orderId, string newStatus);
}
