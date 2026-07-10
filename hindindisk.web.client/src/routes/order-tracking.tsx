import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Check, ChefHat, Package, Bike, ClipboardList, ClipboardCheck, LogIn, Circle, XCircle } from "lucide-react";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/PageHero";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useOrder } from "@/hooks/useOrder";
import { useOrderStatuses } from "@/hooks/useOrderStatuses";
import { formatDateTime } from "@/lib/dateFormat";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/context/AuthContext";
import { OrderSummary } from "@/components/OrderSummary";
import { BASE } from "@/lib/api/client";
import type { OrderStatusDto } from "@/hooks/useAdminOrderStatuses";

function resolveUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BASE}${url}`;
}

const search = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/order-tracking")({
  validateSearch: (s) => search.parse(s),
  head: () => ({ meta: [{ title: "Track Order — Hind Indisk Restaurant" }] }),
  component: TrackPage,
});

// Option A: map icon by name pattern
function iconForStatus(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("new"))        return ClipboardList;
  if (lower.includes("preparing"))  return ChefHat;
  if (lower === "ready")            return Package;
  if (lower.includes("pick up"))    return Bike;
  if (lower.includes("delivered"))  return Check;
  if (lower.includes("cancelled"))  return XCircle;
  return Circle;
}

// Build tracking stages from statuses filtered by order type
function buildStages(statuses: OrderStatusDto[], orderType: string | undefined) {
  return statuses
    .filter(s => s.isActive && !s.isTerminal && (s.serviceType === "All" || s.serviceType === orderType))
    .concat(statuses.filter(s => s.isActive && s.isTerminal))
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(s => ({
      label: s.nameDa ?? s.name,
      icon: iconForStatus(s.name),
      name: s.name,
    }));
}

// Legacy localStorage order shape
type LegacyOrder = { id: string; date: string; branch: string; type: string; total: number; lines: { name: string; qty: number; price: number }[]; status: string };

function loadLegacyOrder(id: string): LegacyOrder | null {
  try {
    const orders = JSON.parse(localStorage.getItem("hind-orders") || "[]") as LegacyOrder[];
    return orders.find((o) => o.id === id) ?? null;
  } catch {
    return null;
  }
}

function TrackPage() {
  const { id }                    = Route.useSearch();
  const navigate                  = useNavigate();
  const { t }                     = useI18n();
  const { user, openModal }       = useAuth();
  const [stage, setStage]         = useState(0);
  const [code, setCode]           = useState(id || "");

  const { data: allStatuses = [] } = useOrderStatuses();

  const activeStatuses = useMemo(() =>
    allStatuses.filter(s => s.isActive).sort((a, b) => a.displayOrder - b.displayOrder),
    [allStatuses]
  );

  const isNumericId = id !== undefined && /^\d+$/.test(id);

  const { data: apiOrder, isLoading } = useOrder(id);
  const legacyOrder = !isNumericId && id ? loadLegacyOrder(id) : null;

  const resolvedStatus = apiOrder?.status ?? legacyOrder?.status ?? "New";

  // Build stages from order type
  const orderType = apiOrder?.orderType ?? legacyOrder?.type;
  const STAGES = useMemo(() => buildStages(activeStatuses, orderType), [activeStatuses, orderType]);

  useEffect(() => {
    if (!id) return;
    const idx = STAGES.findIndex(s => s.name === resolvedStatus);
    const initialStage = idx >= 0 ? idx : 0;
    setStage(initialStage);

    // Only run the demo animation for legacy (non-numeric) orders
    if (isNumericId) return;
    const remaining = STAGES.filter((_, i) => i > initialStage);
    const timers = remaining.map((_, idx) => setTimeout(() => setStage(idx + initialStage + 1 > STAGES.length - 1 ? STAGES.length - 1 : idx + initialStage + 1), (idx + 1) * 1500));
    return () => timers.forEach(clearTimeout);
  }, [id, resolvedStatus, isNumericId, STAGES]);

  if (!user) {
    return (
      <Layout>
        <PageHero eyebrow={t("pages.tracking.eyebrow")} title={t("pages.tracking.title")} subtitle={t("pages.tracking.subtitle")}
          image="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1920&q=80" />
        <section className="mx-auto max-w-sm px-6 py-16 text-center space-y-5">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
            <LogIn className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-xl font-semibold">Log in to track your order</h2>
            <p className="text-sm text-muted-foreground">
              Please log in or register with the same email you used when placing your order.
            </p>
          </div>
          <div className="flex justify-center gap-2">
            <Button onClick={() => openModal("login")} className="gradient-primary text-primary-foreground">
              Log in
            </Button>
            <Button variant="outline" onClick={() => openModal("register")}>
              Register
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/" })}>
            Back to home
          </Button>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHero eyebrow={t("pages.tracking.eyebrow")} title={t("pages.tracking.title")} subtitle={t("pages.tracking.subtitle")}
        image="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1920&q=80" />

      <section className="mx-auto max-w-5xl px-6 py-12">
        {!id ? (
          <form
            className="mx-auto max-w-md flex gap-2"
            onSubmit={(e) => { e.preventDefault(); if (code) navigate({ to: "/order-tracking", search: { id: code } }); }}
          >
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("pages.tracking.placeholder")} />
            <Button className="gradient-primary text-primary-foreground">{t("pages.tracking.trackBtn")}</Button>
          </form>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">

            {/* ── Col 1: Order Details + Summary ── */}
            {apiOrder && (
              <aside className="rounded-3xl border bg-card p-6 shadow-soft h-fit space-y-5">

                {/* Header */}
                <div>
                  <h3 className="font-display text-xl font-semibold">{t("pages.tracking.orderDetails")}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("pages.tracking.placedOn")} {formatDateTime(apiOrder.createdAt)}
                  </p>
                </div>

                {/* Order meta */}
                <div className="space-y-2.5 border-t pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("pages.tracking.location")}</span>
                    <span className="font-semibold text-right max-w-[200px]">{apiOrder.branchName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("pages.tracking.orderType")}</span>
                    <span className="font-semibold">{apiOrder.orderType === "Pickup" ? t("checkout.pickup") : t("checkout.delivery")}</span>
                  </div>
                  {apiOrder.scheduledDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("forms.orderDateLabel")}</span>
                      <span className="font-semibold">{String(apiOrder.scheduledDate)} {apiOrder.scheduledTime && `· ${apiOrder.scheduledTime}`}</span>
                    </div>
                  )}
                  {apiOrder.deliveryAddress && (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground shrink-0">{t("pages.tracking.deliveryTo")}</span>
                      <span className="font-semibold text-right">{apiOrder.deliveryAddress}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("pages.tracking.payment")}</span>
                    <span className="font-semibold">{apiOrder.orderType === "Pickup" ? t("checkout.payAtStore") : t("checkout.cashOnDelivery")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("pages.tracking.status")}</span>
                    <span className="font-semibold text-primary">{STAGES[stage]?.label ?? apiOrder.status}</span>
                  </div>
                  {apiOrder.specialInstructions && (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground shrink-0">Special instructions</span>
                      <span className="font-medium text-right">{apiOrder.specialInstructions}</span>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold text-sm">{t("pages.tracking.itemsOrdered")}</h4>
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {apiOrder.items.map((item) => (
                      <div key={item.menuItemId} className="flex items-center gap-3">
                        {item.imageUrl && (
                          <img
                            src={resolveUrl(item.imageUrl)}
                            alt={item.name}
                            className="h-11 w-11 rounded-xl object-cover shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.quantity} × {item.priceAtPurchase.toFixed(0)} DKK</p>
                        </div>
                        <span className="text-sm font-semibold shrink-0">{(item.priceAtPurchase * item.quantity).toFixed(0)} DKK</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals breakdown */}
                <div className="border-t pt-4">
                  <OrderSummary
                    subtotal={apiOrder.subtotal}
                    discount={apiOrder.discount}
                    delivery={apiOrder.deliveryFee}
                    total={apiOrder.total}
                  />
                  {apiOrder.couponCode && (
                    <p className="mt-1.5 text-xs text-primary font-medium">
                      Coupon applied: {apiOrder.couponCode}
                    </p>
                  )}
                </div>

              </aside>
            )}

            {legacyOrder && !apiOrder && (
              <aside className="rounded-3xl border bg-card p-6 shadow-soft h-fit space-y-6">
                <div>
                  <h3 className="font-display text-xl font-semibold">{t("pages.tracking.orderDetails")}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Placed on {formatDateTime(legacyOrder.date)}
                  </p>
                </div>
                <div className="space-y-3 border-t pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("pages.tracking.location")}</span>
                    <span className="font-semibold">{legacyOrder.branch}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("pages.tracking.orderType")}</span>
                    <span className="font-semibold capitalize">{legacyOrder.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("pages.tracking.status")}</span>
                    <span className="font-semibold text-primary">{STAGES[stage]?.label ?? legacyOrder.status}</span>
                  </div>
                </div>
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold text-sm">{t("pages.tracking.itemsOrdered")}</h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {legacyOrder.lines?.map((l) => (
                      <div key={l.name} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{l.qty} × {l.name}</span>
                        <span className="font-medium">{l.price * l.qty} DKK</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t pt-4 flex justify-between font-display text-lg font-bold">
                  <span>{t("pages.tracking.totalPaid")}</span>
                  <span className="text-primary">{legacyOrder.total} DKK</span>
                </div>
              </aside>
            )}

            {/* ── Col 2: Order Tracking stages ── */}
            <div className="rounded-3xl border bg-card p-6 sm:p-8 shadow-soft h-fit">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">{t("pages.tracking.orderId")}</div>
                  <div className="font-mono text-lg font-semibold">{isNumericId ? `#${id}` : id}</div>
                </div>
                <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                  {STAGES[stage]?.label ?? resolvedStatus}
                </div>
              </div>

              {isLoading && isNumericId && (
                <div className="text-center py-2 text-sm text-muted-foreground">{t("pages.tracking.loadingOrder")}</div>
              )}

              <div className="space-y-4">
                {STAGES.map((s, i) => {
                  const Icon   = s.icon;
                  const done   = i <= stage;
                  const active = i === stage;
                  return (
                    <div key={s.name} className="flex items-start gap-4">
                      <motion.div
                        animate={active ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                        transition={{ repeat: active ? Infinity : 0, duration: 1.5 }}
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${done ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                      >
                        <Icon className="h-5 w-5" />
                      </motion.div>
                      <div className="flex-1 pt-2">
                        <div className={`font-semibold ${done ? "" : "text-muted-foreground"}`}>{s.label}</div>
                        {i < STAGES.length - 1 && <div className={`my-2 ml-1 h-6 w-px ${i < stage ? "bg-primary" : "bg-border"}`} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </section>
    </Layout>
  );
}
