import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type WhyChooseUsItemDto = {
  id: number;
  title: string;
  titleDa: string;
  description: string;
  descriptionDa: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
};

export type SaveWhyChooseUsItemInput = {
  title: string;
  titleDa: string;
  description: string;
  descriptionDa: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
};

// ── Public ────────────────────────────────────────────────────────────────────

export function useWhyChooseUs() {
  return useQuery({
    queryKey: ["why-choose-us"],
    queryFn:  () => apiFetch<WhyChooseUsItemDto[]>("/api/locations/why-choose-us"),
    staleTime: 60_000,
  });
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export function useAdminWhyChooseUs() {
  return useQuery({
    queryKey: ["admin-why-choose-us"],
    queryFn:  () => apiFetch<WhyChooseUsItemDto[]>("/api/admin/why-choose-us"),
  });
}

export function useCreateWhyChooseUs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveWhyChooseUsItemInput) =>
      apiFetch<WhyChooseUsItemDto>("/api/admin/why-choose-us", {
        method: "POST", body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-why-choose-us"] });
      qc.invalidateQueries({ queryKey: ["why-choose-us"] });
    },
  });
}

export function useUpdateWhyChooseUs(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveWhyChooseUsItemInput) =>
      apiFetch<WhyChooseUsItemDto>(`/api/admin/why-choose-us/${id}`, {
        method: "PUT", body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-why-choose-us"] });
      qc.invalidateQueries({ queryKey: ["why-choose-us"] });
    },
  });
}

export function useDeleteWhyChooseUs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<void>(`/api/admin/why-choose-us/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-why-choose-us"] });
      qc.invalidateQueries({ queryKey: ["why-choose-us"] });
    },
  });
}
