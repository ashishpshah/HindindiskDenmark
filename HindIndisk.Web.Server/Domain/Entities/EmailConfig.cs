namespace HindIndisk.Api.Domain.Entities;

public class EmailConfig
{
    public int    Id          { get; set; }
    public string SmtpHost    { get; set; } = string.Empty;
    public int    SmtpPort    { get; set; } = 587;
    public string SmtpUser    { get; set; } = string.Empty;
    public string SmtpPass    { get; set; } = string.Empty;
    public string FromName    { get; set; } = string.Empty;
    public string FromAddress { get; set; } = string.Empty;
    public string AdminToMail { get; set; } = string.Empty;
    public string CC          { get; set; } = string.Empty;
    public string BCC         { get; set; } = string.Empty;
    public bool   Enabled     { get; set; } = false;
}
