using HindIndisk.Api.Application.DTOs.Order;
using HindIndisk.Api.Application.DTOs.Reservation;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace HindIndisk.Api.Application.Services;

public class EmailService : IEmailService
{
    private readonly EmailSettings _settings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<EmailSettings> settings, ILogger<EmailService> logger)
    {
        _settings = settings.Value;
        _logger   = logger;
    }

    public async Task SendOrderConfirmationAsync(string toEmail, string toName, OrderDto order)
    {
        var subject = $"Order Confirmed — #{order.Id} | Hind Indisk";
        var body    = $"""
            <html><body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto">
            <div style="background:#c0392b;padding:20px;text-align:center">
              <h1 style="color:#fff;margin:0">Hind Indisk Restaurant</h1>
            </div>
            <div style="padding:30px">
              <h2>Thank you, {System.Net.WebUtility.HtmlEncode(toName)}!</h2>
              <p>Your order has been placed successfully.</p>
              <table style="width:100%;border-collapse:collapse;margin:20px 0">
                <tr style="background:#f5f5f5"><th style="text-align:left;padding:8px">Order #</th><td style="padding:8px"><strong>{order.Id}</strong></td></tr>
                <tr><th style="text-align:left;padding:8px">Branch</th><td style="padding:8px">{System.Net.WebUtility.HtmlEncode(order.BranchName)}</td></tr>
                <tr style="background:#f5f5f5"><th style="text-align:left;padding:8px">Type</th><td style="padding:8px">{order.OrderType}</td></tr>
                <tr><th style="text-align:left;padding:8px">Payment</th><td style="padding:8px">Cash on Delivery</td></tr>
              </table>
              <h3>Items</h3>
              <table style="width:100%;border-collapse:collapse">
                {string.Join("", order.Items.Select(i => $"<tr><td style='padding:6px'>{System.Net.WebUtility.HtmlEncode(i.Name)} × {i.Quantity}</td><td style='padding:6px;text-align:right'>{(i.PriceAtPurchase * i.Quantity):0} DKK</td></tr>"))}
              </table>
              <hr style="margin:20px 0"/>
              <table style="width:100%">
                {(order.Discount > 0 ? $"<tr><td>Discount</td><td style='text-align:right'>−{order.Discount:0} DKK</td></tr>" : "")}
                <tr><td>Tax (moms 25%)</td><td style='text-align:right'>{order.Tax:0} DKK</td></tr>
                {(order.DeliveryFee > 0 ? $"<tr><td>Delivery</td><td style='text-align:right'>{order.DeliveryFee:0} DKK</td></tr>" : "")}
                <tr style="font-weight:bold;font-size:1.1em"><td>Total</td><td style='text-align:right'>{order.Total:0} DKK</td></tr>
              </table>
              <p style="color:#666;font-size:0.9em;margin-top:30px">
                Estimated time: {(order.OrderType == "Delivery" ? "~45 minutes" : "~20 minutes for pickup")}
              </p>
            </div>
            <div style="background:#f5f5f5;padding:15px;text-align:center;font-size:0.85em;color:#666">
              Hind Indisk Restaurant — Thank you for your order!
            </div>
            </body></html>
            """;

        await SendAsync(toEmail, toName, subject, body);
    }

    public async Task SendReservationConfirmationAsync(string toEmail, ReservationDto reservation)
    {
        var subject = $"Table Reserved — #{reservation.Id} | Hind Indisk";
        var body    = $"""
            <html><body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto">
            <div style="background:#c0392b;padding:20px;text-align:center">
              <h1 style="color:#fff;margin:0">Hind Indisk Restaurant</h1>
            </div>
            <div style="padding:30px">
              <h2>Your table is reserved!</h2>
              <p>Hi {System.Net.WebUtility.HtmlEncode(reservation.ContactName)}, we look forward to welcoming you.</p>
              <table style="width:100%;border-collapse:collapse;margin:20px 0">
                <tr style="background:#f5f5f5"><th style="text-align:left;padding:8px">Reservation #</th><td style="padding:8px"><strong>{reservation.Id}</strong></td></tr>
                <tr><th style="text-align:left;padding:8px">Branch</th><td style="padding:8px">{System.Net.WebUtility.HtmlEncode(reservation.BranchName)}</td></tr>
                <tr style="background:#f5f5f5"><th style="text-align:left;padding:8px">Date</th><td style="padding:8px">{reservation.Date}</td></tr>
                <tr><th style="text-align:left;padding:8px">Time</th><td style="padding:8px">{reservation.TimeSlot}</td></tr>
                <tr style="background:#f5f5f5"><th style="text-align:left;padding:8px">Guests</th><td style="padding:8px">{reservation.GuestCount}</td></tr>
                {(string.IsNullOrWhiteSpace(reservation.SpecialRequests) ? "" : $"<tr><th style='text-align:left;padding:8px'>Special Requests</th><td style='padding:8px'>{System.Net.WebUtility.HtmlEncode(reservation.SpecialRequests)}</td></tr>")}
              </table>
              <p>To cancel or modify your reservation, please call us directly.</p>
            </div>
            <div style="background:#f5f5f5;padding:15px;text-align:center;font-size:0.85em;color:#666">
              Hind Indisk Restaurant — We can't wait to see you!
            </div>
            </body></html>
            """;

        await SendAsync(toEmail, reservation.ContactName, subject, body);
    }

    public async Task SendOrderStatusUpdateAsync(string toEmail, string toName, long orderId, string newStatus)
    {
        var statusMessages = new Dictionary<string, (string label, string message)>
        {
            ["Accepted"]       = ("Order Accepted",        "Your order has been accepted and is being prepared."),
            ["Preparing"]      = ("Preparing Your Order",  "Our chefs are preparing your delicious meal."),
            ["Ready"]          = ("Order Ready",           "Your order is ready for pickup!"),
            ["OutForDelivery"] = ("Out for Delivery",      "Your order is on its way — please have cash ready for payment."),
            ["Completed"]      = ("Order Completed",       "Your order has been delivered. Enjoy your meal!"),
            ["Cancelled"]      = ("Order Cancelled",       "Your order has been cancelled. Please contact us if you have any questions."),
        };

        if (!statusMessages.TryGetValue(newStatus, out var info)) return;

        var subject = $"{info.label} — Order #{orderId} | Hind Indisk";
        var body    = $"""
            <html><body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto">
            <div style="background:#c0392b;padding:20px;text-align:center">
              <h1 style="color:#fff;margin:0">Hind Indisk Restaurant</h1>
            </div>
            <div style="padding:30px">
              <h2>{info.label}</h2>
              <p>Hi {System.Net.WebUtility.HtmlEncode(toName)},</p>
              <p>{info.message}</p>
              <p style="font-size:1.1em">Order <strong>#{orderId}</strong></p>
            </div>
            <div style="background:#f5f5f5;padding:15px;text-align:center;font-size:0.85em;color:#666">
              Hind Indisk Restaurant
            </div>
            </body></html>
            """;

        await SendAsync(toEmail, toName, subject, body);
    }

    // ── Private ───────────────────────────────────────────────────────────────

    private async Task SendAsync(string toEmail, string toName, string subject, string htmlBody)
    {
        if (!_settings.Enabled)
        {
            _logger.LogInformation("Email disabled — would have sent '{Subject}' to {Email}", subject, toEmail);
            return;
        }

        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_settings.FromName, _settings.FromAddress));
            message.To.Add(new MailboxAddress(toName, toEmail));
            message.Subject = subject;
            message.Body    = new TextPart("html") { Text = htmlBody };

            using var client = new SmtpClient();
            await client.ConnectAsync(_settings.SmtpHost, _settings.SmtpPort, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(_settings.SmtpUser, _settings.SmtpPass);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
        catch (Exception ex)
        {
            // Log but don't throw — email failure must never break the main operation
            _logger.LogError(ex, "Failed to send email '{Subject}' to {Email}", subject, toEmail);
        }
    }
}
