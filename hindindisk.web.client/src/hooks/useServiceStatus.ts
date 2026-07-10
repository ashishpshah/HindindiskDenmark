import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { AdminBranchDto } from "./useUpdateBranch";

export type ServiceType = "Order" | "Reservation" | "Delivery" | "Pickup";

export type BranchServiceClosureDto = {
  id: number;
  branchId: number;
  branchName: string;
  serviceType: ServiceType;
  closedAt: string;      // ISO datetime
  reopenedAt?: string;   // null = still closed
  closedBy?: string;
  note?: string | null;
  noteDa?: string | null;
};

export type ServiceClosureFilters = {
  branchId?: number;
  serviceType?: ServiceType;
  from?: string;  // YYYY-MM-DD
  to?: string;
};

export function useServiceStatus() {
  return useQuery({
    queryKey: ["service-status"],
    queryFn:  () => apiFetch<AdminBranchDto[]>("/api/admin/service-status"),
  });
}

export function useServiceClosureHistory(filters: ServiceClosureFilters = {}) {
  const params = new URLSearchParams();
  if (filters.branchId)    params.set("branchId",    String(filters.branchId));
  if (filters.serviceType) params.set("serviceType",  filters.serviceType);
  if (filters.from)        params.set("from",         filters.from);
  if (filters.to)          params.set("to",           filters.to);

  const qs = params.toString();
  return useQuery({
    queryKey: ["service-closures", filters],
    queryFn:  () => apiFetch<BranchServiceClosureDto[]>(`/api/admin/service-closures${qs ? `?${qs}` : ""}`),
  });
}

export function useToggleServiceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, serviceType, isClosed, note, noteDa }: {
      branchId: number;
      serviceType: ServiceType;
      isClosed: boolean;
      note?: string;
      noteDa?: string;
    }) =>
      apiFetch<BranchServiceClosureDto>(`/api/admin/branches/${branchId}/service-status`, {
        method: "PATCH",
        body: JSON.stringify({ serviceType, isClosed, note, noteDa }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service-status"] });
      qc.invalidateQueries({ queryKey: ["service-closures"] });
      qc.invalidateQueries({ queryKey: ["branches"] });
      qc.invalidateQueries({ queryKey: ["admin-branches"] });
    },
  });
}
