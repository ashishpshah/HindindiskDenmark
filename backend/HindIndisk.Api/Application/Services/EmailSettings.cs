namespace HindIndisk.Api.Application.Services;

public class EmailSettings
{
    public string SmtpHost    { get; set; } = "smtp.gmail.com";
    public int    SmtpPort    { get; set; } = 587;
    public string SmtpUser    { get; set; } = string.Empty;
    public string SmtpPass    { get; set; } = string.Empty;
    public string FromName    { get; set; } = "Hind Indisk Restaurant";
    public string FromAddress { get; set; } = string.Empty;
    public bool   Enabled     { get; set; } = false;
}
