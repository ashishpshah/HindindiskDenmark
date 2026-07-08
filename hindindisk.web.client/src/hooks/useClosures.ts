import { useQuery, useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type ClosureScope = "Restaurant" | "Reservation" | "Pickup" | "Delivery";
export type ClosureType = "DateRange" | "Weekly";

export type ClosureDto = {
  id: number;
  branchId: number;
  scope: ClosureScope;
  closureType: ClosureType;
  startDate: string | null; // "yyyy-MM-dd"
  endDate: string | null;   // "yyyy-MM-dd"
  dayOfWeek: number | null; // 0 = Sunday .. 6 = Saturday
  startTime: string | null; // "HH:mm" — null = all-day
  endTime: string | null;   // "HH:mm"
  note: string | null;
  createdAt: string;
  createdBy: string | null;
};

export type CreateClosureInput = {
  scope: ClosureScope;
  closureType: ClosureType;
  startDate?: string;
  endDate?: string;
  dayOfWeek?: number;
  startTime?: string; // "HH:mm" — omit for all-day
  endTime?: string;
  note?: string;
};

export function useAllClosures(branchIds: number[]) {
  const results = useQueries({
    queries: branchIds.map(id => ({
      queryKey: ["closures", id] as const,
      queryFn:  () => apiFetch<ClosureDto[]>(`/api/admin/branches/${id}/closures`),
      enabled:  id > 0,
    })),
  });
  return {
    data:      results.flatMap(r => r.data ?? []),
    isLoading: results.some(r => r.isLoading),
  };
}

export function useDeleteClosureById() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, closureId }: { branchId: number; closureId: number }) =>
      apiFetch<void>(`/api/admin/branches/${branchId}/closures/${closureId}`, { method: "DELETE" }),
    onSuccess: (_, { branchId }) => {
      qc.invalidateQueries({ queryKey: ["closures", branchId] });
      qc.invalidateQueries({ queryKey: ["slots"] });
      qc.invalidateQueries({ queryKey: ["branches"] });
    },
  });
}

export function useClosures(branchId: number) {
  return useQuery<ClosureDto[]>({
    queryKey: ["closures", branchId],
    queryFn:  () => apiFetch(`/api/admin/branches/${branchId}/closures`),
    enabled:  !!branchId,
  });
}

export function useCreateClosure(branchId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateClosureInput) =>
      apiFetch<ClosureDto>(`/api/admin/branches/${branchId}/closures`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["closures", branchId] });
      qc.invalidateQueries({ queryKey: ["slots"] });
      qc.invalidateQueries({ queryKey: ["branches"] });
    },
  });
}

export function useDeleteClosure(branchId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (closureId: number) =>
      apiFetch<void>(`/api/admin/branches/${branchId}/closures/${closureId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["closures", branchId] });
      qc.invalidateQueries({ queryKey: ["slots"] });
      qc.invalidateQueries({ queryKey: ["branches"] });
    },
  });
}
