import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type HourlyVolumeDto = {
  hour: number;
  count: number;
};

export function useHourlyVolume(date?: string) {
  const qs = date ? `?date=${date}` : "";
  return useQuery({
    queryKey: ["admin-hourly-volume", date],
    queryFn:  () => apiFetch<HourlyVolumeDto[]>(`/api/admin/dashboard/hourly-volume${qs}`),
    refetchInterval: 60_000,
  });
}
