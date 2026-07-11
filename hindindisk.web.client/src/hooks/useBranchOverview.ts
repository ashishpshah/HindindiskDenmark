import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type BranchOverviewDto = {
  branchName: string;
  todayOrders: number;
  todayRevenue: number;
};

export function useBranchOverview() {
  return useQuery({
    queryKey: ["admin-branch-overview"],
    queryFn:  () => apiFetch<BranchOverviewDto[]>("/api/admin/dashboard/branch-overview"),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}
