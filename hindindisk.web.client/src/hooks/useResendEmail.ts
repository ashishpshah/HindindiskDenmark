import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export function useResendOrderEmail() {
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<{ message: string }>(`/api/admin/orders/${id}/resend-email`, { method: "POST" }),
  });
}

export function useResendReservationEmail() {
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<{ message: string }>(`/api/admin/reservations/${id}/resend-email`, { method: "POST" }),
  });
}
