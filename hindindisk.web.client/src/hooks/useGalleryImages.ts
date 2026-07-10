import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type GalleryImageDto = {
  id: number;
  url: string;
  caption: string;
  captionDa: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
};

export type CreateGalleryImageInput = {
  url: string;
  caption: string;
  captionDa: string;
  sortOrder: number;
  isActive: boolean;
};

export type UpdateGalleryImageInput = {
  caption?: string;
  captionDa?: string;
  isActive?: boolean;
  sortOrder?: number;
};

// ── Public ────────────────────────────────────────────────────────────────────

export function useGalleryImages() {
  return useQuery({
    queryKey: ["gallery-images"],
    queryFn: () => apiFetch<GalleryImageDto[]>("/api/locations/gallery"),
    staleTime: 60_000,
  });
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export function useAdminGalleryImages() {
  return useQuery({
    queryKey: ["admin-gallery-images"],
    queryFn: () => apiFetch<GalleryImageDto[]>("/api/admin/gallery"),
  });
}

export function useCreateGalleryImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGalleryImageInput) =>
      apiFetch<GalleryImageDto>("/api/admin/gallery", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-gallery-images"] });
      qc.invalidateQueries({ queryKey: ["gallery-images"] });
    },
  });
}

export function useUpdateGalleryImage(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateGalleryImageInput) =>
      apiFetch<GalleryImageDto>(`/api/admin/gallery/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-gallery-images"] });
      qc.invalidateQueries({ queryKey: ["gallery-images"] });
    },
  });
}

export function useDeleteGalleryImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<void>(`/api/admin/gallery/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-gallery-images"] });
      qc.invalidateQueries({ queryKey: ["gallery-images"] });
    },
  });
}
