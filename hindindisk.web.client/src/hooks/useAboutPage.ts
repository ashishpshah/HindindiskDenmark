import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

// ── Public types ──────────────────────────────────────────────────────────────

export type AboutPageSettingsDto = { heroImage: string; storyImage: string };
export type AboutStatDto         = { id: number; value: string; label: string; labelDa: string; sortOrder: number };
export type AboutMvvDto          = { id: number; title: string; titleDa: string; description: string; descriptionDa: string; icon: string; sortOrder: number };
export type AboutTimelineDto     = { id: number; year: string; title: string; titleDa: string; description: string; descriptionDa: string; sortOrder: number };
export type TeamMemberDto        = { id: number; name: string; role: string; roleDa: string; image: string; sortOrder: number; isActive: boolean };

export type AboutPageDto = {
  settings: AboutPageSettingsDto;
  stats:    AboutStatDto[];
  mvv:      AboutMvvDto[];
  timeline: AboutTimelineDto[];
  team:     TeamMemberDto[];
};

// ── Public hook ───────────────────────────────────────────────────────────────

export function useAboutPage(branchId: number | undefined) {
  return useQuery({
    queryKey: ["about-page", branchId],
    queryFn:  () => apiFetch<AboutPageDto>(`/api/locations/about?branchId=${branchId}`),
    enabled:  !!branchId,
    staleTime: 60_000,
  });
}

// ── Admin — settings (branch-scoped) ────────────────────────────────────────

export function useAdminAboutSettings(branchId: number | undefined) {
  return useQuery({
    queryKey: ["admin-about-settings", branchId],
    queryFn:  () => apiFetch<AboutPageSettingsDto>(`/api/admin/branches/${branchId}/about/settings`),
    enabled:  !!branchId,
  });
}

export function useUpdateAboutSettings(branchId: number | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<AboutPageSettingsDto>) =>
      apiFetch<AboutPageSettingsDto>(`/api/admin/branches/${branchId}/about/settings`, {
        method: "PATCH", body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-about-settings", branchId] });
      qc.invalidateQueries({ queryKey: ["about-page", branchId] });
    },
  });
}

// ── Admin — stats ─────────────────────────────────────────────────────────────

export type SaveAboutStatInput = { value: string; label: string; labelDa: string; sortOrder: number };

export function useAdminAboutStats() {
  return useQuery({
    queryKey: ["admin-about-stats"],
    queryFn:  () => apiFetch<AboutStatDto[]>("/api/admin/about/stats"),
  });
}

export function useCreateAboutStat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveAboutStatInput) =>
      apiFetch<AboutStatDto>("/api/admin/about/stats", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-about-stats"] }); qc.invalidateQueries({ queryKey: ["about-page"] }); },
  });
}

export function useUpdateAboutStat(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveAboutStatInput) =>
      apiFetch<AboutStatDto>(`/api/admin/about/stats/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-about-stats"] }); qc.invalidateQueries({ queryKey: ["about-page"] }); },
  });
}

export function useDeleteAboutStat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/admin/about/stats/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-about-stats"] }); qc.invalidateQueries({ queryKey: ["about-page"] }); },
  });
}

// ── Admin — MVV ───────────────────────────────────────────────────────────────

export type SaveAboutMvvInput = { title: string; titleDa: string; description: string; descriptionDa: string; icon: string; sortOrder: number };

export function useAdminAboutMvv() {
  return useQuery({
    queryKey: ["admin-about-mvv"],
    queryFn:  () => apiFetch<AboutMvvDto[]>("/api/admin/about/mvv"),
  });
}

export function useCreateAboutMvv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveAboutMvvInput) =>
      apiFetch<AboutMvvDto>("/api/admin/about/mvv", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-about-mvv"] }); qc.invalidateQueries({ queryKey: ["about-page"] }); },
  });
}

export function useUpdateAboutMvv(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveAboutMvvInput) =>
      apiFetch<AboutMvvDto>(`/api/admin/about/mvv/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-about-mvv"] }); qc.invalidateQueries({ queryKey: ["about-page"] }); },
  });
}

export function useDeleteAboutMvv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/admin/about/mvv/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-about-mvv"] }); qc.invalidateQueries({ queryKey: ["about-page"] }); },
  });
}

// ── Admin — timeline (branch-scoped) ────────────────────────────────────────

export type SaveAboutTimelineInput = { year: string; title: string; titleDa: string; description: string; descriptionDa: string; sortOrder: number };

export function useAdminAboutTimeline(branchId: number | undefined) {
  return useQuery({
    queryKey: ["admin-about-timeline", branchId],
    queryFn:  () => apiFetch<AboutTimelineDto[]>(`/api/admin/branches/${branchId}/about/timeline`),
    enabled:  !!branchId,
  });
}

export function useCreateAboutTimeline(branchId: number | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveAboutTimelineInput) =>
      apiFetch<AboutTimelineDto>(`/api/admin/branches/${branchId}/about/timeline`, { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-about-timeline", branchId] }); qc.invalidateQueries({ queryKey: ["about-page", branchId] }); },
  });
}

export function useUpdateAboutTimeline(branchId: number | undefined, id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveAboutTimelineInput) =>
      apiFetch<AboutTimelineDto>(`/api/admin/branches/${branchId}/about/timeline/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-about-timeline", branchId] }); qc.invalidateQueries({ queryKey: ["about-page", branchId] }); },
  });
}

export function useDeleteAboutTimeline(branchId: number | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/admin/branches/${branchId}/about/timeline/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-about-timeline", branchId] }); qc.invalidateQueries({ queryKey: ["about-page", branchId] }); },
  });
}

// ── Admin — team (branch-scoped) ────────────────────────────────────────────

export type SaveTeamMemberInput = { name: string; role: string; roleDa: string; image: string; sortOrder: number; isActive: boolean };

export function useAdminAboutTeam(branchId: number | undefined) {
  return useQuery({
    queryKey: ["admin-about-team", branchId],
    queryFn:  () => apiFetch<TeamMemberDto[]>(`/api/admin/branches/${branchId}/about/team`),
    enabled:  !!branchId,
  });
}

export function useCreateTeamMember(branchId: number | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveTeamMemberInput) =>
      apiFetch<TeamMemberDto>(`/api/admin/branches/${branchId}/about/team`, { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-about-team", branchId] }); qc.invalidateQueries({ queryKey: ["about-page", branchId] }); },
  });
}

export function useUpdateTeamMember(branchId: number | undefined, id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveTeamMemberInput) =>
      apiFetch<TeamMemberDto>(`/api/admin/branches/${branchId}/about/team/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-about-team", branchId] }); qc.invalidateQueries({ queryKey: ["about-page", branchId] }); },
  });
}

export function useDeleteTeamMember(branchId: number | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/admin/branches/${branchId}/about/team/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-about-team", branchId] }); qc.invalidateQueries({ queryKey: ["about-page", branchId] }); },
  });
}
