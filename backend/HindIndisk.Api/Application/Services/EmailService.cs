using System.Net;
using System.Text;
using HindIndisk.Api.Application.DTOs.Order;
using HindIndisk.Api.Application.DTOs.Reservation;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Options;
using MimeKit;

namespace HindIndisk.Api.Application.Services;

public class EmailService : IEmailService
{
    private readonly EmailSettings        _settings;
    private readonly ILogger<EmailService> _logger;
    private readonly IWebHostEnvironment   _env;

    public EmailService(
        IOptions<EmailSettings> settings,
        ILogger<EmailService>   logger,
        IWebHostEnvironment     env)
    {
        _settings = settings.Value;
        _logger   = logger;
        _env      = env;
    }

    // ── Customer: order confirmation ─────────────────────────────────────────

    public async Task SendOrderConfirmationAsync(string toEmail, string toName, OrderDto order)
    {
        var templateFile = order.OrderType == "Delivery"
            ? "DeliveryOrder_Customer.htm"
            : "PlacedOrder_Customer.htm";

        var body = await LoadAndFillOrderTemplateAsync(templateFile, order, isAdmin: false);
        var subject = $"Order Confirmed — #{order.Id} | Hind Indisk";
        await SendAsync(toEmail, toName, subject, body);
    }

    // ── Customer: reservation confirmation ──────────────────────────────────

    public async Task SendReservationConfirmationAsync(string toEmail, ReservationDto reservation)
    {
        var body = await LoadAndFillReservationTemplateAsync("Reservation_Customer.htm", reservation);
        var subject = $"Table Reserved — #{reservation.Id} | Hind Indisk";
        await SendAsync(toEmail, reservation.ContactName, subject, body);
    }

    // ── Customer: order status update (no template file — status-specific) ──

    public async Task SendOrderStatusUpdateAsync(string toEmail, string toName, long orderId, string newStatus)
    {
        var statusMessages = new Dictionary<string, (string label, string message)>
        {
            ["Accepted"]       = ("Order Accepted",       "Your order has been accepted and is being prepared."),
            ["Preparing"]      = ("Preparing Your Order", "Our chefs are preparing your delicious meal."),
            ["Ready"]          = ("Order Ready",          "Your order is ready for pickup!"),
            ["OutForDelivery"] = ("Out for Delivery",     "Your order is on its way — please have cash ready for payment."),
            ["Completed"]      = ("Order Completed",      "Your order has been delivered. Enjoy your meal!"),
            ["Cancelled"]      = ("Order Cancelled",      "Your order has been cancelled. Please contact us if you have any questions."),
        };

        if (!statusMessages.TryGetValue(newStatus, out var info)) return;

        var subject = $"{info.label} — Order #{orderId} | Hind Indisk";
        var body = $"""
            <html><body style="font-family:Verdana,sans-serif;color:#343131;max-width:600px;margin:0 auto">
            <div style="padding:30px">
              <h2>{info.label}</h2>
              <p>Dear {WebUtility.HtmlEncode(toName)},</p>
              <p>{info.message}</p>
              <p>Order <strong>#{orderId}</strong></p>
              <p>Thank you,<br/>Hind Indisk Restaurant</p>
            </div>
            </body></html>
            """;

        await SendAsync(toEmail, toName, subject, body);
    }

    // ── Admin: order notification ────────────────────────────────────────────

    public async Task SendAdminOrderNotificationAsync(OrderDto order)
    {
        if (string.IsNullOrWhiteSpace(_settings.AdminToMail)) return;

        var templateFile = order.OrderType == "Delivery"
            ? "DeliveryOrder_Admin.htm"
            : "PlacedOrder_Admin.htm";

        var body = await LoadAndFillOrderTemplateAsync(templateFile, order, isAdmin: true);
        var subject = $"New Order #{order.Id} — {order.BranchName} | Hind Indisk";
        await SendAsync(_settings.AdminToMail, "Admin", subject, body, isAdmin: true);
    }

    // ── Customer: OTP for password reset ────────────────────────────────────

    public Task SendOtpEmailAsync(string toEmail, string toName, string otp)
    {
        var subject = "Password Reset OTP — Hind Indisk";
        var body = $"""
            <html><head><meta charset="utf-8"/></head>
            <body style="font-family:Verdana,sans-serif;color:#343131;max-width:600px;margin:0 auto">
            <div style="padding:30px">
              <h2 style="color:#D9822B">Password Reset</h2>
              <p>Dear {WebUtility.HtmlEncode(toName)},</p>
              <p>You requested a password reset for your Hind Indisk account.</p>
              <p>Your one-time password (OTP) is:</p>
              <div style="margin:20px 0;padding:16px 32px;background:#FFF3E0;border:2px dashed #D9822B;border-radius:8px;text-align:center">
                <span style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#D9822B">{WebUtility.HtmlEncode(otp)}</span>
              </div>
              <p style="color:#888;font-size:13px">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
              <p>If you did not request this, you can safely ignore this email — your password will not change.</p>
              <p>Thank you,<br/>Hind Indisk Restaurant</p>
            </div>
            </body></html>
            """;
        return SendAsync(toEmail, toName, subject, body);
    }

    // ── Customer: welcome on registration ────────────────────────────────────

    public Task SendWelcomeEmailAsync(string toEmail, string toName)
    {
        var subject = "Welcome to Hind Indisk! 🍛";
        var body = $"""
            <html><head><meta charset="utf-8"/></head>
            <body style="font-family:Verdana,sans-serif;color:#343131;max-width:600px;margin:0 auto">
            <div style="padding:30px">
              <h2 style="color:#D9822B">Welcome, {WebUtility.HtmlEncode(toName)}!</h2>
              <p>Your account has been created. You can now place orders, reserve tables, and enjoy exclusive offers.</p>
              <table style="margin-top:20px;width:100%">
                <tr>
                  <td style="padding:10px;background:#FFF3E0;border-radius:6px;text-align:center">
                    <a href="https://hindindisk.dk/menu" style="color:#D9822B;font-weight:bold;text-decoration:none">Browse Our Menu →</a>
                  </td>
                  <td style="padding:10px;background:#FFF3E0;border-radius:6px;text-align:center">
                    <a href="https://hindindisk.dk/reservation" style="color:#D9822B;font-weight:bold;text-decoration:none">Book a Table →</a>
                  </td>
                </tr>
              </table>
              <p style="margin-top:20px">We look forward to welcoming you!</p>
              <p>Thank you,<br/>Hind Indisk Restaurant</p>
            </div>
            </body></html>
            """;
        return SendAsync(toEmail, toName, subject, body);
    }

    // ── Customer: reservation status change ──────────────────────────────────

    public Task SendReservationStatusUpdateAsync(
        string toEmail, string toName,
        long   reservationId, string branchName,
        string date, string timeSlot, int guestCount,
        string newStatus)
    {
        var (label, message) = newStatus switch
        {
            "Confirmed" => ("Reservation Confirmed",  "Your reservation has been confirmed. We look forward to seeing you!"),
            "Cancelled" => ("Reservation Cancelled",  "Your reservation has been cancelled. Please contact us if you need help."),
            "Pending"   => ("Reservation Pending",    "Your reservation is under review. We will confirm it shortly."),
            _           => (newStatus,                 "Your reservation status has been updated."),
        };

        var subject = $"{label} — #{reservationId} | Hind Indisk";
        var body = $"""
            <html><head><meta charset="utf-8"/></head>
            <body style="font-family:Verdana,sans-serif;color:#343131;max-width:600px;margin:0 auto">
            <div style="padding:30px">
              <h2 style="color:#D9822B">{WebUtility.HtmlEncode(label)}</h2>
              <p>Dear {WebUtility.HtmlEncode(toName)},</p>
              <p>{WebUtility.HtmlEncode(message)}</p>
              <table style="width:100%;border-collapse:collapse;margin-top:16px">
                <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Reservation #</td><td style="padding:8px;border:1px solid #eee">{reservationId}</td></tr>
                <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Branch</td><td style="padding:8px;border:1px solid #eee">{WebUtility.HtmlEncode(branchName)}</td></tr>
                <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Date &amp; Time</td><td style="padding:8px;border:1px solid #eee">{WebUtility.HtmlEncode(date)} at {WebUtility.HtmlEncode(timeSlot)}</td></tr>
                <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Guests</td><td style="padding:8px;border:1px solid #eee">{guestCount}</td></tr>
              </table>
              <p style="margin-top:20px">Thank you,<br/>Hind Indisk Restaurant</p>
            </div>
            </body></html>
            """;
        return SendAsync(toEmail, toName, subject, body);
    }

    // ── Admin: reservation notification ─────────────────────────────────────

    public async Task SendAdminReservationNotificationAsync(ReservationDto reservation)
    {
        if (string.IsNullOrWhiteSpace(_settings.AdminToMail)) return;

        var body = await LoadAndFillReservationTemplateAsync("Reservation_Admin.htm", reservation);
        var subject = $"New Reservation #{reservation.Id} — {reservation.BranchName} | Hind Indisk";
        await SendAsync(_settings.AdminToMail, "Admin", subject, body, isAdmin: true);
    }

    // ── Admin: contact form enquiry ──────────────────────────────────────────

    public async Task SendContactEnquiryAsync(string fromName, string fromEmail, string subject, string message)
    {
        if (string.IsNullOrWhiteSpace(_settings.AdminToMail)) return;

        var template = await LoadTemplateAsync("Contact.htm");
        var body = template
            .Replace("[Customername]", WebUtility.HtmlEncode(fromName))
            .Replace("[Email]",        WebUtility.HtmlEncode(fromEmail))
            .Replace("[Subject]",      WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(subject) ? "—" : subject))
            .Replace("[Message]",      WebUtility.HtmlEncode(message));

        var emailSubject = $"Contact Enquiry from {fromName} — Hind Indisk";
        await SendAsync(_settings.AdminToMail, "Admin", emailSubject, WrapInHtml(body), isAdmin: true);
    }

    // ── Template helpers ─────────────────────────────────────────────────────

    private async Task<string> LoadAndFillOrderTemplateAsync(string fileName, OrderDto order, bool isAdmin)
    {
        var template = await LoadTemplateAsync(fileName);

        var estimatedTime = order.OrderType == "Delivery" ? "~45 minutes" : "~20 minutes";
        var itemRows      = BuildOrderItemRows(order);
        var totalItems    = order.Items.Sum(i => i.Quantity);

        var body = template
            .Replace("[Customername]", WebUtility.HtmlEncode(order.ContactName))
            .Replace("[OrderNumber]",  order.Id.ToString())
            .Replace("[Mobile]",       WebUtility.HtmlEncode(order.ContactPhone))
            .Replace("[Email]",        WebUtility.HtmlEncode(order.ContactEmail ?? "—"))
            .Replace("[Branch]",       WebUtility.HtmlEncode(order.BranchName))
            .Replace("[OrderType]",    WebUtility.HtmlEncode(order.OrderType))
            .Replace("[Time]",         estimatedTime)
            .Replace("[Orderdate]",    order.CreatedAt.ToString("dd-MM-yyyy HH:mm"))
            .Replace("[Instruction]",  "—")
            .Replace("[Noofitem]",     totalItems.ToString())
            .Replace("[tabtable]",     itemRows)
            .Replace("[Address]",      WebUtility.HtmlEncode(order.DeliveryAddress ?? "—"));

        return WrapInHtml(body);
    }

    private async Task<string> LoadAndFillReservationTemplateAsync(string fileName, ReservationDto reservation)
    {
        var template = await LoadTemplateAsync(fileName);

        var dateTime = $"{reservation.Date} {reservation.TimeSlot}";

        var body = template
            .Replace("[Customername]",      WebUtility.HtmlEncode(reservation.ContactName))
            .Replace("[Email]",             WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(reservation.ContactEmail) ? "—" : reservation.ContactEmail))
            .Replace("[Mobile]",            WebUtility.HtmlEncode(reservation.ContactPhone))
            .Replace("[Noperson]",          reservation.GuestCount.ToString())
            .Replace("[Time]",              WebUtility.HtmlEncode(dateTime))
            .Replace("[Message]",           WebUtility.HtmlEncode(reservation.SpecialRequests ?? "—"))
            .Replace("[ReservationNumber]", reservation.Id.ToString())
            .Replace("[ReservationDate]",   reservation.CreatedAt.ToString("dd-MM-yyyy HH:mm"))
            .Replace("[Branch]",            WebUtility.HtmlEncode(reservation.BranchName));

        return WrapInHtml(body);
    }

    private async Task<string> LoadTemplateAsync(string fileName)
    {
        var path = Path.Combine(_env.WebRootPath, "Email_Template", fileName);
        return await File.ReadAllTextAsync(path);
    }

    private static string BuildOrderItemRows(OrderDto order)
    {
        var sb = new StringBuilder();

        sb.AppendLine("<tr style=\"background:#f5f5f5\">"
            + "<th align=\"left\" style=\"padding:6px\">Item</th>"
            + "<th align=\"center\" style=\"padding:6px\">Qty</th>"
            + "<th align=\"right\" style=\"padding:6px\">Unit</th>"
            + "<th align=\"right\" style=\"padding:6px\">Amount</th></tr>");

        foreach (var item in order.Items)
        {
            sb.AppendLine($"<tr>"
                + $"<td style=\"padding:6px\">{WebUtility.HtmlEncode(item.Name)}</td>"
                + $"<td align=\"center\" style=\"padding:6px\">{item.Quantity}</td>"
                + $"<td align=\"right\" style=\"padding:6px\">{item.PriceAtPurchase:0} DKK</td>"
                + $"<td align=\"right\" style=\"padding:6px\">{(item.PriceAtPurchase * item.Quantity):0} DKK</td>"
                + $"</tr>");
        }

        sb.AppendLine("<tr><td colspan=\"4\"><hr/></td></tr>");

        if (order.Discount > 0)
            sb.AppendLine($"<tr><td colspan=\"3\" align=\"right\" style=\"padding:6px\"><b>Discount{(string.IsNullOrWhiteSpace(order.CouponCode) ? "" : $" ({WebUtility.HtmlEncode(order.CouponCode)})")}:</b></td>"
                + $"<td align=\"right\" style=\"padding:6px\">−{order.Discount:0} DKK</td></tr>");

        sb.AppendLine($"<tr><td colspan=\"3\" align=\"right\" style=\"padding:6px\">Tax (moms 25%):</td>"
            + $"<td align=\"right\" style=\"padding:6px\">{order.Tax:0} DKK</td></tr>");

        if (order.DeliveryFee > 0)
            sb.AppendLine($"<tr><td colspan=\"3\" align=\"right\" style=\"padding:6px\">Delivery fee:</td>"
                + $"<td align=\"right\" style=\"padding:6px\">{order.DeliveryFee:0} DKK</td></tr>");

        sb.AppendLine($"<tr style=\"font-weight:bold\">"
            + $"<td colspan=\"3\" align=\"right\" style=\"padding:6px\">Total:</td>"
            + $"<td align=\"right\" style=\"padding:6px\">{order.Total:0} DKK</td></tr>");

        return sb.ToString();
    }

    private static string WrapInHtml(string body) =>
        $"<html><head><meta charset=\"utf-8\"/></head><body>{body}</body></html>";

    // ── SMTP send ─────────────────────────────────────────────────────────────

    private async Task SendAsync(
        string toEmail, string toName, string subject, string htmlBody, bool isAdmin = false)
    {
        if (!_settings.Enabled)
        {
            _logger.LogInformation(
                "Email disabled — would have sent '{Subject}' to {Email}", subject, toEmail);
            return;
        }

        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_settings.FromName, _settings.FromAddress));
            message.To.Add(new MailboxAddress(toName, toEmail));
            message.Subject = subject;
            message.Body    = new TextPart("html") { Text = htmlBody };

            if (isAdmin)
            {
                foreach (var cc in SplitAddresses(_settings.CC))
                    message.Cc.Add(MailboxAddress.Parse(cc));
                foreach (var bcc in SplitAddresses(_settings.BCC))
                    message.Bcc.Add(MailboxAddress.Parse(bcc));
            }

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

    private static IEnumerable<string> SplitAddresses(string raw) =>
        raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
           .Where(s => s.Contains('@'));
}
