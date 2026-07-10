import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type CtaDto = {
  text: string;
  textDa: string;
  link: string;
};

export type HeroSlideDto = {
  id: number;
  title: string;
  titleDa: string;
  subtitle: string;
  subtitleDa: string;
  tagline: string;
  taglineDa: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
  ctas: CtaDto[];
  createdAt: string;
  updatedAt: string | null;
};

export type CreateHeroSlideInput = {
  title: string;
  titleDa: string;
  subtitle: string;
  subtitleDa: string;
  tagline: string;
  taglineDa: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
  ctas: CtaDto[];
};

export type UpdateHeroSlideInput = {
  title?: string;
  titleDa?: string;
  subtitle?: string;
  subtitleDa?: string;
  tagline?: string;
  taglineDa?: string;
  imageUrl?: string;
  isActive?: boolean;
  sortOrder?: number;
  ctas?: CtaDto[];
};

// ── Public (active slides) ────────────────────────────────────────────

export function useHeroSlides() {
  return useQuery({
    queryKey: ["hero-slides"],
    queryFn: () => apiFetch<HeroSlideDto[]>("/api/locations/hero-slides"),
    staleTime: 30_000,
  });
}

// ── Admin (all slides) ────────────────────────────────────────────────

export function useAdminHeroSlides() {
  return useQuery({
    queryKey: ["admin-hero-slides"],
    queryFn: () => apiFetch<HeroSlideDto[]>("/api/admin/hero-slides"),
  });
}

// ── Mutations ─────────────────────────────────────────────────────────

export function useCreateHeroSlide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateHeroSlideInput) =>
      apiFetch<HeroSlideDto>("/api/admin/hero-slides", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-hero-slides"] });
      qc.invalidateQueries({ queryKey: ["hero-slides"] });
    },
  });
}

export function useUpdateHeroSlide(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateHeroSlideInput) =>
      apiFetch<HeroSlideDto>(`/api/admin/hero-slides/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-hero-slides"] });
      qc.invalidateQueries({ queryKey: ["hero-slides"] });
    },
  });
}

export function useDeleteHeroSlide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<void>(`/api/admin/hero-slides/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-hero-slides"] });
      qc.invalidateQueries({ queryKey: ["hero-slides"] });
    },
  });
}

export function useReorderHeroSlide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sortOrder }: { id: number; sortOrder: number }) =>
      apiFetch<HeroSlideDto>(`/api/admin/hero-slides/${id}/reorder`, {
        method: "PUT",
        body: JSON.stringify({ sortOrder }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-hero-slides"] });
      qc.invalidateQueries({ queryKey: ["hero-slides"] });
    },
  });
}