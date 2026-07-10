namespace HindIndisk.Api.Application.DTOs.Gallery;

public record GalleryImageDto(
    long     Id,
    string   Url,
    string   Caption,
    string   CaptionDa,
    int      SortOrder,
    bool     IsActive,
    DateTime CreatedAt
);

public record CreateGalleryImageRequest(
    string Url,
    string Caption,
    string CaptionDa,
    int    SortOrder,
    bool   IsActive
);

public record UpdateGalleryImageRequest(
    string? Caption,
    string? CaptionDa,
    bool?   IsActive,
    int?    SortOrder
);
