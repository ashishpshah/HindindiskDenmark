import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type AdminCustomerDto = {
  id: number;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  orderCount: number;
  reservationCount: number;
  totalSpend: number;
};

export type AdminCustomerOrderItemDto = {
  name: string;
  quantity: number;
  priceAtPurchase: number;
};

export type AdminCustomerOrderDto = {
  id: number;
  branchName: string;
  orderType: string;
  total: number;
  status: string;
  createdAt: string;
  itemCount: number;
  items: AdminCustomerOrderItemDto[];
};

export type AdminCustomerReservationDto = {
  id: number;
  branchName: string;
  date: string;
  timeSlot: string;
  guestCount: number;
  status: string;
  createdAt: string;
  specialRequests: string | null;
};

export type AdminCustomerDetailDto = {
  customer: AdminCustomerDto;
  orders: AdminCustomerOrderDto[];
  reservations: AdminCustomerReservationDto[];
};

export type CustomerPageDto = {
  items: AdminCustomerDto[];
  total: number;
};

export type CustomerFilters = {
  page: number;
  pageSize: number;
  q?: string;
};

export function useAdminCustomers(filters: CustomerFilters) {
  const qs = new URLSearchParams();
  qs.set("page",     String(filters.page));
  qs.set("pageSize", String(filters.pageSize));
  if (filters.q) qs.set("q", filters.q);

  return useQuery({
    queryKey: ["admin-customers", filters],
    queryFn:  () => apiFetch<CustomerPageDto>(`/api/admin/customers?${qs}`),
  });
}

export function useAdminCustomerDetail(id: number | null) {
  return useQuery({
    queryKey: ["admin-customer", id],
    queryFn:  () => apiFetch<AdminCustomerDetailDto>(`/api/admin/customers/${id}`),
    enabled:  id !== null,
  });
}
