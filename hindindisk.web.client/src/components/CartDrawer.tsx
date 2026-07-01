import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { OrderSummary } from "@/components/OrderSummary";
import { useCart } from "@/context/CartContext";
import { useI18n } from "@/i18n/I18nProvider";
import { MenuItemPhoto } from "@/components/MenuItemPhoto";

export function CartDrawer() {
  const { open, setOpen, lines, add, sub, remove, subtotal, delivery, discount, total, isCloseOrder, branch } = useCart();
  const { t } = useI18n();

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
              <button onClick={() => setOpen(false)} aria-label="Close cart" className="rounded-full p-2 hover:bg-accent"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {lines.length === 0 && (
                <div className="py-24 text-center space-y-6 flex flex-col items-center justify-center">
                  <ShoppingBag className="h-16 w-16 text-muted-foreground/30 stroke-[1.5]" />
                  <div className="text-muted-foreground font-medium">{t("cart.empty")}</div>
                  <Button asChild onClick={() => setOpen(false)} className="rounded-full gradient-primary text-primary-foreground shadow-soft cursor-pointer px-6">
                    <Link to="/menu">{t("cart.browseMenu")}</Link>
                  </Button>
                </div>
              )}
              {lines.map((l) => (
                <div key={l.name} className="flex gap-3 rounded-2xl border bg-background p-3">
                  <MenuItemPhoto src={l.image} alt={l.name} className="h-16 w-16 rounded-xl object-cover shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold">{l.name}</div>
                    <div className="text-sm text-muted-foreground">{l.price} DKK</div>
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full border px-1 py-0.5 text-sm">
                      <button onClick={() => sub(l.name)} aria-label={`Decrease quantity of ${l.name}`} className="grid h-6 w-6 place-items-center rounded-full hover:bg-accent"><Minus className="h-3 w-3" /></button>
                      <span className="min-w-4 text-center">{l.qty}</span>
                      <button onClick={() => add({ id: l.id, name: l.name, price: l.price, imageUrl: l.image })} aria-label={`Increase quantity of ${l.name}`} className="grid h-6 w-6 place-items-center rounded-full gradient-primary text-primary-foreground"><Plus className="h-3 w-3" /></button>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{l.price * l.qty} DKK</div>
                    <button onClick={() => remove(l.name)} aria-label={`Remove ${l.name} from cart`} className="mt-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
            {lines.length > 0 && (
              <div className="space-y-3 border-t bg-muted/30 p-5">
                <OrderSummary subtotal={subtotal} discount={discount} delivery={delivery} total={total} />
                {isCloseOrder && branch ? (
                  <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-4 text-center space-y-1">
                    <p className="text-sm font-semibold text-orange-700">Orders temporarily suspended</p>
                    <p className="text-xs text-orange-600">{branch} is not accepting online orders at the moment.</p>
                  </div>
                ) : (
                  <Button asChild size="lg" className="w-full gradient-primary text-primary-foreground" onClick={() => setOpen(false)}>
                    <Link to="/checkout">{t("actions.checkout")}</Link>
                  </Button>
                )}
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

