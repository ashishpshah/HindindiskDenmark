import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type CreateReservationRequest = {
  branchId: number;
  date: string;       // yyyy-MM-dd
  timeSlot: string;   // HH:mm
  guestCount: number;
  firstname: string;
  lastname: string;
  phone: string;
  email?: string;
  specialRequests?: string;
};

export type ReservationDto = {
  id: number;
  branchName: string;
  date: string;
  timeSlot: string;
  guestCount: number;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  specialRequests?: string;
  status: string;
  createdAt: string;
};

export function useCreateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateReservationRequest) =>
      apiFetch<ReservationDto>("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-reservations"] });
    },
  });
}
