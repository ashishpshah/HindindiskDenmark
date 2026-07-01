import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { lsGet, lsSet, lsRemove } from "@/lib/storage";

type BranchApiDto = {
  name: string;
  deliveryFeeEnabled: boolean;
  deliveryFee: number;
  isCloseOrder: boolean;
  isCloseReservation: boolean;
};

// Full metadata stored per entry — no mock.ts lookup needed at render time
type CartEntry = {
  id: number;
  qty: number;
  price: number;
  imageUrl: string;
  nameDa?: string | null;
};

export type CartItemInput = {
  id: number;
  name: string;
  nameDa?: string | null;
  price: number;
  imageUrl: string;
};

export type CartLine = {
  id: number;
  name: string;
  nameDa?: string | null;
  qty: number;
  price: number;
  image: string;
};

type Ctx = {
  cart: Record<string, CartEntry>;
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
  add: (item: CartItemInput, count?: number) => void;
  sub: (name: string) => void;
  remove: (name: string) => void;
  clear: () => void;
  open: boolean;
  setOpen: (o: boolean) => void;
  branch: string;
  setBranch: (b: string) => void;
  orderType: "pickup" | "delivery";
  setOrderType: (t: "pickup" | "delivery") => void;
  branchPricing: BranchPricingConfig;
  setBranchPricing: (c: BranchPricingConfig) => void;
  isCloseOrder: boolean;
  isCloseReservation: boolean;
};

const CartContext = createContext<Ctx | null>(null);

export type BranchPricingConfig = {
  deliveryFeeEnabled: boolean;
  deliveryFee: number;
};

const DEFAULT_PRICING: BranchPricingConfig = {
  deliveryFeeEnabled: true, deliveryFee: 39,
};

const COUPONS: Record<string, { type: "percent" | "freeDelivery"; value: number }> = {
  WELCOME10: { type: "percent", value: 10 },
  FAMILY20: { type: "percent", value: 20 },
  FREEDELIVERY: { type: "freeDelivery", value: 0 },
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Record<string, CartEntry>>({});
  const [open, setOpen] = useState(false);
  const [coupon, setCoupon] = useState<string | null>(null);
  const [branch, setBranch] = useState("");
  const [orderType, setOrderType] = useState<"pickup" | "delivery">("pickup");
  const [branchPricing, setBranchPricing] = useState<BranchPricingConfig>(DEFAULT_PRICING);

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: () => apiFetch<BranchApiDto[]>("/api/locations"),
    staleTime: 1000 * 60 * 60,
  });

  const selectedBranch = branches.find(x => x.name === branch);

  // Keep pricing in sync with the selected branch so cart drawer always shows correct values
  useEffect(() => {
    if (!selectedBranch) return;
    setBranchPricing({
      deliveryFeeEnabled: selectedBranch.deliveryFeeEnabled,
      deliveryFee:        selectedBranch.deliveryFee,
    });
  }, [branch, branches]);

  useEffect(() => {
    const saved = lsGet<Record<string, CartEntry | number>>("hind-cart", {});
    // Migrate from old Record<string, number> format — skip numeric entries
    const migrated: Record<string, CartEntry> = {};
    for (const [name, v] of Object.entries(saved)) {
      if (typeof v === "object" && v !== null && "id" in v) {
        migrated[name] = v as CartEntry;
      }
    }
    if (Object.keys(migrated).length > 0) setCart(migrated);
    const savedCoupon = lsGet<string | null>("hind-coupon", null);
    if (savedCoupon) setCoupon(savedCoupon);
    const savedBranch = lsGet<string | null>("hind-branch", null);
    if (savedBranch) setBranch(savedBranch);
  }, []);

  useEffect(() => { lsSet("hind-cart", cart); }, [cart]);
  useEffect(() => { lsSet("hind-branch", branch); }, [branch]);

  const add = useCallback((item: CartItemInput, count: number = 1) =>
    setCart((c) => ({
      ...c,
      [item.name]: {
        id:       item.id,
        qty:      (c[item.name]?.qty ?? 0) + count,
        price:    item.price,
        imageUrl: item.imageUrl,
        nameDa:   item.nameDa,
      },
    })), []);

  const sub = useCallback((name: string) => setCart((c) => {
    const n = (c[name]?.qty ?? 0) - 1; const next = { ...c };
    if (n <= 0) delete next[name]; else next[name] = { ...c[name], qty: n };
    return next;
  }), []);
  const remove = useCallback((name: string) => setCart((c) => { const n = { ...c }; delete n[name]; return n; }), []);
  const clear = useCallback(() => { setCart({}); setCoupon(null); lsRemove("hind-coupon"); }, []);

  // Accepts any code — caller is responsible for pre-validating against the API.
  // Local COUPONS map drives the preview discount; API codes show 0 discount until order is placed.
  const applyCoupon = useCallback((code: string) => {
    const up = code.trim().toUpperCase();
    if (!up) return false;
    setCoupon(up);
    lsSet("hind-coupon", up);
    return true;
  }, []);
  const removeCoupon = useCallback(() => { setCoupon(null); lsRemove("hind-coupon"); }, []);

  const { lines, subtotal, totalQty, discount, delivery, tax, total } = useMemo(() => {
    const lines: CartLine[] = Object.entries(cart).map(([name, entry]) => ({
      id:     entry.id,
      name,
      nameDa: entry.nameDa,
      qty:    entry.qty,
      price:  entry.price,
      image:  entry.imageUrl,
    }));
    const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
    const totalQty = lines.reduce((a, l) => a + l.qty, 0);

    const baseDelivery = branch && orderType === "delivery" && subtotal > 0 && branchPricing.deliveryFeeEnabled
      ? branchPricing.deliveryFee : 0;
    let discount = 0;
    let delivery = baseDelivery;
    if (coupon && COUPONS[coupon]) {
      const c = COUPONS[coupon];
      if (c.type === "percent") discount = Math.round((subtotal * c.value) / 100);
      if (c.type === "freeDelivery") delivery = 0;
    }
    const taxed = Math.max(subtotal - discount, 0);
    const tax   = 0;
    const total = taxed + delivery;

    return { lines, subtotal, totalQty, discount, delivery, tax, total };
  }, [cart, branch, orderType, coupon, branchPricing]);

  return (
    <CartContext.Provider value={{
      cart, lines, subtotal, tax, delivery, discount, total, totalQty,
      coupon, applyCoupon, removeCoupon,
      add, sub, remove, clear, open, setOpen,
      branch, setBranch, orderType, setOrderType,
      branchPricing, setBranchPricing,
      isCloseOrder:       selectedBranch?.isCloseOrder ?? false,
      isCloseReservation: selectedBranch?.isCloseReservation ?? false,
    }}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
