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

export type AdminCustomerOrderDto = {
  id: number;
  branchName: string;
  orderType: string;
  total: number;
  status: string;
  createdAt: string;
  itemCount: number;
};

export type AdminCustomerDetailDto = {
  customer: AdminCustomerDto;
  orders: AdminCustomerOrderDto[];
};

export function useAdminCustomers(q?: string) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : "";
  return useQuery({
    queryKey: ["admin-customers", q],
    queryFn:  () => apiFetch<AdminCustomerDto[]>(`/api/admin/customers${qs}`),
  });
}

export function useAdminCustomerDetail(id: number | null) {
  return useQuery({
    queryKey: ["admin-customer", id],
    queryFn:  () => apiFetch<AdminCustomerDetailDto>(`/api/admin/customers/${id}`),
    enabled:  id !== null,
  });
}
