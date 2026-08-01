using HindIndisk.Api.Application.DTOs.Order;
using HindIndisk.Api.Application.DTOs.Reservation;

namespace HindIndisk.Api.Application.Services;

public interface IEmailService
{
    // baseUrl: the calling request's scheme+host (see BaseUrlExtensions.GetBaseUrl), used to
    // build absolute links/images in the email. Pass null only when no request is available
    // (falls back to the Frontend:BaseUrl config value) — see EmailService's _siteUrl.

    // ── Customer transactional ────────────────────────────────────────────────
    Task SendOrderConfirmationAsync(string toEmail, string toName, OrderDto order, string? baseUrl = null);
    Task SendReservationConfirmationAsync(string toEmail, ReservationDto reservation, string? baseUrl = null);
    Task SendOrderStatusUpdateAsync(string toEmail, string toName, long orderId, string newStatus,
         string branchName, string orderType, DateOnly? scheduledDate, string? scheduledTime, string? baseUrl = null);
    Task SendReservationStatusUpdateAsync(string toEmail, string toName, long reservationId,
         string branchName, string date, string timeSlot, int guestCount, string newStatus, string? baseUrl = null);
    Task SendWelcomeEmailAsync(string toEmail, string toName, string? baseUrl = null);
    Task SendOtpEmailAsync(string toEmail, string toName, string otp, string? baseUrl = null);
    Task SendRegistrationOtpEmailAsync(string toEmail, string toName, string otp, string? baseUrl = null);
    /// <summary>Sent once when an order/reservation auto-creates a new account. Includes login credentials.</summary>
    Task SendNewCustomerCredentialsAsync(string toEmail, string toName, string plainPassword, string? baseUrl = null);

    Task SendOrderCancelledCustomerAsync(string toEmail, string toName, long orderId, string? reason,
         string branchName, string orderType, DateOnly? scheduledDate, string? scheduledTime, string? baseUrl = null);
    Task SendOrderCancelledAdminAsync(long orderId, long branchId, string customerName, string customerEmail, string? reason,
         string branchName, string orderType, DateOnly? scheduledDate, string? scheduledTime, string? baseUrl = null);

    // ── Admin notifications ───────────────────────────────────────────────────
    Task SendAdminOrderNotificationAsync(OrderDto order, string? baseUrl = null);
    Task SendAdminReservationNotificationAsync(ReservationDto reservation, string? baseUrl = null);
    Task SendContactEnquiryAsync(string fromName, string fromEmail, string subject, string message, long? branchId = null, string? baseUrl = null);
    Task SendContactConfirmationAsync(string toEmail, string toName, string subject, string message, string? baseUrl = null);
}
