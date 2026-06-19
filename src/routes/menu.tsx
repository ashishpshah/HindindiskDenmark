import { createFileRoute, Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { Search, Plus, Minus, Leaf, Flame, ShoppingBag, MapPin, ChevronLeft } from "lucide-react";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { menuCategories, menuItems, branches } from "@/data/mock";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu — Hind Indisk Restaurant" },
      { name: "description", content: "Explore our authentic Indian menu — starters, mains, biryanis, breads, desserts and drinks." },
      { property: "og:title", content: "Hind Indisk Menu" },
      { property: "og:description", content: "Authentic Indian dishes in Aarhus and Copenhagen." },
    ],
  }),
  component: MenuPage,
});

type Item = (typeof menuItems)[number];

function MenuPage() {
  const [cat, setCat] = useState<string>("All");
  const [q, setQ] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const { cart, add, sub, totalQty, total, setOpen: setCartOpen, branch, setBranch } = useCart();

  const matchRoute = useMatchRoute();
  const isDetails = matchRoute({ to: "/menu/$name" });

  const filtered = useMemo(() => menuItems.filter((m) =>
    (cat === "All" || m.category === cat) &&
    (!vegOnly || m.veg) &&
    (q === "" || m.name.toLowerCase().includes(q.toLowerCase()))
  ), [cat, q, vegOnly]);

  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [pendingItem, setPendingItem] = useState<string | null>(null);
  const [loadingItem, setLoadingItem] = useState<string | null>(null);

  const onAdd = (i: Item) => {
    if (totalQty === 0) {
      setPendingItem(i.name);
      setShowLocationPrompt(true);
    } else {
      setLoadingItem(i.name);
      setTimeout(() => {
        add(i.name);
        toast.success(`${i.name} added`);
        setLoadingItem(null);
      }, 500);
    }
  };

  const selectLocationAndAdd = (selectedBranch: string) => {
    setBranch(selectedBranch);
    if (pendingItem) {
      setLoadingItem(pendingItem);
      setTimeout(() => {
        add(pendingItem);
        toast.success(`${pendingItem} added to cart from ${selectedBranch}`);
        setPendingItem(null);
        setLoadingItem(null);
      }, 500);
    }
    setShowLocationPrompt(false);
  };

  if (isDetails) {
    return <Outlet />;
  }

  return (
    <Layout>
      <PageHero eyebrow="Menu" title="Our Kitchen" subtitle="Hand-crafted dishes, served hot from our tandoors and stoves."
        image="https://images.unsplash.com/photo-1626776876729-bab4369a5a5a?auto=format&fit=crop&w=1920&q=80" />

      <div className="border-b bg-accent/30 py-4 shadow-sm">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Ordering from</div>
              <div className="font-semibold text-foreground text-base">{branch}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden md:inline">Change Location:</span>
            <Select value={branch} onValueChange={setBranch}>
              <SelectTrigger className="w-[220px] rounded-full bg-background border-input shadow-soft focus:ring-1 focus:ring-primary cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.name} value={b.name}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dishes…" className="pl-9 rounded-full" />
          </div>
          <button
            onClick={() => setVegOnly((v) => !v)}
            className={`inline-flex items-center gap-2 self-start rounded-full border px-4 py-2 text-sm font-medium transition ${vegOnly ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent"}`}
          ><Leaf className="h-4 w-4" /> Vegetarian only</button>
        </div>

        <div className="mt-6 -mx-6 flex gap-2 overflow-x-auto px-6 pb-2 no-scrollbar">
          {["All", ...menuCategories].map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`shrink-0 rounded-full border px-5 py-2 text-sm font-medium transition ${cat === c ? "gradient-primary border-transparent text-primary-foreground shadow-elegant" : "hover:bg-accent"}`}>{c}</button>
          ))}
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filtered.map((m) => (
              <motion.div
                key={m.name}
                layout
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="group overflow-hidden rounded-3xl border bg-card shadow-soft transition hover:shadow-elegant"
              >
                <Link to="/menu/$name" params={{ name: m.name }} className="relative h-48 overflow-hidden block">
                  <img src={m.image} alt={m.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                  <div className="absolute left-3 top-3 flex gap-1.5">
                    {m.veg && <span className="rounded-full bg-green-600/95 px-2 py-0.5 text-[10px] font-semibold uppercase text-white"><Leaf className="inline h-3 w-3" /></span>}
                    {Array.from({ length: m.spicy }).map((_, i) => <Flame key={i} className="h-4 w-4 fill-red-500 text-red-500 drop-shadow" />)}
                  </div>
                </Link>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link to="/menu/$name" params={{ name: m.name }} className="hover:text-primary transition">
                        <div className="font-display text-xl font-semibold">{m.name}</div>
                      </Link>
                      <div className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">{m.category}</div>
                    </div>
                    <div className="font-display text-lg text-primary">{m.price}</div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{m.desc}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <Button
                      disabled={loadingItem === m.name}
                      onClick={() => onAdd(m)}
                      size="sm"
                      className="rounded-full gradient-primary text-primary-foreground cursor-pointer flex items-center justify-center gap-1.5 min-w-[96px]"
                    >
                      {loadingItem === m.name ? (
                        <>
                          <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Adding...</span>
                        </>
                      ) : (
                        "Add to cart"
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {filtered.length === 0 && <div className="py-20 text-center text-muted-foreground">No dishes match your filters.</div>}
      </section>

      {totalQty > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 left-6 z-30 inline-flex items-center gap-2 rounded-full gradient-primary px-5 py-3.5 text-primary-foreground shadow-elegant transition hover:scale-105 cursor-pointer"
        >
          <ShoppingBag className="h-5 w-5" /> {totalQty} items · {total} DKK
        </button>
      )}

      <Dialog open={showLocationPrompt} onOpenChange={setShowLocationPrompt}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader className="text-center">
            <DialogTitle className="font-display text-2xl flex items-center justify-center gap-2">
              <MapPin className="h-6 w-6 text-primary" /> Choose Your Location
            </DialogTitle>
            <DialogDescription className="text-sm">
              Please choose which restaurant location you would like to order your meal from.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 mt-6">
            {branches.map((b) => (
              <button
                key={b.name}
                onClick={() => selectLocationAndAdd(b.name)}
                className="flex items-start justify-between p-4 rounded-2xl border text-left hover:border-primary hover:bg-primary/5 transition duration-200 cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-foreground">{b.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{b.address}</div>
                </div>
                <ChevronLeft className="h-5 w-5 rotate-180 text-muted-foreground self-center shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
