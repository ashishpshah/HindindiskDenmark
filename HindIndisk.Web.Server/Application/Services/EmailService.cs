using System.Net;
using System.Text;
using HindIndisk.Api.Application.DTOs.Order;
using HindIndisk.Api.Application.DTOs.Reservation;
using HindIndisk.Api.Domain.Entities;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.AspNetCore.Hosting;
using MimeKit;

namespace HindIndisk.Api.Application.Services;

public class EmailService : IEmailService
{
    private readonly IEmailSettingsService _emailSettings;
    private readonly ILogger<EmailService> _logger;
    private readonly IWebHostEnvironment   _env;
    private readonly IExceptionLogService  _exLog;
    private readonly string                _siteUrl;
    private EmailConfig? _cachedCfg;

    public EmailService(
        IEmailSettingsService emailSettings,
        ILogger<EmailService> logger,
        IWebHostEnvironment   env,
        IExceptionLogService  exLog,
        IConfiguration        config)
    {
        _emailSettings = emailSettings;
        _logger        = logger;
        _env           = env;
        _exLog         = exLog;
        _siteUrl       = (config["Frontend:BaseUrl"] ?? "https://hindindisk.dk").TrimEnd('/');
    }

    private async Task<EmailConfig> GetCfgAsync()
        => _cachedCfg ??= await _emailSettings.GetEntityAsync();

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
            ["New"]               = ("Order Received",      "We've received your order and it's in the queue."),
            ["Preparing"]         = ("Preparing Your Order", "Our chefs are preparing your delicious meal."),
            ["Ready"]             = ("Order Ready",          "Your order is ready!"),
            ["Ready for Pick up"] = ("Ready for Pickup",     "Your order is ready for pickup! Please come collect it at your convenience."),
            ["Delivered"]         = ("Order Delivered",      "Your order has been delivered. Enjoy your meal!"),
            ["Cancelled"]         = ("Order Cancelled",      "Your order has been cancelled. Please contact us if you have any questions."),
        };

        if (!statusMessages.TryGetValue(newStatus, out var info)) return;

        var subject  = $"{info.label} — Order #{orderId} | Hind Indisk";
        var template = await LoadTemplateAsync("OrderStatusUpdate_Customer.htm");
        var body = template
            .Replace("[StatusLabel]",   WebUtility.HtmlEncode(info.label))
            .Replace("[OrderNumber]",   orderId.ToString())
            .Replace("[Customername]", WebUtility.HtmlEncode(toName))
            .Replace("[StatusMessage]", WebUtility.HtmlEncode(info.message));

        await SendAsync(toEmail, toName, subject, WrapInHtml(body));
    }

    // ── Customer: order cancelled (with optional reason) ────────────────────

    public async Task SendOrderCancelledCustomerAsync(string toEmail, string toName, long orderId, string? reason)
    {
        var subject  = $"Order Cancelled — #{orderId} | Hind Indisk";
        var template = await LoadTemplateAsync("OrderCancelled_Customer.htm");
        var body = template
            .Replace("[OrderNumber]",        orderId.ToString())
            .Replace("[Customername]",       WebUtility.HtmlEncode(toName))
            .Replace("[CancellationReason]", WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(reason) ? "—" : reason));

        await SendAsync(toEmail, toName, subject, WrapInHtml(body));
    }

    // ── Admin: order cancelled notification ──────────────────────────────────

    public async Task SendOrderCancelledAdminAsync(long orderId, string customerName, string customerEmail, string? reason)
    {
        var cfg = await GetCfgAsync();
        if (string.IsNullOrWhiteSpace(cfg.AdminToMail)) return;

        var subject  = $"Order #{orderId} Cancelled — Hind Indisk";
        var template = await LoadTemplateAsync("OrderCancelled_Admin.htm");
        var body = template
            .Replace("[OrderNumber]",        orderId.ToString())
            .Replace("[Customername]",       WebUtility.HtmlEncode(customerName))
            .Replace("[Email]",              WebUtility.HtmlEncode(customerEmail))
            .Replace("[CancellationReason]", WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(reason) ? "No reason provided" : reason));

        await SendAsync(cfg.AdminToMail, "Admin", subject, WrapInHtml(body), isAdmin: true);
    }

    // ── Admin: order notification ────────────────────────────────────────────

    public async Task SendAdminOrderNotificationAsync(OrderDto order)
    {
        var cfg = await GetCfgAsync();
        if (string.IsNullOrWhiteSpace(cfg.AdminToMail)) return;

        var templateFile = order.OrderType == "Delivery"
            ? "DeliveryOrder_Admin.htm"
            : "PlacedOrder_Admin.htm";

        var body = await LoadAndFillOrderTemplateAsync(templateFile, order, isAdmin: true);
        var subject = $"New Order #{order.Id} — {order.BranchName} | Hind Indisk";
        await SendAsync(cfg.AdminToMail, "Admin", subject, body, isAdmin: true);
    }

    // ── Customer: OTP for password reset ────────────────────────────────────

    public async Task SendOtpEmailAsync(string toEmail, string toName, string otp)
    {
        var subject  = "Password Reset OTP — Hind Indisk";
        var template = await LoadTemplateAsync("PasswordResetOtp.htm");
        var body = WrapInHtml(template
            .Replace("[Customername]", WebUtility.HtmlEncode(toName))
            .Replace("[Otp]",          WebUtility.HtmlEncode(otp)));

        var cfg = await GetCfgAsync();
        if (!cfg.Enabled)
        {
            _logger.LogInformation("Email disabled — OTP for {Email} is {Otp}", toEmail, otp);
            return;
        }

        // OTP delivery is critical — propagate failures so the caller can surface them to the user.
        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(cfg.FromName, cfg.FromAddress));
            message.To.Add(new MailboxAddress(toName, toEmail));
            message.Subject = subject;
            message.Body    = new TextPart("html") { Text = body };

            using var client = new SmtpClient();
            await client.ConnectAsync(cfg.SmtpHost, cfg.SmtpPort, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(cfg.SmtpUser, cfg.SmtpPass);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send OTP email to {Email}", toEmail);
            throw new InvalidOperationException("Failed to send OTP email. Please try again later.");
        }
    }

    // ── Customer: OTP for registration email verification ──────────────────

    public async Task SendRegistrationOtpEmailAsync(string toEmail, string toName, string otp)
    {
        var subject  = "Verify Your Email — Hind Indisk";
        var template = await LoadTemplateAsync("RegistrationOtp.htm");
        var body = WrapInHtml(template
            .Replace("[Customername]", WebUtility.HtmlEncode(toName))
            .Replace("[Otp]",          WebUtility.HtmlEncode(otp)));

        var cfg = await GetCfgAsync();
        if (!cfg.Enabled)
        {
            _logger.LogInformation("Email disabled — registration OTP for {Email} is {Otp}", toEmail, otp);
            return;
        }

        // OTP delivery is critical — propagate failures so the caller can surface them to the user.
        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(cfg.FromName, cfg.FromAddress));
            message.To.Add(new MailboxAddress(toName, toEmail));
            message.Subject = subject;
            message.Body    = new TextPart("html") { Text = body };

            using var client = new SmtpClient();
            await client.ConnectAsync(cfg.SmtpHost, cfg.SmtpPort, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(cfg.SmtpUser, cfg.SmtpPass);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send registration OTP email to {Email}", toEmail);
            throw new InvalidOperationException("Failed to send OTP email. Please try again later.");
        }
    }

    // ── Customer: welcome on registration ────────────────────────────────────

    public async Task SendWelcomeEmailAsync(string toEmail, string toName)
    {
        var subject  = "Welcome to Hind Indisk!";
        var template = await LoadTemplateAsync("Welcome.htm");
        var body = WrapInHtml(template
            .Replace("[Customername]",    WebUtility.HtmlEncode(toName))
            .Replace("[MenuLink]",        $"{_siteUrl}/menu")
            .Replace("[ReservationLink]", $"{_siteUrl}/reservation"));

        await SendAsync(toEmail, toName, subject, body);
    }

    // ── Customer: reservation status change ──────────────────────────────────

    public async Task SendReservationStatusUpdateAsync(
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

        var subject     = $"{label} — #{reservationId} | Hind Indisk";
        var displayDate = DateOnly.TryParse(date, out var parsedDate) ? parsedDate.ToString("dd-MM-yyyy") : date;

        var template = await LoadTemplateAsync("ReservationStatusUpdate_Customer.htm");
        var body = WrapInHtml(template
            .Replace("[StatusLabel]",         WebUtility.HtmlEncode(label))
            .Replace("[ReservationNumber]",   reservationId.ToString())
            .Replace("[Customername]",        WebUtility.HtmlEncode(toName))
            .Replace("[StatusMessage]",       WebUtility.HtmlEncode(message))
            .Replace("[Branch]",              WebUtility.HtmlEncode(branchName))
            .Replace("[ReservationSlotDate]", WebUtility.HtmlEncode(displayDate))
            .Replace("[ReservationSlotTime]", WebUtility.HtmlEncode(timeSlot))
            .Replace("[Noperson]",            guestCount.ToString()));

        await SendAsync(toEmail, toName, subject, body);
    }

    // ── Admin: reservation notification ─────────────────────────────────────

    public async Task SendAdminReservationNotificationAsync(ReservationDto reservation)
    {
        var cfg = await GetCfgAsync();
        if (string.IsNullOrWhiteSpace(cfg.AdminToMail)) return;

        var body = await LoadAndFillReservationTemplateAsync("Reservation_Admin.htm", reservation);
        var subject = $"New Reservation #{reservation.Id} — {reservation.BranchName} | Hind Indisk";
        await SendAsync(cfg.AdminToMail, "Admin", subject, body, isAdmin: true);
    }

    // ── Admin: contact form enquiry ──────────────────────────────────────────

    public async Task SendContactEnquiryAsync(string fromName, string fromEmail, string subject, string message)
    {
        var cfg = await GetCfgAsync();
        if (string.IsNullOrWhiteSpace(cfg.AdminToMail)) return;

        var template = await LoadTemplateAsync("Contact.htm");
        var body = template
            .Replace("[Customername]", WebUtility.HtmlEncode(fromName))
            .Replace("[Email]",        WebUtility.HtmlEncode(fromEmail))
            .Replace("[Subject]",      WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(subject) ? "—" : subject))
            .Replace("[Message]",      WebUtility.HtmlEncode(message));

        var emailSubject = $"Contact Enquiry from {fromName} — Hind Indisk";
        await SendAsync(cfg.AdminToMail, "Admin", emailSubject, WrapInHtml(body), isAdmin: true);
    }

    // ── Customer: contact form acknowledgement ───────────────────────────────

    public async Task SendContactConfirmationAsync(string toEmail, string toName, string subject, string message)
    {
        var template = await LoadTemplateAsync("Contact_Customer.htm");
        var body = template
            .Replace("[Customername]", WebUtility.HtmlEncode(toName))
            .Replace("[Email]",        WebUtility.HtmlEncode(toEmail))
            .Replace("[Subject]",      WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(subject) ? "—" : subject))
            .Replace("[Message]",      WebUtility.HtmlEncode(message));

        await SendAsync(toEmail, toName, "We received your message — Hind Indisk", WrapInHtml(body));
    }

    public async Task SendNewCustomerCredentialsAsync(string toEmail, string toName, string plainPassword)
    {
        var template = await LoadTemplateAsync("NewCustomerCredentials.htm");
        var body = WrapInHtml(template
            .Replace("[Customername]", WebUtility.HtmlEncode(toName))
            .Replace("[Email]",        WebUtility.HtmlEncode(toEmail))
            .Replace("[Password]",     WebUtility.HtmlEncode(plainPassword))
            .Replace("[AccountLink]",  $"{_siteUrl}/account"));

        await SendAsync(toEmail, toName, "Welcome to Hind Indisk — Your Account Details", body);
    }

    // ── Template helpers ─────────────────────────────────────────────────────

    private async Task<string> LoadAndFillOrderTemplateAsync(string fileName, OrderDto order, bool isAdmin)
    {
        var template = await LoadTemplateAsync(fileName);

        var scheduledDate = order.ScheduledDate.HasValue ? order.ScheduledDate.Value.ToString("dd-MM-yyyy") : "ASAP";
        var scheduledTime = order.ScheduledDate.HasValue && !string.IsNullOrWhiteSpace(order.ScheduledTime) ? order.ScheduledTime : "ASAP";
        var itemRows      = BuildOrderItemRows(order);
        var totalItems    = order.Items.Sum(i => i.Quantity);

        var body = template
            .Replace("[Customername]", WebUtility.HtmlEncode(order.ContactName))
            .Replace("[OrderNumber]",  order.Id.ToString())
            .Replace("[Mobile]",       WebUtility.HtmlEncode(order.ContactPhone))
            .Replace("[Email]",        WebUtility.HtmlEncode(order.ContactEmail ?? "—"))
            .Replace("[Branch]",       WebUtility.HtmlEncode(order.BranchName))
            .Replace("[OrderType]",    WebUtility.HtmlEncode(order.OrderType))
            .Replace("[ScheduledDate]", scheduledDate)
            .Replace("[ScheduledTime]", scheduledTime)
            .Replace("[Orderdate]",    order.CreatedAt.ToString("dd-MM-yyyy"))
            .Replace("[Ordertime]",    order.CreatedAt.ToString("HH:mm"))
            .Replace("[Instruction]",  WebUtility.HtmlEncode(order.SpecialInstructions ?? "—"))
            .Replace("[Noofitem]",     totalItems.ToString())
            .Replace("[tabtable]",     itemRows)
            .Replace("[Address]",      WebUtility.HtmlEncode(order.DeliveryAddress ?? "—"));

        return WrapInHtml(body);
    }

    private async Task<string> LoadAndFillReservationTemplateAsync(string fileName, ReservationDto reservation)
    {
        var template = await LoadTemplateAsync(fileName);

        var slotDate = DateOnly.TryParse(reservation.Date, out var d) ? d.ToString("dd-MM-yyyy") : reservation.Date;

        var body = template
            .Replace("[Customername]",      WebUtility.HtmlEncode(reservation.ContactName))
            .Replace("[Email]",             WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(reservation.ContactEmail) ? "—" : reservation.ContactEmail))
            .Replace("[Mobile]",            WebUtility.HtmlEncode(reservation.ContactPhone))
            .Replace("[Noperson]",          reservation.GuestCount.ToString())
            .Replace("[ReservationSlotDate]", WebUtility.HtmlEncode(slotDate))
            .Replace("[ReservationSlotTime]", WebUtility.HtmlEncode(reservation.TimeSlot))
            .Replace("[Message]",           WebUtility.HtmlEncode(reservation.SpecialRequests ?? "—"))
            .Replace("[ReservationNumber]", reservation.Id.ToString())
            .Replace("[ReservationDate]",   reservation.CreatedAt.ToString("dd-MM-yyyy"))
            .Replace("[ReservationTime]",   reservation.CreatedAt.ToString("HH:mm"))
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

        if (order.Tax > 0)
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
        try
        {
            var cfg = await GetCfgAsync();
            if (!cfg.Enabled)
            {
                _logger.LogInformation(
                    "Email disabled — would have sent '{Subject}' to {Email}", subject, toEmail);
                return;
            }

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(cfg.FromName, cfg.FromAddress));
            message.To.Add(new MailboxAddress(toName, toEmail));
            message.Subject = subject;
            message.Body    = new TextPart("html") { Text = htmlBody };

            if (isAdmin)
            {
                foreach (var cc in SplitAddresses(cfg.CC))
                    message.Cc.Add(MailboxAddress.Parse(cc));
                foreach (var bcc in SplitAddresses(cfg.BCC))
                    message.Bcc.Add(MailboxAddress.Parse(bcc));
            }

            using var client = new SmtpClient();
            await client.ConnectAsync(cfg.SmtpHost, cfg.SmtpPort, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(cfg.SmtpUser, cfg.SmtpPass);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
        catch (Exception ex)
        {
            // Log but don't throw — email failure must never break the main operation
            _logger.LogError(ex, "Failed to send email '{Subject}' to {Email}", subject, toEmail);
            await _exLog.LogAsync("EMAIL", $"/email/{subject}", null, 500, ex, null, null);
        }
    }

    private static IEnumerable<string> SplitAddresses(string raw) =>
        raw.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
           .Where(s => s.Contains('@'));
}
