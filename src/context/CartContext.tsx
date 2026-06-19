import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { menuItems } from "@/data/mock";

export type CartLine = {
  name: string;
  qty: number;
  price: number;
  image: string;
};

type Ctx = {
  cart: Record<string, number>;
  lines: CartLine[];
  subtotal: number;
  tax: number;
  delivery: number;
  discount: number;
  total: number;
  totalQty: number;
  coupon: string | null;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  add: (name: string, count?: number) => void;
  sub: (name: string) => void;
  remove: (name: string) => void;
  clear: () => void;
  open: boolean;
  setOpen: (o: boolean) => void;
  branch: string;
  setBranch: (b: string) => void;
  orderType: "pickup" | "delivery";
  setOrderType: (t: "pickup" | "delivery") => void;
};

const CartContext = createContext<Ctx | null>(null);

const COUPONS: Record<string, { type: "percent" | "freeDelivery"; value: number }> = {
  WELCOME10: { type: "percent", value: 10 },
  FAMILY20: { type: "percent", value: 20 },
  FREEDELIVERY: { type: "freeDelivery", value: 0 },
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [coupon, setCoupon] = useState<string | null>(null);
  const [branch, setBranch] = useState("Hind Indisk Aarhus");
  const [orderType, setOrderType] = useState<"pickup" | "delivery">("delivery");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("hind-cart");
      if (raw) setCart(JSON.parse(raw));
      const c = localStorage.getItem("hind-coupon");
      if (c) setCoupon(c);
      const b = localStorage.getItem("hind-branch");
      if (b) setBranch(b);
    } catch {}
  }, []);

  useEffect(() => { try { localStorage.setItem("hind-cart", JSON.stringify(cart)); } catch {} }, [cart]);
  useEffect(() => { try { localStorage.setItem("hind-branch", branch); } catch {} }, [branch]);

  const add = useCallback((name: string, count: number = 1) => setCart((c) => ({ ...c, [name]: (c[name] || 0) + count })), []);
  const sub = useCallback((name: string) => setCart((c) => {
    const n = (c[name] || 0) - 1; const next = { ...c };
    if (n <= 0) delete next[name]; else next[name] = n;
    return next;
  }), []);
  const remove = useCallback((name: string) => setCart((c) => { const n = { ...c }; delete n[name]; return n; }), []);
  const clear = useCallback(() => { setCart({}); setCoupon(null); try { localStorage.removeItem("hind-coupon"); } catch {} }, []);

  const applyCoupon = useCallback((code: string) => {
    const up = code.trim().toUpperCase();
    if (COUPONS[up]) {
      setCoupon(up);
      try { localStorage.setItem("hind-coupon", up); } catch {}
      return true;
    }
    return false;
  }, []);
  const removeCoupon = useCallback(() => { setCoupon(null); try { localStorage.removeItem("hind-coupon"); } catch {} }, []);

  const { lines, subtotal, totalQty } = useMemo(() => {
    const lines: CartLine[] = Object.entries(cart).map(([name, qty]) => {
      const it = menuItems.find((m) => m.name === name);
      if (!it) return { name, qty, price: 0, image: "" };
      return { name, qty, price: parseInt(it.price), image: it.image };
    });
    const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
    const totalQty = lines.reduce((a, l) => a + l.qty, 0);
    return { lines, subtotal, totalQty };
  }, [cart]);

  const baseDelivery = orderType === "delivery" && subtotal > 0 ? 39 : 0;
  let discount = 0;
  let delivery = baseDelivery;
  if (coupon && COUPONS[coupon]) {
    const c = COUPONS[coupon];
    if (c.type === "percent") discount = Math.round((subtotal * c.value) / 100);
    if (c.type === "freeDelivery") delivery = 0;
  }
  const taxed = Math.max(subtotal - discount, 0);
  const tax = Math.round(taxed * 0.25);
  const total = taxed + tax + delivery;

  return (
    <CartContext.Provider value={{
      cart, lines, subtotal, tax, delivery, discount, total, totalQty,
      coupon, applyCoupon, removeCoupon,
      add, sub, remove, clear, open, setOpen,
      branch, setBranch, orderType, setOrderType,
    }}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}