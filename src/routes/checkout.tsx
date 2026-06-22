import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Truck, Store, MapPin, CheckCircle2, Loader2, Banknote, UserCheck } from "lucide-react";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/FormField";
import { OrderSummary } from "@/components/OrderSummary";
import { AddressSelectDialog } from "@/components/AddressSelectDialog";
import { useCart } from "@/context/CartContext";
import { useI18n } from "@/i18n/I18nProvider";
import { toast } from "sonner";
import { useBranches } from "@/hooks/useBranches";
import { useCreateOrder, type OrderDto } from "@/hooks/useCreateOrder";
import { useCustomerLookup, type CustomerAddress } from "@/hooks/useCustomerLookup";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Hind Indisk Restaurant" },
      { name: "description", content: "Complete your order from Hind Indisk in just a few steps." },
    ],
  }),
  component: CheckoutPage,
});

type Details = {
  firstname: string;
  lastname: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  postal: string;
};

function CheckoutPage() {
  const { t }     = useI18n();
  const navigate  = useNavigate();
  const {
    cart, lines, subtotal, tax, delivery, discount, total,
    branch, setBranch, orderType, setOrderType, coupon, clear,
  } = useCart();

  const [step, setStep]                     = useState(1);
  const [done, setDone]                     = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderDto | null>(null);
  const [details, setDetails]               = useState<Details>({
    firstname: "", lastname: "", phone: "", email: "",
    street: "", city: "", postal: "",
  });
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [savedAddresses, setSavedAddresses]         = useState<CustomerAddress[]>([]);

  const { data: branchesData = [] } = useBranches();
  const currentBranch               = branchesData.find((b) => b.name === branch);
  const createOrder                 = useCreateOrder();

  // Customer lookup — fires 600ms after phone stops changing
  const { data: customer, isFetching: lookingUp } = useCustomerLookup(details.phone);

  // Auto-fill fields when a matching customer is found
  useEffect(() => {
    if (!customer) { setSavedAddresses([]); return; }
    setSavedAddresses(customer.addresses);
    setDetails(prev => ({
      ...prev,
      firstname: prev.firstname || customer.firstname,
      lastname:  prev.lastname  || customer.lastname,
      email:     prev.email     || customer.email || "",
    }));
  }, [customer]);

  const ALL_STEPS = [
    { id: 1, label: t("checkout.step1") },
    { id: 2, label: t("checkout.step2") },
    { id: 3, label: t("checkout.step3") },
    { id: 4, label: t("checkout.step4") },
    { id: 5, label: "Payment" },
    { id: 6, label: t("checkout.step6") },
  ];
  const activeSteps = ALL_STEPS.filter((s) => !(s.id === 4 && orderType === "pickup"));
  const currentIdx  = activeSteps.findIndex((s) => s.id === step);

  const next = () => {
    if (step === 1) {
      if (!branch) { toast.error("Please select a branch."); return; }
    }
    if (step === 3) {
      if (!details.firstname.trim()) { toast.error("Please enter your first name.");   return; }
      if (!details.lastname.trim())  { toast.error("Please enter your last name.");    return; }
      if (!details.phone.trim())     { toast.error("Please enter your phone number."); return; }
    }
    if (step === 4) {
      if (!details.street.trim()) { toast.error("Please enter your street address."); return; }
      if (!details.city.trim())   { toast.error("Please enter your city.");           return; }
      if (!details.postal.trim()) { toast.error("Please enter your postal code.");    return; }
    }

    const nextStep = activeSteps[currentIdx + 1];
    if (!nextStep) return;

    // Open address selection dialog when entering delivery-address step and customer has saved addresses
    if (nextStep.id === 4 && orderType === "delivery" && savedAddresses.length > 0) {
      setAddressDialogOpen(true);
    }

    if (currentIdx < activeSteps.length - 1) setStep(nextStep.id);
  };

  const back = () => {
    if (currentIdx > 0) setStep(activeSteps[currentIdx - 1].id);
  };

  const handleAddressSelect = (addr: CustomerAddress) => {
    setDetails(prev => ({
      ...prev,
      street: [addr.addressLine1, addr.addressLine2].filter(Boolean).join(", "),
      city:   addr.city,
      postal: addr.postalCode,
    }));
  };

  const place = async () => {
    if (!currentBranch) { toast.error("Please select a branch."); return; }

    const orderItems = Object.entries(cart).map(([, entry]) => ({
      menuItemId: entry.id,
      quantity:   entry.qty,
    }));

    const deliveryAddress = orderType === "delivery"
      ? `${details.street}, ${details.postal} ${details.city}`.trim()
      : undefined;

    try {
      const order = await createOrder.mutateAsync({
        branchId:       currentBranch.id,
        orderType:      orderType === "delivery" ? "Delivery" : "Pickup",
        couponCode:     coupon ?? undefined,
        items:          orderItems,
        firstname:      details.firstname.trim(),
        lastname:       details.lastname.trim(),
        phone:          details.phone.trim(),
        email:          details.email.trim() || undefined,
        deliveryAddress,
      });
      setConfirmedOrder(order);
      setDone(true);
      clear();
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Failed to place order. Please try again.");
    }
  };

  if (lines.length === 0 && !done) {
    return (
      <Layout>
        <PageHero eyebrow={t("checkout.title")} title={t("checkout.title")} subtitle="Your cart is empty."
          image="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80" />
        <div className="mx-auto max-w-md px-6 py-16 text-center">
          <Button asChild className="gradient-primary text-primary-foreground"><Link to="/menu">Browse menu</Link></Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHero eyebrow={t("checkout.title")} title={t("checkout.title")}
        subtitle="A few quick details and you're done."
        image="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80" />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex flex-wrap items-center gap-2">
          {activeSteps.map((s, i) => {
            const active    = step === s.id;
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

                {/* Step 1 — Branch */}
                {step === 1 && (
                  <div className="space-y-4">
                    <h2 className="font-display text-2xl font-semibold">{t("checkout.step1")}</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {branchesData.map((b) => (
                        <button key={b.name} onClick={() => setBranch(b.name)}
                          className={`rounded-2xl border p-5 text-left transition ${branch === b.name ? "border-primary bg-primary/5 shadow-soft" : "hover:border-primary/40"}`}>
                          <div className="flex items-center gap-2 font-semibold"><MapPin className="h-4 w-4 text-primary" />{b.name}</div>
                          <div className="mt-1 text-sm text-muted-foreground">{b.address}, {b.city}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{b.weekdayHours}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2 — Order type */}
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

                {/* Step 3 — Contact details */}
                {step === 3 && (
                  <div className="space-y-4">
                    <h2 className="font-display text-2xl font-semibold">{t("checkout.step3")}</h2>

                    {/* Phone first — triggers customer lookup */}
                    <div className="relative">
                      <FormField label="Phone *">
                        <Input
                          required
                          type="tel"
                          placeholder="+45 …"
                          value={details.phone}
                          onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                        />
                      </FormField>
                      {lookingUp && (
                        <Loader2 className="absolute right-3 top-9 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      {customer && !lookingUp && (
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-green-600">
                          <UserCheck className="h-3.5 w-3.5" />
                          Customer found — details filled in
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField label="First name *">
                        <Input
                          required
                          value={details.firstname}
                          onChange={(e) => setDetails({ ...details, firstname: e.target.value })}
                        />
                      </FormField>
                      <FormField label="Last name *">
                        <Input
                          required
                          value={details.lastname}
                          onChange={(e) => setDetails({ ...details, lastname: e.target.value })}
                        />
                      </FormField>
                      <div className="sm:col-span-2">
                        <FormField label="Email (for confirmation)">
                          <Input
                            type="email"
                            value={details.email}
                            onChange={(e) => setDetails({ ...details, email: e.target.value })}
                            placeholder="optional"
                          />
                        </FormField>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4 — Delivery address */}
                {step === 4 && orderType === "delivery" && (
                  <div className="space-y-4">
                    <h2 className="font-display text-2xl font-semibold">{t("checkout.step4")}</h2>

                    {/* Saved address pills — quick re-select without re-opening dialog */}
                    {savedAddresses.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Saved addresses
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {savedAddresses.map((addr) => {
                            const label = `${addr.addressLine1}, ${addr.postalCode} ${addr.city}`;
                            const isActive = details.street.startsWith(addr.addressLine1);
                            return (
                              <button
                                key={addr.id}
                                type="button"
                                onClick={() => handleAddressSelect(addr)}
                                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition
                                  ${isActive ? "gradient-primary text-primary-foreground border-transparent" : "bg-muted text-muted-foreground hover:bg-accent"}`}
                              >
                                <MapPin className="inline-block h-3 w-3 mr-1" />
                                {label}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground">Or enter a new address below:</p>
                      </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <FormField label="Street *">
                          <Input required value={details.street} onChange={(e) => setDetails({ ...details, street: e.target.value })} />
                        </FormField>
                      </div>
                      <FormField label="City *">
                        <Input required value={details.city} onChange={(e) => setDetails({ ...details, city: e.target.value })} />
                      </FormField>
                      <FormField label="Postal code *">
                        <Input required value={details.postal} onChange={(e) => setDetails({ ...details, postal: e.target.value })} />
                      </FormField>
                    </div>
                  </div>
                )}

                {/* Step 5 — Payment */}
                {step === 5 && (
                  <div className="space-y-4">
                    <h2 className="font-display text-2xl font-semibold">Payment</h2>
                    <div className="flex items-start gap-4 rounded-2xl border-2 border-primary bg-primary/5 p-6">
                      <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl gradient-primary text-primary-foreground">
                        <Banknote className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold">Cash on Delivery</div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Pay with cash when your order arrives. Please have the exact amount ready.
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Online payment options will be available soon. All prices include 25% Danish VAT (moms).
                    </p>
                  </div>
                )}

                {/* Step 6 — Review */}
                {step === 6 && (
                  <div className="space-y-4">
                    <h2 className="font-display text-2xl font-semibold">{t("checkout.step6")}</h2>
                    <ReviewRow label="Branch"  value={branch || "—"} />
                    <ReviewRow label="Type"    value={orderType === "delivery" ? t("checkout.delivery") : t("checkout.pickup")} />
                    <ReviewRow label="Name"    value={`${details.firstname} ${details.lastname}`.trim()} />
                    <ReviewRow label="Phone"   value={details.phone} />
                    {details.email && <ReviewRow label="Email" value={details.email} />}
                    {orderType === "delivery" && <ReviewRow label="Address" value={`${details.street}, ${details.postal} ${details.city}`} />}
                    <ReviewRow label="Payment" value="Cash on Delivery" />
                    {coupon && <ReviewRow label="Coupon" value={coupon} />}
                  </div>
                )}

              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex items-center justify-between">
              <Button variant="ghost" onClick={back} disabled={currentIdx === 0}>
                <ChevronLeft className="mr-1 h-4 w-4" /> {t("actions.back")}
              </Button>
              {currentIdx < activeSteps.length - 1 ? (
                <Button onClick={next} className="gradient-primary text-primary-foreground">
                  {t("actions.next")} <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={place} disabled={createOrder.isPending} className="gradient-primary text-primary-foreground min-w-[130px]">
                  {createOrder.isPending
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Placing…</>
                    : t("actions.placeOrder")}
                </Button>
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

      {/* Address selection dialog — opens when entering delivery step with saved addresses */}
      <AddressSelectDialog
        open={addressDialogOpen}
        onOpenChange={setAddressDialogOpen}
        addresses={savedAddresses}
        onSelect={handleAddressSelect}
        onNew={() => {}}
      />

      <AnimatePresence>
        {done && confirmedOrder && (
          <>
            <motion.div className="fixed inset-0 z-[120] bg-black/60"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div
              className="fixed left-1/2 top-1/2 z-[121] w-[94%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-card p-8 text-center shadow-elegant"
              initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: "spring" }}
                className="mx-auto grid h-20 w-20 place-items-center rounded-full gradient-primary text-primary-foreground">
                <CheckCircle2 className="h-10 w-10" />
              </motion.div>
              <h3 className="mt-5 font-display text-2xl font-bold">{t("checkout.placed")}</h3>
              <p className="mt-2 text-muted-foreground">
                Order ID: <span className="font-mono font-semibold text-foreground">#{confirmedOrder.id}</span>
              </p>
              {confirmedOrder.contactEmail && (
                <p className="mt-1 text-sm text-muted-foreground">Confirmation sent to {confirmedOrder.contactEmail}</p>
              )}
              <div className="mt-6 flex justify-center gap-2">
                <Button
                  onClick={() => navigate({ to: "/order-tracking", search: { id: String(confirmedOrder.id) } })}
                  className="gradient-primary text-primary-foreground">
                  Track order
                </Button>
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
  return (
    <div className="flex justify-between border-b py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
