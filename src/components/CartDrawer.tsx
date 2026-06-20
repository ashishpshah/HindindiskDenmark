import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Trash2, Tag, ShoppingBag } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrderSummary } from "@/components/OrderSummary";
import { useCart } from "@/context/CartContext";
import { useI18n } from "@/i18n/I18nProvider";
import { toast } from "sonner";

export function CartDrawer() {
  const { open, setOpen, lines, add, sub, remove, subtotal, tax, delivery, discount, total, coupon, applyCoupon, removeCoupon } = useCart();
  const { t } = useI18n();
  const [code, setCode] = useState("");

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[90] bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
          <motion.aside
            className="fixed inset-y-0 right-0 z-[91] flex w-full max-w-md flex-col bg-card shadow-elegant"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.3 }}
          >
            <div className="flex items-center justify-between border-b p-5">
              <div className="flex items-center gap-2 font-display text-2xl font-semibold">
                <ShoppingBag className="h-5 w-5 text-primary" /> {t("cart.title")}
              </div>
              <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-accent"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {lines.length === 0 && (
                <div className="py-24 text-center space-y-6 flex flex-col items-center justify-center">
                  <ShoppingBag className="h-16 w-16 text-muted-foreground/30 stroke-[1.5]" />
                  <div className="text-muted-foreground font-medium">{t("cart.empty")}</div>
                  <Button asChild onClick={() => setOpen(false)} className="rounded-full gradient-primary text-primary-foreground shadow-soft cursor-pointer px-6">
                    <Link to="/menu">Browse Menu</Link>
                  </Button>
                </div>
              )}
              {lines.map((l) => (
                <div key={l.name} className="flex gap-3 rounded-2xl border bg-background p-3">
                  <img src={l.image} className="h-16 w-16 rounded-xl object-cover" alt={l.name} />
                  <div className="flex-1">
                    <div className="font-semibold">{l.name}</div>
                    <div className="text-sm text-muted-foreground">{l.price} DKK</div>
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full border px-1 py-0.5 text-sm">
                      <button onClick={() => sub(l.name)} className="grid h-6 w-6 place-items-center rounded-full hover:bg-accent"><Minus className="h-3 w-3" /></button>
                      <span className="min-w-4 text-center">{l.qty}</span>
                      <button onClick={() => add(l.name)} className="grid h-6 w-6 place-items-center rounded-full gradient-primary text-primary-foreground"><Plus className="h-3 w-3" /></button>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{l.price * l.qty} DKK</div>
                    <button onClick={() => remove(l.name)} className="mt-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
            {lines.length > 0 && (
              <div className="space-y-3 border-t bg-muted/30 p-5">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("cart.coupon")} className="pl-9" />
                  </div>
                  <Button variant="outline" onClick={() => {
                    if (!code) return;
                    if (applyCoupon(code)) { toast.success(`Coupon ${code.toUpperCase()} applied`); setCode(""); }
                    else toast.error("Invalid coupon");
                  }}>{t("actions.apply")}</Button>
                </div>
                {coupon && (
                  <div className="flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2 text-sm">
                    <span className="font-medium text-primary">{coupon} applied</span>
                    <button onClick={removeCoupon} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
                  </div>
                )}
                <OrderSummary subtotal={subtotal} discount={discount} tax={tax} delivery={delivery} total={total} />
                <Button asChild size="lg" className="w-full gradient-primary text-primary-foreground" onClick={() => setOpen(false)}>
                  <Link to="/checkout">{t("actions.checkout")}</Link>
                </Button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

