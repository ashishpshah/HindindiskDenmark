import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type AdminOrderItemDto = {
  name: string;
  quantity: number;
  priceAtPurchase: number;
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
};

export function useAdminOrders(params?: { status?: string; branchId?: number }) {
  const qs = new URLSearchParams();
  if (params?.status)   qs.set("status",   params.status);
  if (params?.branchId) qs.set("branchId", String(params.branchId));
  const query = qs.toString();

  return useQuery({
    queryKey: ["admin-orders", params?.status, params?.branchId],
    queryFn:  () => apiFetch<AdminOrderDto[]>(`/api/admin/orders${query ? `?${query}` : ""}`),
  });
}
