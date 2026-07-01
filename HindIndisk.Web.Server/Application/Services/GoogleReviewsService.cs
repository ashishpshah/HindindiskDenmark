using System.Text.Json;
using System.Text.Json.Serialization;
using HindIndisk.Api.Application.DTOs.Reviews;
using Microsoft.Extensions.Caching.Memory;

namespace HindIndisk.Api.Application.Services;

public class GoogleReviewsService : IGoogleReviewsService
{
    const string CacheKey = "google_place_reviews";

    readonly IHttpClientFactory _http;
    readonly IMemoryCache       _cache;
    readonly string             _apiKey;
    readonly string             _placeId;
    readonly int                _cacheHours;

    public GoogleReviewsService(
        IHttpClientFactory http,
        IMemoryCache       cache,
        IConfiguration     config)
    {
        _http       = http;
        _cache      = cache;
        _apiKey     = config["GooglePlaces:ApiKey"]    ?? throw new InvalidOperationException("GooglePlaces:ApiKey is not configured.");
        _placeId    = config["GooglePlaces:PlaceId"]   ?? throw new InvalidOperationException("GooglePlaces:PlaceId is not configured.");
        _cacheHours = int.TryParse(config["GooglePlaces:CacheHours"], out var h) ? h : 24;
    }

    public async Task<PlaceReviewsDto> GetReviewsAsync()
    {
        if (_cache.TryGetValue(CacheKey, out PlaceReviewsDto? cached) && cached is not null)
            return cached;

        var client = _http.CreateClient("GooglePlaces");
        var url    = $"https://places.googleapis.com/v1/places/{_placeId}";

        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("X-Goog-Api-Key",   _apiKey);
        request.Headers.Add("X-Goog-FieldMask", "reviews,rating,userRatingCount");

        using var response = await client.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var json   = await response.Content.ReadAsStringAsync();
        var raw    = JsonSerializer.Deserialize<PlacesApiResponse>(json, JsonOpts) ?? new PlacesApiResponse();
        var result = MapToDto(raw);

        _cache.Set(CacheKey, result, TimeSpan.FromHours(_cacheHours));
        return result;
    }

    static PlaceReviewsDto MapToDto(PlacesApiResponse raw)
    {
        var reviews = (raw.Reviews ?? [])
            .Where(r => !string.IsNullOrWhiteSpace(r.Text?.Text))
            .Select(r => new GoogleReviewDto(
                AuthorName:       r.AuthorAttribution?.DisplayName ?? "Guest",
                AuthorPhotoUrl:   r.AuthorAttribution?.PhotoUri,
                AuthorProfileUrl: r.AuthorAttribution?.Uri,
                Rating:           r.Rating,
                Text:             r.Text!.Text!,
                RelativeTime:     r.RelativePublishTimeDescription ?? "",
                PublishTime:      r.PublishTime ?? ""
            ))
            .ToList();

        return new PlaceReviewsDto(raw.Rating, raw.UserRatingCount, reviews);
    }

    static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy        = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    // ── Raw API response shapes ────────────────────────────────────────────────

    class PlacesApiResponse
    {
        public List<PlaceReview>? Reviews          { get; set; }
        public double             Rating           { get; set; }
        public int                UserRatingCount  { get; set; }
    }

    class PlaceReview
    {
        public string?             RelativePublishTimeDescription { get; set; }
        public int                 Rating                         { get; set; }
        public LocalizedText?      Text                           { get; set; }
        public AuthorAttribution?  AuthorAttribution              { get; set; }
        public string?             PublishTime                    { get; set; }
    }

    class LocalizedText
    {
        public string? Text         { get; set; }
        public string? LanguageCode { get; set; }
    }

    class AuthorAttribution
    {
        public string? DisplayName { get; set; }
        public string? Uri         { get; set; }
        public string? PhotoUri    { get; set; }
    }
}
