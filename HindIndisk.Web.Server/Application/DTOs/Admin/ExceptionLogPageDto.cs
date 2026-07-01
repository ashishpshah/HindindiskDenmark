namespace HindIndisk.Api.Application.DTOs.Admin;

public record ExceptionLogPageDto(
    IReadOnlyList<ExceptionLogDto> Items,
    int Total
);
