import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
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
} | AdminOrderDto[];

function normalizeOrderResponse(data: unknown): { items: AdminOrderDto[]; total: number } {
  if (Array.isArray(data)) {
    return { items: data, total: data.length };
  }
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.items)) {
      const items = obj.items as AdminOrderDto[];
      const total = typeof obj.total === "number" ? obj.total : items.length;
      return { items, total };
    }
  }
  return { items: [], total: 0 };
}

export type OrderFilters = {
  page: number;
  pageSize: number;
  status?: string;
  branchId?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  orderType?: string;
};

export function useAdminOrders(filters: OrderFilters) {
  const debouncedSearch = useDebouncedValue(filters.search ?? "", 300);

  const qs = new URLSearchParams();
  qs.set("page",     String(filters.page));
  qs.set("pageSize", String(filters.pageSize));
  if (filters.status)   qs.set("status",   filters.status);
  if (filters.branchId) qs.set("branchId", String(filters.branchId));
  if (debouncedSearch)  qs.set("search",   debouncedSearch);
  if (filters.dateFrom) qs.set("dateFrom", filters.dateFrom);
  if (filters.dateTo)   qs.set("dateTo",   filters.dateTo);
  if (filters.orderType) qs.set("orderType", filters.orderType);

  const queryKey = [
    "admin-orders",
    filters.page,
    filters.pageSize,
    filters.status,
    filters.branchId,
    debouncedSearch,
    filters.dateFrom,
    filters.dateTo,
    filters.orderType,
  ];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const raw = await apiFetch<unknown>(`/api/admin/orders?${qs}`);
      return normalizeOrderResponse(raw);
    },
    select: (data) => data,
  });
}
