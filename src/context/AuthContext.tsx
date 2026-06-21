import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { lsGet, lsSet, lsRemove } from "@/lib/storage";
import { apiFetch } from "@/lib/api/client";

export type User = {
  id: number;
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
  register: (data: { name: string; email: string; phone: string; password: string }) => Promise<void>;
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

  const persist = (u: User | null) => {
    setUser(u);
    if (u) lsSet("hind-user", u); else lsRemove("hind-user");
  };

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    lsSet("hind-token", res.token);
    persist({
      id:    res.user.id,
      name:  `${res.user.firstname} ${res.user.lastname}`.trim(),
      email: res.user.email,
      phone: res.user.phone || undefined,
      role:  res.user.role,
    });
  }, []);

  const register = useCallback(async (data: { name: string; email: string; phone: string; password: string }) => {
    const parts = data.name.trim().split(/\s+/);
    const firstname = parts[0];
    const lastname  = parts.slice(1).join(" ") || parts[0];
    const res = await apiFetch<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ firstname, lastname, email: data.email, password: data.password, phone: data.phone }),
    });
    lsSet("hind-token", res.token);
    persist({
      id:    res.user.id,
      name:  `${res.user.firstname} ${res.user.lastname}`.trim(),
      email: res.user.email,
      phone: res.user.phone || undefined,
      role:  res.user.role,
    });
  }, []);

  const logout = useCallback(() => { persist(null); lsRemove("hind-token"); }, []);

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
