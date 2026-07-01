import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type AdminDashboardDto = {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  todayReservations: number;
  totalOrders: number;
  totalRevenue: number;
};

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin-dashboard"],
    queryFn:  () => apiFetch<AdminDashboardDto>("/api/admin/dashboard"),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}
