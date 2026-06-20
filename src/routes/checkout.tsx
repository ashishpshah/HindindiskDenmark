import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, CreditCard, Smartphone, Truck, Store, MapPin, CheckCircle2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/FormField";
import { OrderSummary } from "@/components/OrderSummary";
import { branches } from "@/data/mock";
import { useCart } from "@/context/CartContext";
import { useI18n } from "@/i18n/I18nProvider";
import { lsGet, lsSet } from "@/lib/storage";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Hind Indisk Restaurant" },
      { name: "description", content: "Complete your order from Hind Indisk in just a few steps." },
    ],
  }),
  component: CheckoutPage,
});

const PAYMENTS = [
  { id: "mobilepay", label: "MobilePay", icon: Smartphone },
  { id: "visa", label: "Visa", icon: CreditCard },
  { id: "mastercard", label: "Mastercard", icon: CreditCard },
  { id: "dankort", label: "Dankort", icon: CreditCard },
];

function CheckoutPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { lines, subtotal, tax, delivery, discount, total, branch, setBranch, orderType, setOrderType, clear } = useCart();
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [orderId] = useState(() => "HIN-" + Math.floor(100000 + Math.random() * 900000));
  const [details, setDetails] = useState({ name: "", phone: "", email: "", street: "", city: "", postal: "" });
  const [payment, setPayment] = useState("mobilepay");

  const ALL_STEPS = [
    { id: 1, label: t("checkout.step1") },
    { id: 2, label: t("checkout.step2") },
    { id: 3, label: t("checkout.step3") },
    { id: 4, label: t("checkout.step4") },
    { id: 5, label: t("checkout.step5") },
    { id: 6, label: t("checkout.step6") },
  ];
  const activeSteps = ALL_STEPS.filter((s) => !(s.id === 4 && orderType === "pickup"));
  const currentIdx = activeSteps.findIndex((s) => s.id === step);

  const next = () => {
    if (step === 3) {
      if (!details.name.trim()) { toast.error("Please enter your name."); return; }
      if (!details.phone.trim()) { toast.error("Please enter your phone number."); return; }
      if (!details.email.trim()) { toast.error("Please enter your email address."); return; }
    }
    if (step === 4) {
      if (!details.street.trim()) { toast.error("Please enter your street address."); return; }
      if (!details.city.trim()) { toast.error("Please enter your city."); return; }
      if (!details.postal.trim()) { toast.error("Please enter your postal code."); return; }
    }
    if (currentIdx < activeSteps.length - 1) setStep(activeSteps[currentIdx + 1].id);
  };
  const back = () => {
    if (currentIdx > 0) setStep(activeSteps[currentIdx - 1].id);
  };

  const place = () => {
    const orders = lsGet<object[]>("hind-orders", []);
    orders.unshift({ id: orderId, date: new Date().toISOString(), branch, type: orderType, total, lines, status: "Placed" });
    lsSet("hind-orders", orders);
    setDone(true);
    clear();
  };

  if (lines.length === 0 && !done) {
    return (
      <Layout>
        <PageHero eyebrow={t("checkout.title")} title={t("checkout.title")} subtitle="Your cart is empty." image="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80" />
        <div className="mx-auto max-w-md px-6 py-16 text-center">
          <Button asChild className="gradient-primary text-primary-foreground"><Link to="/menu">Browse menu</Link></Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHero eyebrow={t("checkout.title")} title={t("checkout.title")} subtitle="A few quick details and you're done."
        image="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80" />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex flex-wrap items-center gap-2">
          {activeSteps.map((s, i) => {
            const active = step === s.id;
            const completed = currentIdx > i;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${active ? "gradient-primary text-primary-foreground" : completed ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {completed ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-sm ${active ? "font-semibold" : "text-muted-foreground"}`}>{s.label}</span>
                {i < activeSteps.length - 1 && <div className="hidden h-px w-8 bg-border sm:block" />}
              </div>
            );
          })}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
          <div className="rounded-3xl border bg-card p-6 sm:p-8 shadow-soft">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                {step === 1 && (
                  <div className="space-y-4">
                    <h2 className="font-display text-2xl font-semibold">{t("checkout.step1")}</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {branches.map((b) => (
                        <button key={b.name} onClick={() => setBranch(b.name)} className={`rounded-2xl border p-5 text-left transition ${branch === b.name ? "border-primary bg-primary/5 shadow-soft" : "hover:border-primary/40"}`}>
                          <div className="flex items-center gap-2 font-semibold"><MapPin className="h-4 w-4 text-primary" />{b.name}</div>
                          <div className="mt-1 text-sm text-muted-foreground">{b.address}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{b.hours}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <div className="space-y-4">
                    <h2 className="font-display text-2xl font-semibold">{t("checkout.step2")}</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button onClick={() => setOrderType("delivery")} className={`rounded-2xl border p-6 text-left transition ${orderType === "delivery" ? "border-primary bg-primary/5" : "hover:border-primary/40"}`}>
                        <Truck className="h-6 w-6 text-primary" />
                        <div className="mt-2 font-semibold">{t("checkout.delivery")}</div>
                        <div className="text-sm text-muted-foreground">+39 DKK · ~45 min</div>
                      </button>
                      <button onClick={() => setOrderType("pickup")} className={`rounded-2xl border p-6 text-left transition ${orderType === "pickup" ? "border-primary bg-primary/5" : "hover:border-primary/40"}`}>
                        <Store className="h-6 w-6 text-primary" />
                        <div className="mt-2 font-semibold">{t("checkout.pickup")}</div>
                        <div className="text-sm text-muted-foreground">Free · ~20 min</div>
                      </button>
                    </div>
                  </div>
                )}
                {step === 3 && (
                  <div className="space-y-4">
                    <h2 className="font-display text-2xl font-semibold">{t("checkout.step3")}</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField label="Name"><Input required value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} /></FormField>
                      <FormField label="Phone"><Input required type="tel" value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} placeholder="+45 …" /></FormField>
                      <div className="sm:col-span-2"><FormField label="Email"><Input required type="email" value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} /></FormField></div>
                    </div>
                  </div>
                )}
                {step === 4 && orderType === "delivery" && (
                  <div className="space-y-4">
                    <h2 className="font-display text-2xl font-semibold">{t("checkout.step4")}</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2"><FormField label="Street"><Input required value={details.street} onChange={(e) => setDetails({ ...details, street: e.target.value })} /></FormField></div>
                      <FormField label="City"><Input required value={details.city} onChange={(e) => setDetails({ ...details, city: e.target.value })} /></FormField>
                      <FormField label="Postal code"><Input required value={details.postal} onChange={(e) => setDetails({ ...details, postal: e.target.value })} /></FormField>
                    </div>
                  </div>
                )}
                {step === 5 && (
                  <div className="space-y-4">
                    <h2 className="font-display text-2xl font-semibold">{t("checkout.step5")}</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {PAYMENTS.map((p) => {
                        const Icon = p.icon;
                        return (
                          <button key={p.id} onClick={() => setPayment(p.id)} className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${payment === p.id ? "border-primary bg-primary/5" : "hover:border-primary/40"}`}>
                            <Icon className="h-5 w-5 text-primary" />
                            <span className="font-medium">{p.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {step === 6 && (
                  <div className="space-y-4">
                    <h2 className="font-display text-2xl font-semibold">{t("checkout.step6")}</h2>
                    <ReviewRow label="Branch" value={branch} />
                    <ReviewRow label="Type" value={orderType === "delivery" ? t("checkout.delivery") : t("checkout.pickup")} />
                    <ReviewRow label="Contact" value={`${details.name} · ${details.phone}`} />
                    {orderType === "delivery" && <ReviewRow label="Address" value={`${details.street}, ${details.postal} ${details.city}`} />}
                    <ReviewRow label="Payment" value={PAYMENTS.find((p) => p.id === payment)?.label || ""} />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex items-center justify-between">
              <Button variant="ghost" onClick={back} disabled={currentIdx === 0}><ChevronLeft className="mr-1 h-4 w-4" /> {t("actions.back")}</Button>
              {currentIdx < activeSteps.length - 1 ? (
                <Button onClick={next} className="gradient-primary text-primary-foreground">{t("actions.next")} <ChevronRight className="ml-1 h-4 w-4" /></Button>
              ) : (
                <Button onClick={place} className="gradient-primary text-primary-foreground">{t("actions.placeOrder")}</Button>
              )}
            </div>
          </div>

          <aside className="h-fit rounded-3xl border bg-card p-6 shadow-soft">
            <h3 className="mb-4 font-display text-xl font-semibold">Order summary</h3>
            <div className="space-y-2">
              {lines.map((l) => (
                <div key={l.name} className="flex justify-between text-sm">
                  <span>{l.qty} × {l.name}</span><span>{l.price * l.qty} DKK</span>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t pt-3">
              <OrderSummary subtotal={subtotal} discount={discount} tax={tax} delivery={delivery} total={total} />
            </div>
          </aside>
        </div>
      </section>

      <AnimatePresence>
        {done && (
          <>
            <motion.div className="fixed inset-0 z-[120] bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div
              className="fixed left-1/2 top-1/2 z-[121] w-[94%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-card p-8 text-center shadow-elegant"
              initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: "spring" }}
                className="mx-auto grid h-20 w-20 place-items-center rounded-full gradient-primary text-primary-foreground"><CheckCircle2 className="h-10 w-10" /></motion.div>
              <h3 className="mt-5 font-display text-2xl font-bold">{t("checkout.placed")}</h3>
              <p className="mt-2 text-muted-foreground">Order ID: <span className="font-mono font-semibold text-foreground">{orderId}</span></p>
              <div className="mt-6 flex justify-center gap-2">
                <Button onClick={() => navigate({ to: "/order-tracking", search: { id: orderId } })} className="gradient-primary text-primary-foreground">Track order</Button>
                <Button variant="outline" onClick={() => navigate({ to: "/" })}>Done</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Layout>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between border-b py-2 text-sm"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>;
}
