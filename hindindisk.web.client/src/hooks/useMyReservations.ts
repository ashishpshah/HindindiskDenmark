import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import type { ReservationDto } from "./useCreateReservation";

export function useMyReservations(enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-reservations", user?.id],
    queryFn: () => apiFetch<ReservationDto[]>("/api/reservations/my"),
    enabled: enabled && !!user,
  });
}
