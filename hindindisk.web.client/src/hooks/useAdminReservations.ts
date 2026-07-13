import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
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
  cancellationReason?: string;
};

// Support both paginated response and direct array
export type ReservationsPageDto = {
  items: AdminReservationDto[];
  total: number;
} | AdminReservationDto[];

function normalizeResponse(data: unknown): { items: AdminReservationDto[]; total: number } {
  if (Array.isArray(data)) {
    return { items: data, total: data.length };
  }
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.items)) {
      const items = obj.items as AdminReservationDto[];
      const total = typeof obj.total === "number" ? obj.total : items.length;
      return { items, total };
    }
  }
  return { items: [], total: 0 };
}

export function useAdminReservations(params?: {
  status?: string;
  branchId?: number;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const debouncedSearch = useDebouncedValue(params?.search ?? "", 300);

  const qs = new URLSearchParams();
  if (params?.status)   qs.set("status",   params.status);
  if (params?.branchId) qs.set("branchId", String(params.branchId));
  if (params?.date)     qs.set("date",     params.date);
  if (params?.dateFrom) qs.set("dateFrom", params.dateFrom);
  if (params?.dateTo)   qs.set("dateTo",   params.dateTo);
  if (debouncedSearch)  qs.set("search",   debouncedSearch);
  if (params?.page)     qs.set("page",     String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  const query = qs.toString();

  const queryKey = [
    "admin-reservations",
    params?.status,
    params?.branchId,
    params?.date,
    params?.dateFrom,
    params?.dateTo,
    debouncedSearch,
    params?.page,
    params?.pageSize,
  ];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const raw = await apiFetch<unknown>(`/api/admin/reservations${query ? `?${query}` : ""}`);
      return normalizeResponse(raw);
    },
    select: (data) => data, // already normalized
  });
}
