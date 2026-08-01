import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";

export type CreateOrderRequest = {
  branchId: number;
  orderType: "Pickup" | "Delivery";
  couponCode?: string;
  items: { menuItemId: number; quantity: number }[];
  firstname: string;
  lastname: string;
  phone: string;
  email?: string;
  deliveryAddress?: string;
  scheduledTime?: string;
  scheduledDate?: string;
  specialInstructions?: string;
};

export type OrderItemDto = {
  menuItemId: number;
  code?: number;
  name: string;
  nameDa?: string;
  imageUrl: string;
  quantity: number;
  priceAtPurchase: number;
};

export type OrderDto = {
  id: number;
  orderType: string;
  branchName: string;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
  status: string;
  statusColor?: string;
  statusNameDa?: string;
  createdAt: string;
  items: OrderItemDto[];
  couponCode?: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  deliveryAddress?: string;
  paymentMethod: string;
  scheduledDate?: string;
  scheduledTime?: string;
  specialInstructions?: string;
  cancellationReason?: string;
  userId: number;
  ownerName?: string | null;
};

export function useCreateOrder() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (req: CreateOrderRequest) =>
      apiFetch<OrderDto>(user ? "/api/orders" : "/api/orders/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-orders"] });
    },
  });
}
