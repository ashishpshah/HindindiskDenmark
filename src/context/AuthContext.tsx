import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

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
    try {
      const raw = localStorage.getItem("hind-user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = (u: User | null) => {
    setUser(u);
    try { if (u) localStorage.setItem("hind-user", JSON.stringify(u)); else localStorage.removeItem("hind-user"); } catch {}
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
      try { if (next) localStorage.setItem("hind-user", JSON.stringify(next)); } catch {}
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