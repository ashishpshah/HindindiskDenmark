import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type AdminTrendDto = {
  yesterdayOrders: number;
  yesterdayRevenue: number;
  yesterdayReservations: number;
};

export function useAdminDashboardTrends() {
  return useQuery({
    queryKey: ["admin-dashboard-trends"],
    queryFn:  () => apiFetch<AdminTrendDto>("/api/admin/dashboard/trends"),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}
