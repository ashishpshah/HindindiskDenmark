import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type CustomerAddress = {
  id: number;
  type: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
};

export type CustomerLookupResult = {
  id: number;
  firstname: string;
  lastname: string;
  email?: string;
  phone: string;
  addresses: CustomerAddress[];
};

function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export function useCustomerLookup(phone: string) {
  const debouncedPhone = useDebounce(phone.trim(), 600);
  const digitCount = debouncedPhone.replace(/\D/g, "").length;

  return useQuery<CustomerLookupResult | null>({
    queryKey: ["customer-lookup", debouncedPhone],
    queryFn: async () => {
      try {
        return await apiFetch<CustomerLookupResult>(
          `/api/customers/lookup?phone=${encodeURIComponent(debouncedPhone)}`
        );
      } catch {
        return null; // 404 or network error → no match
      }
    },
    enabled: digitCount >= 8,
    staleTime: 30_000,
    retry: false,
  });
}
