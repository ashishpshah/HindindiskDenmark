import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type FooterSettingsDto = {
  copyright:   string;
  copyrightDa: string;
};

export type UpdateFooterSettingsInput = Partial<FooterSettingsDto>;

// ── Public ────────────────────────────────────────────────────────────────────

export function useFooterSettings() {
  return useQuery({
    queryKey:  ["footer-settings"],
    queryFn:   () => apiFetch<FooterSettingsDto>("/api/locations/footer-settings"),
    staleTime: 60_000,
  });
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export function useAdminFooterSettings() {
  return useQuery({
    queryKey: ["admin-footer-settings"],
    queryFn:  () => apiFetch<FooterSettingsDto>("/api/admin/footer-settings"),
  });
}

export function useUpdateFooterSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateFooterSettingsInput) =>
      apiFetch<FooterSettingsDto>("/api/admin/footer-settings", {
        method: "PATCH", body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-footer-settings"] });
      qc.invalidateQueries({ queryKey: ["footer-settings"] });
    },
  });
}
