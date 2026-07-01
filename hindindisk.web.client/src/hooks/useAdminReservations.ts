import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type AdminReservationDto = {
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
  isLinkedToAccount: boolean;
};

export function useAdminReservations(params?: { status?: string; branchId?: number; date?: string }) {
  const qs = new URLSearchParams();
  if (params?.status)   qs.set("status",   params.status);
  if (params?.branchId) qs.set("branchId", String(params.branchId));
  if (params?.date)     qs.set("date",     params.date);
  const query = qs.toString();

  return useQuery({
    queryKey: ["admin-reservations", params?.status, params?.branchId, params?.date],
    queryFn:  () => apiFetch<AdminReservationDto[]>(`/api/admin/reservations${query ? `?${query}` : ""}`),
  });
}
