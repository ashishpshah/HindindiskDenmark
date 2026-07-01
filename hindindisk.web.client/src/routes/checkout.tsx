import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Truck, Store, MapPin, CheckCircle2, Loader2, Banknote, UserCheck } from "lucide-react";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/FormField";
import { formatDate } from "@/lib/dateFormat";
import { OrderSummary } from "@/components/OrderSummary";
import { AddressSelectDialog } from "@/components/AddressSelectDialog";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n/I18nProvider";
import { toast } from "sonner";
import { useBranches } from "@/hooks/useBranches";
import { useCreateOrder, type OrderDto } from "@/hooks/useCreateOrder";
import { useAvailableSlots } from "@/hooks/useAvailableSlots";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCustomerLookup, type CustomerAddress } from "@/hooks/useCustomerLookup";
import { todayInDenmark } from "@/lib/denmarkTime";
import type { BranchDto } from "@/hooks/useBranches";

function branchHours(branch: BranchDto | undefined): string | undefined {
  if (!branch) return undefined;
  const parts: string[] = [];
  if (branch.weekdayHours) parts.push(`Mon–Fri: ${branch.weekdayHours}`);
  if (branch.weekendHours) parts.push(`Sat–Sun: ${branch.weekendHours}`);
  return parts.length ? parts.join(" · ") : undefined;
}

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
  firstname:    string;
  lastname:     string;
  phone:        string;
  email:        string;
  addressLine1: string;
  addressLine2: string;
  city:         string;
  postalCode:   string;
  country:      string;
};

function CheckoutPage() {
  const { t, lang } = useI18n();
  const da  = lang === "da";
  const loc = (en: string, daVal?: string | null) => (da && daVal) ? daVal : en;
  const navigate  = useNavigate();
  const { user, openModal } = useAuth();
  const {
    cart, lines, subtotal, delivery, discount, total,
    branch, setBranch, orderType, setOrderType, coupon, clear, setBranchPricing,
  } = useCart();

  const [step, setStep]                     = useState(1);
  const [done, setDone]                     = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderDto | null>(null);
  const [details, setDetails]               = useState<Details>({
    firstname: user?.firstname ?? "",
    lastname:  user?.lastname  ?? "",
    phone:     user?.phone     ?? "",
    email:     user?.email     ?? "",
    addressLine1: "", addressLine2: "", city: "", postalCode: "", country: "Denmark",
  });

  useEffect(() => {
    if (!user) return;
    setDetails(prev => ({
      ...prev,
      firstname: prev.firstname || user.firstname,
      lastname:  prev.lastname  || user.lastname,
      phone:     prev.phone     || user.phone || "",
      email:     prev.email     || user.email,
    }));
  }, [user]);

  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [savedAddresses, setSavedAddresses]         = useState<CustomerAddress[]>([]);

  const { data: branchesData = [] } = useBranches();
  const currentBranch               = branchesData.find((b) => b.name === branch);
  const createOrder                 = useCreateOrder();

  const today = todayInDenmark();
  const [scheduledDate, setScheduledDate] = useState(today);

  const maxDate = useMemo(() => {
    if (!currentBranch) return today;
    const d = new Date(today);
    d.setDate(d.getDate() + currentBranch.maxAdvanceDays);
    return d.toISOString().slice(0, 10);
  }, [currentBranch, today]);

  const { isOpen: branchOpen, slots: orderSlots, isLoading: slotsLoading } =
    useAvailableSlots(currentBranch?.id, scheduledDate, orderType === "delivery" ? "delivery" : "pickup");

  useEffect(() => {
    if (!currentBranch) return;
    setBranchPricing({
      deliveryFeeEnabled: currentBranch.deliveryFeeEnabled,
      deliveryFee:        currentBranch.deliveryFee,
    });
  }, [currentBranch, setBranchPricing]);

  useEffect(() => {
    if (!currentBranch) return;
    if (currentBranch.pickupEnabled) setOrderType("pickup");
    else if (currentBranch.deliveryEnabled) setOrderType("delivery");
  }, [currentBranch, setOrderType]);

  const [scheduledTime, setScheduledTime] = useState("");
  useEffect(() => { setScheduledTime(orderSlots[0] ?? ""); }, [orderSlots]);

  const [specialInstructions, setSpecialInstructions] = useState("");

  // Reset time slot when date changes to avoid stale selection
  useEffect(() => { setScheduledTime(""); }, [scheduledDate]);

  const { data: customer, isFetching: lookingUp, matchedBy } = useCustomerLookup(details.phone, details.email);

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

  // 5 steps: Branch · Order Type + Address · Contact · Payment · Review
  const STEPS = [
    { id: 1, label: t("checkout.step1") },
    { id: 2, label: t("checkout.step2") },
    { id: 3, label: t("checkout.step3") },
    { id: 4, label: t("checkout.payment") },
    { id: 5, label: t("checkout.step6") },
  ];
  const currentIdx = STEPS.findIndex((s) => s.id === step);

  const next = () => {
    if (step === 1) {
      if (!branch) { toast.error("Please select a branch."); return; }
      if (currentBranch && !currentBranch.deliveryEnabled && !currentBranch.pickupEnabled) {
        toast.error("This branch is not accepting online orders."); return;
      }
      if (currentBranch?.isCloseOrder) {
        toast.error("Online orders are temporarily suspended for this branch."); return;
      }
    }
    if (step === 2) {
      const hours = branchHours(currentBranch);
      if (!branchOpen) { toast.error("This branch is closed on the selected date.", { description: hours ?? "Please choose a different date or branch." }); return; }
      if (orderSlots.length === 0) { toast.error("No time slots available on the selected date.", { description: hours ?? "Please try a different date." }); return; }
      if (!scheduledTime) { toast.error("Please select a preferred time slot."); return; }
    }
    if (step === 3) {
      if (details.phone.trim() && !/^\d{8,13}$/.test(details.phone.trim().replace(/[+ ]/g, ""))) {
        toast.error("Phone must be 8–13 digits. You may use + and spaces (e.g. +45 12 34 56 78)."); return;
      }
      if (!details.email.trim()) { toast.error("Please enter your email."); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim())) {
        toast.error("Please enter a valid email address."); return;
      }
      if (orderType === "delivery") {
        if (!details.addressLine1.trim()) { toast.error("Please enter your address.");     return; }
        if (!details.city.trim())         { toast.error("Please enter your city.");        return; }
        if (!details.postalCode.trim())   { toast.error("Please enter your postal code."); return; }
      }
    }
    const nextStep = STEPS[currentIdx + 1];
    if (!nextStep) return;
    if (currentIdx < STEPS.length - 1) setStep(nextStep.id);
  };

  const back = () => {
    if (currentIdx > 0) setStep(STEPS[currentIdx - 1].id);
  };

  const handleAddressSelect = (addr: CustomerAddress) => {
    setDetails(prev => ({
      ...prev,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 ?? "",
      city:         addr.city,
      postalCode:   addr.postalCode,
      country:      addr.country ?? "Denmark",
    }));
  };

  const place = async () => {
    if (!currentBranch) { toast.error("Please select a branch."); return; }

    const orderItems = Object.entries(cart).map(([, entry]) => ({
      menuItemId: entry.id,
      quantity:   entry.qty,
    }));

    const deliveryAddress = orderType === "delivery"
      ? [details.addressLine1, details.addressLine2, details.city, details.postalCode, details.country].filter(Boolean).join(", ")
      : "";

    try {
      const order = await createOrder.mutateAsync({
        branchId:       currentBranch.id,
        orderType:      orderType === "delivery" ? "Delivery" : "Pickup",
        couponCode:     coupon ?? undefined,
        items:          orderItems,
        firstname:      details.firstname.trim(),
        lastname:       details.lastname.trim(),
        phone:          details.phone.trim(),
        email:          details.email.trim(),
        deliveryAddress,
        scheduledTime:        scheduledTime || undefined,
        scheduledDate:        scheduledDate,
        specialInstructions:  specialInstructions.trim() || undefined,
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
        {/* Step indicator */}
        <div className="mb-8 flex flex-wrap items-center gap-2">
          {STEPS.map((s, i) => {
            const active    = step === s.id;
            const completed = currentIdx > i;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold
                  ${active ? "gradient-primary text-primary-foreground" : completed ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {completed ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-sm ${active ? "font-semibold" : "text-muted-foreground"}`}>{s.label}</span>
                {i < STEPS.length - 1 && <div className="hidden h-px w-8 bg-border sm:block" />}
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
                      {branchesData.map((b) => {
                        const bothDisabled = !b.deliveryEnabled && !b.pickupEnabled;
                        return (
                          <button
                            key={b.name}
                            onClick={() => !bothDisabled && setBranch(b.name)}
                            disabled={bothDisabled}
                            className={`rounded-2xl border p-5 text-left transition
                              ${branch === b.name ? "border-primary bg-primary/5 shadow-soft" : "hover:border-primary/40"}
                              ${bothDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <div className="flex items-center gap-2 font-semibold"><MapPin className="h-4 w-4 text-primary" />{b.name}</div>
                            <div className="mt-1 text-sm text-muted-foreground">{b.address}, {b.city}</div>
                            <div className="mt-1 text-xs text-muted-foreground">{b.weekdayHours}</div>
                            {bothDisabled && (
                              <div className="mt-2 text-xs text-destructive font-medium">{t("checkout.notAcceptingOrders")}</div>
                            )}
                            {!bothDisabled && b.isCloseOrder && (
                              <div className="mt-2 text-xs text-orange-600 font-medium">{t("checkout.ordersSuspended")}</div>
                            )}
                          </button>
                        );
                      })}
                    </div>


                  </div>
                )}

                {/* Step 2 — Order type + Address (delivery only) */}
                {step === 2 && (
                  <div className="space-y-6">
                    <h2 className="font-display text-2xl font-semibold">{t("checkout.step2")}</h2>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {/* Delivery tile — disabled if branch doesn't support it */}
                      <button
                        onClick={() => currentBranch?.deliveryEnabled && setOrderType("delivery")}
                        disabled={!currentBranch?.deliveryEnabled}
                        className={`rounded-2xl border p-6 text-left transition
                          ${orderType === "delivery" ? "border-primary bg-primary/5" : "hover:border-primary/40"}
                          ${!currentBranch?.deliveryEnabled ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        <Truck className={`h-6 w-6 ${currentBranch?.deliveryEnabled ? "text-primary" : "text-muted-foreground"}`} />
                        <div className="mt-2 font-semibold">{t("checkout.delivery")}</div>
                        <div className="text-sm text-muted-foreground">
                          {currentBranch?.deliveryEnabled
                            ? (currentBranch.deliveryFeeEnabled ? `+${currentBranch.deliveryFee} DKK` : t("checkout.free"))
                            : t("checkout.notAvailable")}
                        </div>
                      </button>

                      {/* Pickup tile — disabled if branch doesn't support it */}
                      <button
                        onClick={() => currentBranch?.pickupEnabled && setOrderType("pickup")}
                        disabled={!currentBranch?.pickupEnabled}
                        className={`rounded-2xl border p-6 text-left transition
                          ${orderType === "pickup" ? "border-primary bg-primary/5" : "hover:border-primary/40"}
                          ${!currentBranch?.pickupEnabled ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        <Store className={`h-6 w-6 ${currentBranch?.pickupEnabled ? "text-primary" : "text-muted-foreground"}`} />
                        <div className="mt-2 font-semibold">{t("checkout.pickup")}</div>
                        <div className="text-sm text-muted-foreground">
                          {currentBranch?.pickupEnabled ? t("checkout.free") : t("checkout.notAvailable")}
                        </div>
                      </button>
                    </div>

                    {/* Order date | Preferred time — side by side */}
                    <div className="border-t pt-4">
                      <div className="flex flex-wrap gap-6">

                        {/* Date picker — only when branch allows advance booking */}
                        {currentBranch && currentBranch.maxAdvanceDays > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">{t("forms.orderDateLabel")}</p>
                            <Input
                              type="date"
                              value={scheduledDate}
                              min={today}
                              max={maxDate}
                              onChange={e => setScheduledDate(e.target.value)}
                              className="h-9 w-44"
                            />
                            {scheduledDate !== today && (
                              <p className="text-xs text-primary font-medium">
                                {t("checkout.advanceOrder")} — {formatDate(scheduledDate + "T12:00:00")}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Preferred time */}
                        <div className="space-y-2">
                          <p className="text-sm font-medium">{t("forms.scheduledTimeLabel")}</p>
                          {slotsLoading ? (
                            <p className="text-sm text-muted-foreground">{t("forms.loadingSlots")}</p>
                          ) : !branchOpen ? (
                            <div className="space-y-0.5">
                              <p className="text-sm text-destructive">{t("forms.branchClosedDay")}</p>
                              {branchHours(currentBranch) && <p className="text-xs text-muted-foreground">{branchHours(currentBranch)}</p>}
                            </div>
                          ) : orderSlots.length > 0 ? (
                            <Select value={scheduledTime} onValueChange={setScheduledTime}>
                              <SelectTrigger className="w-44 rounded-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {orderSlots.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="space-y-0.5">
                              <p className="text-sm text-destructive">{t("forms.noSlotsAvailable")}</p>
                              {branchHours(currentBranch) && <p className="text-xs text-muted-foreground">{branchHours(currentBranch)}</p>}
                            </div>
                          )}
                        </div>

                      </div>
                    </div>

                    {/* Special instructions */}
                    <div className="border-t pt-4">
                      <FormField label={loc("Special instructions", "Særlige instrukser")}>
                        <Textarea
                          rows={3}
                          placeholder={loc("Allergies, preferences, notes for the kitchen…", "Allergier, præferencer, noter til køkkenet…")}
                          value={specialInstructions}
                          onChange={(e) => setSpecialInstructions(e.target.value)}
                          maxLength={500}
                        />
                      </FormField>
                    </div>

                  </div>
                )}

                {/* Step 3 — Contact details */}
                {step === 3 && (
                  <div className="space-y-4">
                    <h2 className="font-display text-2xl font-semibold">{t("checkout.step3")}</h2>

                    <div className="relative">
                      <FormField label={t("forms.phoneLabelOpt")}>
                        <Input
                          type="tel"
                          placeholder="+45 …"
                          value={details.phone}
                          onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                        />
                      </FormField>
                      {lookingUp && matchedBy !== "email" && (
                        <Loader2 className="absolute right-3 top-9 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      {customer && !lookingUp && matchedBy === "phone" && (
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-green-600">
                          <UserCheck className="h-3.5 w-3.5" />
                          Customer found — details filled in
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField label={t("forms.firstNameLabelOpt")}>
                        <Input
                          value={details.firstname}
                          onChange={(e) => setDetails({ ...details, firstname: e.target.value })}
                        />
                      </FormField>
                      <FormField label={t("forms.lastNameLabelOpt")}>
                        <Input
                          value={details.lastname}
                          onChange={(e) => setDetails({ ...details, lastname: e.target.value })}
                        />
                      </FormField>
                      <div className="sm:col-span-2">
                        <div className="relative">
                          <FormField label="Email *">
                            <Input type="email" required placeholder="you@email.dk"
                              value={details.email}
                              onChange={(e) => setDetails({ ...details, email: e.target.value })} />
                          </FormField>
                          {lookingUp && matchedBy !== "phone" && (
                            <Loader2 className="absolute right-3 top-9 h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                          {customer && !lookingUp && matchedBy === "email" && (
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-green-600">
                              <UserCheck className="h-3.5 w-3.5" />
                              Customer found — details filled in
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Delivery address — shown below contact fields when delivery is selected */}
                    <AnimatePresence>
                      {orderType === "delivery" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="rounded-2xl border bg-muted/30 p-5 space-y-4">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" /> {t("checkout.deliveryAddressTitle")}
                              </p>
                              {savedAddresses.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setAddressDialogOpen(true)}
                                  className="text-xs text-primary hover:underline"
                                >
                                  {t("checkout.useSavedAddress")}
                                </button>
                              )}
                            </div>

                            {savedAddresses.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {savedAddresses.map((addr) => {
                                  const label = [addr.addressLine1, addr.city, addr.postalCode].filter(Boolean).join(", ");
                                  const isActive = details.addressLine1 === addr.addressLine1;
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
                            )}

                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="sm:col-span-2">
                                <FormField label={t("forms.addressLine1Label")}>
                                  <Input required placeholder={t("forms.addressLine1Placeholder")}
                                    value={details.addressLine1}
                                    onChange={(e) => setDetails({ ...details, addressLine1: e.target.value })} />
                                </FormField>
                              </div>
                              <div className="sm:col-span-2">
                                <FormField label={t("forms.addressLine2Label")}>
                                  <Input placeholder={t("forms.addressLine2Placeholder")}
                                    value={details.addressLine2}
                                    onChange={(e) => setDetails({ ...details, addressLine2: e.target.value })} />
                                </FormField>
                              </div>
                              <FormField label={t("forms.cityLabel")}>
                                <Input required value={details.city}
                                  onChange={(e) => setDetails({ ...details, city: e.target.value })} />
                              </FormField>
                              <FormField label={t("forms.postalCodeLabel")}>
                                <Input required value={details.postalCode}
                                  onChange={(e) => setDetails({ ...details, postalCode: e.target.value })} />
                              </FormField>
                              <div className="sm:col-span-2">
                                <FormField label={t("forms.countryLabel")}>
                                  <Input value={details.country}
                                    onChange={(e) => setDetails({ ...details, country: e.target.value })} />
                                </FormField>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Step 4 — Payment */}
                {step === 4 && (
                  <div className="space-y-4">
                    <h2 className="font-display text-2xl font-semibold">{t("checkout.payment")}</h2>
                    <div className="flex items-start gap-4 rounded-2xl border-2 border-primary bg-primary/5 p-6">
                      <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl gradient-primary text-primary-foreground">
                        <Banknote className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold">
                          {orderType === "pickup" ? t("checkout.payAtStore") : t("checkout.cashOnDelivery")}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {orderType === "pickup" ? t("checkout.payAtStoreDesc") : t("checkout.cashOnDeliveryDesc")}
                        </p>
                      </div>
                    </div>
                    {/* <p className="text-xs text-muted-foreground">
                      Online payment options will be available soon. All prices include 25% Danish VAT (moms).
                    </p> */}
                  </div>
                )}

                {/* Step 5 — Review */}
                {step === 5 && (
                  <div className="space-y-4">
                    <h2 className="font-display text-2xl font-semibold">{t("checkout.step6")}</h2>
                    <ReviewRow label={t("common.branch")}               value={branch || "—"} />
                    <ReviewRow label={t("checkout.reviewType")}          value={orderType === "delivery" ? t("checkout.delivery") : t("checkout.pickup")} />
                    {scheduledTime && <ReviewRow label={t("forms.scheduledTimeLabel")} value={scheduledTime} />}
                    <ReviewRow label={t("checkout.reviewName")}          value={`${details.firstname} ${details.lastname}`.trim()} />
                    <ReviewRow label={t("profile.phone")}                value={details.phone} />
                    <ReviewRow label={t("profile.email")}                value={details.email} />
                    {orderType === "delivery" && (
                      <ReviewRow label={t("checkout.reviewAddress")} value={[details.addressLine1, details.addressLine2, details.city, details.postalCode, details.country].filter(Boolean).join(", ")} />
                    )}
                    <ReviewRow label={t("checkout.payment")} value={orderType === "pickup" ? t("checkout.payAtStore") : t("checkout.cashOnDelivery")} />
                    {coupon && <ReviewRow label={t("checkout.reviewCoupon")} value={coupon} />}
                  </div>
                )}

              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex items-center justify-between">
              <Button variant="ghost" onClick={back} disabled={currentIdx === 0}>
                <ChevronLeft className="mr-1 h-4 w-4" /> {t("actions.back")}
              </Button>
              {currentIdx < STEPS.length - 1 ? (
                <Button onClick={next} className="gradient-primary text-primary-foreground">
                  {t("actions.next")} <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={place} disabled={createOrder.isPending} className="gradient-primary text-primary-foreground min-w-[130px]">
                  {createOrder.isPending
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("checkout.placing")}</>
                    : t("actions.placeOrder")}
                </Button>
              )}
            </div>
          </div>

          <aside className="h-fit rounded-3xl border bg-card p-6 shadow-soft">
            <h3 className="mb-4 font-display text-xl font-semibold">{t("checkout.step6")}</h3>
            <div className="space-y-2">
              {lines.map((l) => (
                <div key={l.name} className="flex justify-between text-sm">
                  <span>{l.qty} × {loc(l.name, l.nameDa)}</span><span>{l.price * l.qty} DKK</span>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t pt-3">
              <OrderSummary subtotal={subtotal} discount={discount} delivery={delivery} total={total} />
            </div>
          </aside>
        </div>
      </section>

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
                {t("checkout.orderId")} <span className="font-mono font-semibold text-foreground">#{confirmedOrder.id}</span>
              </p>
              {confirmedOrder.contactEmail && (
                <p className="mt-1 text-sm text-muted-foreground">{t("checkout.confirmationSentTo")} {confirmedOrder.contactEmail}</p>
              )}
              {confirmedOrder.orderType === "Pickup" ? (
                <div className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700">
                  <Banknote className="h-4 w-4 shrink-0" />
                  {t("checkout.payAtStore")} — {t("checkout.payAtStoreDesc")}
                </div>
              ) : (
                <div className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary">
                  <Banknote className="h-4 w-4 shrink-0" />
                  {t("checkout.cashOnDelivery")} — {t("checkout.cashOnDeliveryDesc")}
                </div>
              )}
              {user ? (
                <div className="mt-6 flex justify-center gap-2">
                  <Button
                    onClick={() => navigate({ to: "/order-tracking", search: { id: String(confirmedOrder.id) } })}
                    className="gradient-primary text-primary-foreground">
                    {t("checkout.trackOrder")}
                  </Button>
                  <Button variant="outline" onClick={() => navigate({ to: "/" })}>{t("checkout.done")}</Button>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  <div className="rounded-xl bg-muted/60 px-4 py-3 text-sm text-left space-y-1">
                    <p className="font-semibold text-foreground">
                      {loc("Want to track your order?", "Vil du spore din ordre?")}
                    </p>
                    <p className="text-muted-foreground">
                      {loc("Log in or register with", "Log ind eller registrer dig med")}{" "}
                      <span className="font-medium text-foreground">{confirmedOrder.contactEmail}</span>{" "}
                      {loc("to track this order.", "for at spore denne ordre.")}
                    </p>
                  </div>
                  <div className="flex justify-center gap-2 flex-wrap">                    
                    <Button variant="ghost" onClick={() => navigate({ to: "/" })} className="gradient-primary text-primary-foreground">
                      {t("checkout.done")}
                    </Button>
                  </div>
                </div>
              )}
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
