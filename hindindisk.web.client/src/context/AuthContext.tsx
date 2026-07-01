import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { lsGet, lsSet, lsRemove } from "@/lib/storage";
import { apiFetch } from "@/lib/api/client";

export type User = {
  id: number;
  firstname: string;
  lastname: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
};

type ApiUserDto = {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  role: string;
};

type AuthResponse = { token: string; user: ApiUserDto };

export function isAdminUser(user: User | null): boolean {
  return user?.role === "SystemAdmin" || user?.role === "Admin";
}

type Ctx = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { firstname: string; lastname: string; email: string; phone?: string; password: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (u: Partial<User>) => void;
  modalOpen: boolean;
  openModal: (mode?: "login" | "register" | "forgot") => void;
  closeModal: () => void;
  modalMode: "login" | "register" | "forgot";
  setModalMode: (m: "login" | "register" | "forgot") => void;
};

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"login" | "register" | "forgot">("login");

  useEffect(() => {
    const saved = lsGet<User | null>("hind-user", null);
    if (saved) setUser(saved);
  }, []);

  const persist = useCallback((u: User | null) => {
    setUser(u);
    if (u) lsSet("hind-user", u); else lsRemove("hind-user");
  }, []);

  // Clear client session when user navigates to the admin zone
  useEffect(() => {
    const handler = () => persist(null);
    window.addEventListener("hind:enter-admin", handler);
    return () => window.removeEventListener("hind:enter-admin", handler);
  }, [persist]);

  // Auto-logout when JWT expires (fired by apiFetch on 401)
  useEffect(() => {
    const handler = () => {
      persist(null);
      setModalMode("login");
      setModalOpen(true);
    };
    window.addEventListener("hind:session-expired", handler);
    return () => window.removeEventListener("hind:session-expired", handler);
  }, [persist]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    lsSet("hind-token", res.token);
    persist({
      id:        res.user.id,
      firstname: res.user.firstname,
      lastname:  res.user.lastname,
      name:      `${res.user.firstname} ${res.user.lastname}`.trim(),
      email:     res.user.email,
      phone:     res.user.phone || undefined,
      role:      res.user.role,
    });
  }, [persist]);

  const register = useCallback(async (data: { firstname: string; lastname: string; email: string; phone?: string; password: string }) => {
    const res = await apiFetch<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        firstname: data.firstname.trim(),
        lastname:  data.lastname.trim(),
        email:     data.email,
        password:  data.password,
        phone:     data.phone?.trim() || undefined,
      }),
    });
    lsSet("hind-token", res.token);
    persist({
      id:        res.user.id,
      firstname: res.user.firstname,
      lastname:  res.user.lastname,
      name:      `${res.user.firstname} ${res.user.lastname}`.trim(),
      email:     res.user.email,
      phone:     res.user.phone || undefined,
      role:      res.user.role,
    });
  }, [persist]);

  const logout = useCallback(() => { persist(null); lsRemove("hind-token"); }, [persist]);

  const updateProfile = useCallback((u: Partial<User>) => {
    setUser((prev) => {
      const next = prev ? { ...prev, ...u } : null;
      if (next) lsSet("hind-user", next);
      return next;
    });
  }, []);

  const openModal = useCallback((mode: "login" | "register" | "forgot" = "login") => {
    setModalMode(mode);
    setModalOpen(true);
  }, []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, modalOpen, openModal, closeModal, modalMode, setModalMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
