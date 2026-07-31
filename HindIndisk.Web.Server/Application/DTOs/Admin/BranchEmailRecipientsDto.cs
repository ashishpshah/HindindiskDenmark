namespace HindIndisk.Api.Application.DTOs.Admin;

public record BranchEmailRecipientsDto(
    long   BranchId,
    string BranchName,
    string AdminToMail,
    string CC,
    string BCC);
