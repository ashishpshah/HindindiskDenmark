using HindIndisk.Api.Application.DTOs.Contact;
using HindIndisk.Api.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HindIndisk.Api.Controllers;

[ApiController]
[Route("api/contact")]
public class ContactController : ControllerBase
{
    private readonly IEmailService _email;

    public ContactController(IEmailService email) => _email = email;

    /// <summary>Submit a contact enquiry — fires emails to admin and the visitor.</summary>
    [HttpPost]
    [AllowAnonymous]
    public IActionResult Submit([FromBody] ContactRequest request)
    {
        _ = _email.SendContactEnquiryAsync(request.Name, request.Email, request.Subject, request.Message);
        _ = _email.SendContactConfirmationAsync(request.Email, request.Name, request.Subject, request.Message);
        return Ok(new { message = "Message received. We'll reply within 24 hours." });
    }
}
