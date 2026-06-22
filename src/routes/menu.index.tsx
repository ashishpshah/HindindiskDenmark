import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Leaf, Flame, ShoppingBag, MapPin, ChevronLeft } from "lucide-react";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/PageHero";
import { MenuItemPhoto } from "@/components/MenuItemPhoto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useMenuItems, type MenuItemDto } from "@/hooks/useMenuItems";
import { useMenuCategories } from "@/hooks/useMenuCategories";
import { useBranches } from "@/hooks/useBranches";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/menu/")({
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

function MenuPage() {
  const [cat, setCat]         = useState<string>("All");
  const [q, setQ]             = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const { add, totalQty, total, setOpen: setCartOpen, branch, setBranch } = useCart();
  const { lang } = useI18n();
  const da = lang === "da";
  const loc = (en: string, daVal?: string | null) => (da && daVal) ? daVal : en;

  const { data: branchesData = [] }    = useBranches();
  const { data: categoriesData = [] }  = useMenuCategories();

  const currentBranchId = branchesData.find((b) => b.name === branch)?.id;

  const { data: items = [], isLoading } = useMenuItems({
    category: cat === "All" ? undefined : cat,
    q:        q || undefined,
    veg:      vegOnly || undefined,
    branchId: currentBranchId,
  });

  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [pendingItem, setPendingItem]               = useState<MenuItemDto | null>(null);

  const onAdd = (item: MenuItemDto) => {
    if (totalQty === 0) {
      setPendingItem(item);
      setShowLocationPrompt(true);
    } else {
      add(item);
      toast.success(`${loc(item.name, item.nameDa)} added`);
    }
  };

  const selectLocationAndAdd = (selectedBranch: string) => {
    setBranch(selectedBranch);
    if (pendingItem) {
      add(pendingItem);
      toast.success(`${pendingItem.name} added to cart from ${selectedBranch}`);
      setPendingItem(null);
    }
    setShowLocationPrompt(false);
  };

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
                {branchesData.map((b) => (
                  <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>
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

        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={() => setCat("All")}
            className={`rounded-full border px-5 py-2 text-sm font-medium transition ${cat === "All" ? "gradient-primary border-transparent text-primary-foreground shadow-elegant" : "hover:bg-accent"}`}>
            {da ? "Alle" : "All"}
          </button>
          {categoriesData.map((c) => (
            <button key={c.name} onClick={() => setCat(c.name)}
              className={`rounded-full border px-5 py-2 text-sm font-medium transition ${cat === c.name ? "gradient-primary border-transparent text-primary-foreground shadow-elegant" : "hover:bg-accent"}`}>
              {loc(c.name, c.nameDa)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 rounded-3xl border bg-accent/40 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {items.map((m) => (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="group overflow-hidden rounded-3xl border bg-card shadow-soft transition hover:shadow-elegant"
                >
                  <Link to="/menu/$name" params={{ name: m.name }} className="relative h-48 overflow-hidden block">
                    <MenuItemPhoto src={m.imageUrl} alt={m.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                    <div className="absolute left-3 top-3 flex gap-1.5">
                      {m.isVegetarian && <span className="rounded-full bg-green-600/95 px-2 py-0.5 text-[10px] font-semibold uppercase text-white"><Leaf className="inline h-3 w-3" /></span>}
                      {Array.from({ length: m.spicyLevel }).map((_, i) => <Flame key={i} className="h-4 w-4 fill-red-500 text-red-500 drop-shadow" />)}
                    </div>
                  </Link>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link to="/menu/$name" params={{ name: m.name }} className="hover:text-primary transition">
                          <div className="font-display text-xl font-semibold">{loc(m.name, m.nameDa)}</div>
                        </Link>
                        <div className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">{loc(m.category, m.categoryDa)}</div>
                      </div>
                      <div className="font-display text-lg text-primary">{m.price} DKK</div>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{loc(m.description, m.descriptionDa)}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <Button
                        onClick={() => onAdd(m)}
                        size="sm"
                        className="rounded-full gradient-primary text-primary-foreground cursor-pointer flex items-center justify-center gap-1.5 min-w-[96px]"
                      >
                        Add to cart
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        {!isLoading && items.length === 0 && (
          <div className="py-20 text-center text-muted-foreground">No dishes match your filters.</div>
        )}
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
            {branchesData.map((b) => (
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
