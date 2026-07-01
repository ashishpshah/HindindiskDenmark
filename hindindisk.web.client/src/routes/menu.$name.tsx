import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Plus, Minus, Flame, Star, MapPin, ShoppingBag } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { MenuItemPhoto } from "@/components/MenuItemPhoto";
import { toast } from "sonner";
import { useMenuItem } from "@/hooks/useMenuItem";
import { useBranches } from "@/hooks/useBranches";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/menu/$name")({
  head: ({ params }) => {
    const dishName = decodeURIComponent(params.name);
    return {
      meta: [
        { title: `${dishName} — Hind Indisk Menu` },
        { name: "description", content: "Authentic Indian dish details." },
      ],
    };
  },
  component: DishDetailsPage,
});

function DishDetailsPage() {
  const { name }      = Route.useParams();
  const decodedName   = decodeURIComponent(name);

  const { add, totalQty, total, setOpen: setCartOpen, branch } = useCart();
  const { lang, t } = useI18n();
  const da = lang === "da";
  const loc = (en: string, daVal?: string | null) => (da && daVal) ? daVal : en;

  const { data: branchesData = [] }                 = useBranches();
  const currentBranchId                             = branchesData.find((b) => b.name === branch)?.id;
  const { data, isLoading }                         = useMenuItem(decodedName, currentBranchId);

  const [qty, setQty] = useState(1);

  if (isLoading) {
    return (
      <Layout>
        <div className="mx-auto max-w-7xl px-6 pt-32 pb-12 grid gap-12 md:grid-cols-2">
          <div className="aspect-[4/3] rounded-3xl bg-accent/40 animate-pulse" />
          <div className="space-y-4">
            <div className="h-6 w-32 rounded bg-accent/40 animate-pulse" />
            <div className="h-12 w-3/4 rounded bg-accent/40 animate-pulse" />
            <div className="h-8 w-24 rounded bg-accent/40 animate-pulse" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="mx-auto max-w-md px-6 py-32 text-center space-y-4">
          <h2 className="font-display text-2xl font-bold">{t("pages.menu.dishNotFound")}</h2>
          <p className="text-muted-foreground">{t("pages.menu.dishNotFoundDesc")}</p>
          <Button asChild className="gradient-primary text-primary-foreground">
            <Link to="/menu">{t("pages.menu.backToMenu")}</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const { item: dish, relatedItems: related } = data;

  const handleAddToCart = () => {
    add(dish, qty);
    toast.success(`${qty}× ${loc(dish.name, dish.nameDa)} added to cart`);
  };

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-6 pt-32 pb-12">
        <Link to="/menu" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition mb-8">
          <ChevronLeft className="mr-1 h-4 w-4" /> {t("pages.menu.backToMenu")}
        </Link>

        <div className="grid gap-12 md:grid-cols-2 items-center">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-elegant bg-accent">
            <MenuItemPhoto src={dish.imageUrl} alt={dish.name} className="h-full w-full object-cover" />
            <div className="absolute left-4 top-4 flex gap-1.5">
              {Array.from({ length: dish.spicyLevel }).map((_, i) => (
                <Flame key={i} className="h-5 w-5 fill-red-500 text-red-500 drop-shadow-md" />
              ))}
            </div>
            {dish.code > 0 && (
              <div className="absolute right-4 top-4 grid place-items-center gradient-primary text-primary-foreground h-10 px-4 rounded-full text-base font-bold shadow">
                {dish.code}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{loc(dish.category, dish.categoryDa)}</span>
              <h1 className="mt-2 font-display text-4xl sm:text-5xl font-bold">{loc(dish.name, dish.nameDa)}</h1>
              <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-sm text-foreground/80">
                <Star className="h-4 w-4 fill-primary text-primary" /> 4.9 · {t("pages.menu.recommended")}
              </div>
            </div>

            <div className="font-display text-3xl font-bold text-primary">{dish.price} DKK</div>

            <p className="text-muted-foreground text-lg leading-relaxed">{loc(dish.description, dish.descriptionDa)}</p>

            <div className="border-t pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="inline-flex items-center gap-3 rounded-full border p-1 bg-card shadow-soft">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="grid h-10 w-10 place-items-center rounded-full hover:bg-accent text-foreground transition cursor-pointer"
                    aria-label="Decrease quantity"
                  ><Minus className="h-5 w-5" /></button>
                  <span className="min-w-6 text-center text-base font-semibold select-none">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="grid h-10 w-10 place-items-center rounded-full hover:bg-accent text-foreground transition cursor-pointer"
                    aria-label="Increase quantity"
                  ><Plus className="h-5 w-5" /></button>
                </div>

                <Button
                  onClick={handleAddToCart}
                  size="lg"
                  className="rounded-full gradient-primary text-primary-foreground shadow-elegant hover:scale-105 transition-transform duration-200 cursor-pointer flex items-center justify-center min-w-[145px]"
                >
                  <ShoppingBag className="mr-2 h-5 w-5" /> {t("pages.menu.addToCart")}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-4">
              <MapPin className="h-4 w-4 text-primary" />
              <span>{t("pages.menu.orderingFromLabel")} <strong>{branch}</strong></span>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-24 border-t pt-16 space-y-8">
            <h2 className="font-display text-3xl font-bold">{t("pages.menu.relatedDishes")}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((m) => (
                <div key={m.id} className="group overflow-hidden rounded-3xl border bg-card shadow-soft transition hover:shadow-elegant flex flex-col">
                  <Link to="/menu/$name" params={{ name: m.name }} className="relative h-48 overflow-hidden block">
                    <MenuItemPhoto src={m.imageUrl} alt={m.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                    <div className="absolute left-3 top-3 flex gap-1.5">
                      {Array.from({ length: m.spicyLevel }).map((_, i) => (
                        <Flame key={i} className="h-4 w-4 fill-red-500 text-red-500 drop-shadow" />
                      ))}
                    </div>
                  </Link>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <Link to="/menu/$name" params={{ name: m.name }} className="hover:text-primary transition">
                          <div className="font-display text-xl font-semibold">{loc(m.name, m.nameDa)}</div>
                        </Link>
                        <div className="font-display text-lg text-primary">{m.price} DKK</div>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{loc(m.description, m.descriptionDa)}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t">
                      <Button asChild variant="outline" size="sm" className="w-full rounded-full cursor-pointer hover:bg-primary hover:text-white transition-colors">
                        <Link to="/menu/$name" params={{ name: m.name }}>{t("pages.menu.viewDetails")}</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {totalQty > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 left-6 z-30 inline-flex items-center gap-2 rounded-full gradient-primary px-5 py-3.5 text-primary-foreground shadow-elegant transition hover:scale-105 cursor-pointer"
        >
          <ShoppingBag className="h-5 w-5" /> {totalQty} {t("cart.items")} · {total} DKK
        </button>
      )}


    </Layout>
  );
}
