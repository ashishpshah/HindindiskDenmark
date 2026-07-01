import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { ReservationDto } from "./useCreateReservation";

export function useMyReservations(enabled = true) {
  return useQuery({
    queryKey: ["my-reservations"],
    queryFn: () => apiFetch<ReservationDto[]>("/api/reservations/my"),
    enabled,
  });
}
