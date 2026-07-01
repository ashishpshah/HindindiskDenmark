import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { lsGet, lsSet, lsRemove } from "@/lib/storage";
import { apiFetch } from "@/lib/api/client";

export type AdminUser = {
  id: number;
  firstname: string;
  lastname: string;
  name: string;
  email: string;
  role: string;
};

type AuthResponse = {
  token: string;
  user: { id: number; firstname: string; lastname: string; email: string; phone: string; role: string };
};

type AdminCtx = {
  adminUser: AdminUser | null;
  adminLogin: (email: string, password: string) => Promise<void>;
  adminLogout: () => void;
};

const AdminAuthContext = createContext<AdminCtx | null>(null);

export function isAdminUser(user: AdminUser | null): boolean {
  return user?.role === "SystemAdmin" || user?.role === "Admin";
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    const saved = lsGet<AdminUser | null>("hind-admin-user", null);
    if (saved) setAdminUser(saved);
  }, []);

  const persist = useCallback((u: AdminUser | null) => {
    setAdminUser(u);
    if (u) {
      lsSet("hind-admin-user", u);
    } else {
      lsRemove("hind-admin-user");
      lsRemove("hind-admin-token");
    }
  }, []);

  // Clear admin session when user navigates to the client zone
  useEffect(() => {
    const handler = () => persist(null);
    window.addEventListener("hind:enter-client", handler);
    return () => window.removeEventListener("hind:enter-client", handler);
  }, [persist]);

  // Clear admin session on 401 from admin API calls
  useEffect(() => {
    const handler = () => persist(null);
    window.addEventListener("hind:admin-session-expired", handler);
    return () => window.removeEventListener("hind:admin-session-expired", handler);
  }, [persist]);

  const adminLogin = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    lsSet("hind-admin-token", res.token);
    persist({
      id:        res.user.id,
      firstname: res.user.firstname,
      lastname:  res.user.lastname,
      name:      `${res.user.firstname} ${res.user.lastname}`.trim(),
      email:     res.user.email,
      role:      res.user.role,
    });
  }, [persist]);

  const adminLogout = useCallback(() => persist(null), [persist]);

  return (
    <AdminAuthContext.Provider value={{ adminUser, adminLogin, adminLogout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const c = useContext(AdminAuthContext);
  if (!c) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return c;
}
