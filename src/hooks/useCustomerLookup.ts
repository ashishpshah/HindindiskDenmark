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

function isValidEmail(email: string) {
  return email.includes("@") && email.length >= 5;
}

type LookupResult = {
  data: CustomerLookupResult | null | undefined;
  isFetching: boolean;
  /** Which field triggered the match — useful for showing the indicator near the right input. */
  matchedBy: "phone" | "email" | null;
};

export function useCustomerLookup(phone: string, email?: string): LookupResult {
  const debouncedPhone = useDebounce(phone.trim(), 600);
  const debouncedEmail = useDebounce((email ?? "").trim(), 800);

  const phoneDigits   = debouncedPhone.replace(/\D/g, "").length;
  const phoneEnabled  = phoneDigits >= 8;
  const emailEnabled  = !phoneEnabled && isValidEmail(debouncedEmail);

  const phoneQuery = useQuery<CustomerLookupResult | null>({
    queryKey: ["customer-lookup-phone", debouncedPhone],
    queryFn: async () => {
      try {
        return await apiFetch<CustomerLookupResult>(
          `/api/customers/lookup?phone=${encodeURIComponent(debouncedPhone)}`
        );
      } catch {
        return null;
      }
    },
    enabled: phoneEnabled,
    staleTime: 30_000,
    retry: false,
  });

  const emailQuery = useQuery<CustomerLookupResult | null>({
    queryKey: ["customer-lookup-email", debouncedEmail],
    queryFn: async () => {
      try {
        return await apiFetch<CustomerLookupResult>(
          `/api/customers/lookup?email=${encodeURIComponent(debouncedEmail)}`
        );
      } catch {
        return null;
      }
    },
    enabled: emailEnabled,
    staleTime: 30_000,
    retry: false,
  });

  if (phoneEnabled) {
    return {
      data:       phoneQuery.data,
      isFetching: phoneQuery.isFetching,
      matchedBy:  phoneQuery.data ? "phone" : null,
    };
  }

  return {
    data:       emailQuery.data,
    isFetching: emailQuery.isFetching,
    matchedBy:  emailQuery.data ? "email" : null,
  };
}
