import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type DayScheduleDto = {
  dayOfWeek: number;
  dayName: string;
  openTime: string;
  closeTime: string;
  slotIntervalMinutes: number;
  maxOrdersPerSlot: number;
  maxReservationsPerSlot: number;
};

export type UpsertDayScheduleInput = {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  slotIntervalMinutes: number;
  maxOrdersPerSlot: number;
  maxReservationsPerSlot: number;
};

export function useSchedule(branchId: number) {
  return useQuery<DayScheduleDto[]>({
    queryKey: ["schedule", branchId],
    queryFn:  () => apiFetch(`/api/admin/branches/${branchId}/schedule`),
    enabled:  !!branchId,
  });
}

export function useUpsertSchedule(branchId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rows: UpsertDayScheduleInput[]) =>
      apiFetch<DayScheduleDto[]>(`/api/admin/branches/${branchId}/schedule`, {
        method: "PUT",
        body: JSON.stringify(rows),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedule", branchId] });
      qc.invalidateQueries({ queryKey: ["branches"] });
      qc.invalidateQueries({ queryKey: ["slots"] });
    },
  });
}
