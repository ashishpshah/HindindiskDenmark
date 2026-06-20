import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { lsGet, lsSet, lsRemove } from "@/lib/storage";

export type User = { name: string; email: string; phone?: string; address?: string };

type Ctx = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: User & { password: string }) => Promise<void>;
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

  const login = useCallback(async (email: string, _password: string) => {
    await new Promise((r) => setTimeout(r, 500));
    persist({ name: email.split("@")[0] || "Guest", email });
  }, []);

  const register = useCallback(async (data: User & { password: string }) => {
    await new Promise((r) => setTimeout(r, 500));
    const { password: _p, ...rest } = data;
    persist(rest);
  }, []);

  const logout = useCallback(() => persist(null), []);

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
