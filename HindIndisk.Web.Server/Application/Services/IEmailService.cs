using HindIndisk.Api.Application.DTOs.Order;
using HindIndisk.Api.Application.DTOs.Reservation;

namespace HindIndisk.Api.Application.Services;

public interface IEmailService
{
    // ── Customer transactional ────────────────────────────────────────────────
    Task SendOrderConfirmationAsync(string toEmail, string toName, OrderDto order);
    Task SendReservationConfirmationAsync(string toEmail, ReservationDto reservation);
    Task SendOrderStatusUpdateAsync(string toEmail, string toName, long orderId, string newStatus);
    Task SendReservationStatusUpdateAsync(string toEmail, string toName, long reservationId,
         string branchName, string date, string timeSlot, int guestCount, string newStatus);
    Task SendWelcomeEmailAsync(string toEmail, string toName);
    Task SendOtpEmailAsync(string toEmail, string toName, string otp);
    /// <summary>Sent once when an order/reservation auto-creates a new account. Includes login credentials.</summary>
    Task SendNewCustomerCredentialsAsync(string toEmail, string toName, string plainPassword);

    Task SendOrderCancelledCustomerAsync(string toEmail, string toName, long orderId, string? reason);
    Task SendOrderCancelledAdminAsync(long orderId, string customerName, string customerEmail, string? reason);

    // ── Admin notifications ───────────────────────────────────────────────────
    Task SendAdminOrderNotificationAsync(OrderDto order);
    Task SendAdminReservationNotificationAsync(ReservationDto reservation);
    Task SendContactEnquiryAsync(string fromName, string fromEmail, string subject, string message);
}
