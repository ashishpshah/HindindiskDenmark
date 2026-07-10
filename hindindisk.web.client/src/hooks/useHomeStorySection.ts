import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type HomeStorySectionDto = {
  eyebrow:               string;
  eyebrowDa:             string;
  title:                 string;
  titleDa:               string;
  subtitle:              string;
  subtitleDa:            string;
  heritageBadgeLabel:    string;
  heritageBadgeLabelDa:  string;
  heritageBadgeSince:    string;
  heritageBadgeSinceDa:  string;
  buttonText:            string;
  buttonTextDa:          string;
  buttonLink:            string;
  mainImage:             string;
  overlayImage:          string;
};

export type UpdateHomeStorySectionInput = Partial<HomeStorySectionDto>;

// ── Public ────────────────────────────────────────────────────────────────────

export function useHomeStorySection() {
  return useQuery({
    queryKey:  ["home-story-section"],
    queryFn:   () => apiFetch<HomeStorySectionDto>("/api/locations/home-story"),
    staleTime: 60_000,
  });
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export function useAdminHomeStorySection() {
  return useQuery({
    queryKey: ["admin-home-story-section"],
    queryFn:  () => apiFetch<HomeStorySectionDto>("/api/admin/home-story"),
  });
}

export function useUpdateHomeStorySection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateHomeStorySectionInput) =>
      apiFetch<HomeStorySectionDto>("/api/admin/home-story", {
        method: "PATCH", body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-home-story-section"] });
      qc.invalidateQueries({ queryKey: ["home-story-section"] });
    },
  });
}
