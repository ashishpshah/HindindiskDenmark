import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { AdminReservationDto } from "./useAdminReservations";

export function useUpdateReservationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiFetch<AdminReservationDto>(`/api/admin/reservations/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reservations"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
  });
}
