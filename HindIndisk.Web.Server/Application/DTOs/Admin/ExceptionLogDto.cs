namespace HindIndisk.Api.Application.DTOs.Admin;

public record ExceptionLogDto(
    long     Id,
    DateTime OccurredAt,
    string   HttpMethod,
    string   RequestPath,
    string?  QueryString,
    int      StatusCode,
    string   ExceptionType,
    string   ExceptionMessage,
    string?  StackTrace,
    long?    UserId,
    string?  ClientIp
);
