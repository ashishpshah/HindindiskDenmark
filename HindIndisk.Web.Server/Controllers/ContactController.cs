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
    public async Task<IActionResult> Submit([FromBody] ContactRequest request)
    {
        var baseUrl = HttpContext.Request.GetBaseUrl();
        await _email.SendContactEnquiryAsync(request.Name, request.Email, request.Subject, request.Message, request.BranchId, baseUrl);
        await _email.SendContactConfirmationAsync(request.Email, request.Name, request.Subject, request.Message, baseUrl);
        return Ok(new { message = "Message received. We'll reply within 24 hours." });
    }
}
