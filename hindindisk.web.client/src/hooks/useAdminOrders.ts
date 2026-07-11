import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type AdminOrderItemDto = {
  name: string;
  quantity: number;
  priceAtPurchase: number;
};

export type OrderStatusHistoryDto = {
  status: string;
  changedAt: string;
};

export type AdminOrderDto = {
  id: number;
  customerName: string;
  customerEmail: string;
  orderType: string;
  branchName: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  tax: number;
  total: number;
  status: string;
  createdAt: string;
  itemCount: number;
  couponCode?: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  deliveryAddress?: string;
  paymentMethod: string;
  items: AdminOrderItemDto[];
  scheduledDate?: string;
  scheduledTime?: string;
  statusHistory: OrderStatusHistoryDto[];
  cancellationReason?: string;
};

export type OrderPageDto = {
  items: AdminOrderDto[];
  total: number;
};

export type OrderFilters = {
  page: number;
  pageSize: number;
  status?: string;
  branchId?: number;
  search?: string;
};

export function useAdminOrders(filters: OrderFilters) {
  const qs = new URLSearchParams();
  qs.set("page",     String(filters.page));
  qs.set("pageSize", String(filters.pageSize));
  if (filters.status)   qs.set("status",   filters.status);
  if (filters.branchId) qs.set("branchId", String(filters.branchId));
  if (filters.search)   qs.set("search",   filters.search);

  return useQuery({
    queryKey: ["admin-orders", filters],
    queryFn:  () => apiFetch<OrderPageDto>(`/api/admin/orders?${qs}`),
  });
}
