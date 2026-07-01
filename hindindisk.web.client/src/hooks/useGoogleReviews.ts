import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type GoogleReviewDto = {
  authorName:       string;
  authorPhotoUrl?:  string;
  authorProfileUrl?: string;
  rating:           number;
  text:             string;
  relativeTime:     string;
  publishTime:      string;
};

export type PlaceReviewsDto = {
  rating:          number;
  userRatingCount: number;
  reviews:         GoogleReviewDto[];
};

export function useGoogleReviews() {
  return useQuery({
    queryKey: ["google-reviews"],
    queryFn:  () => apiFetch<PlaceReviewsDto>("/api/reviews"),
    staleTime: 1000 * 60 * 60 * 24, // matches 24-hour backend cache
    retry: false,
  });
}
