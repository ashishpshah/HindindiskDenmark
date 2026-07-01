import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type SlotResult = {
  isOpen: boolean;
  slots: string[];
};

async function fetchSlots(branchId: number, date: string, type: string): Promise<SlotResult> {
  return apiFetch<SlotResult>(
    `/api/locations/slots?branchId=${branchId}&date=${encodeURIComponent(date)}&type=${type}`
  );
}

export function useAvailableSlots(
  branchId: number | undefined,
  date: string,
  type: "reservation" | "order" | "delivery" | "pickup"
): SlotResult & { isLoading: boolean } {
  const { data, isLoading } = useQuery<SlotResult>({
    queryKey: ["slots", branchId, date, type],
    queryFn:  () => fetchSlots(branchId!, date, type),
    enabled:  !!branchId && !!date,
    staleTime: 0,
  });

  return {
    isOpen:    data?.isOpen    ?? false,
    slots:     data?.slots     ?? [],
    isLoading,
  };
}
