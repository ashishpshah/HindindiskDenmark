namespace HindIndisk.Api.Application.DTOs.Admin;

public record UpdateBranchEmailRecipientsRequest(
    string AdminToMail,
    string CC,
    string BCC);
