namespace HindIndisk.Api.Application.DTOs.Reviews;

public record GoogleReviewDto(
    string  AuthorName,
    string? AuthorPhotoUrl,
    string? AuthorProfileUrl,
    int     Rating,
    string  Text,
    string  RelativeTime,
    string  PublishTime
);

public record PlaceReviewsDto(
    double                        Rating,
    int                           UserRatingCount,
    IReadOnlyList<GoogleReviewDto> Reviews
);
