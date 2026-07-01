import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

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
  name: string;
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
};

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateOrderRequest) =>
      apiFetch<OrderDto>("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-orders"] });
    },
  });
}
