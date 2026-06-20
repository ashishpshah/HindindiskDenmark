import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Plus, Minus, Leaf, Flame, Star, MapPin, ShoppingBag } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { menuItems, branches } from "@/data/mock";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/menu/$name")({
  head: ({ params }) => {
    const dishName = decodeURIComponent(params.name);
    const dish = menuItems.find((m) => m.name.toLowerCase() === dishName.toLowerCase());
    return {
      meta: [
        { title: dish ? `${dish.name} — Hind Indisk Menu` : "Dish Details" },
        { name: "description", content: dish ? dish.desc : "Authentic Indian dish details." },
      ],
    };
  },
  component: DishDetailsPage,
});

function DishDetailsPage() {
  const { name } = Route.useParams();
  const decodedName = decodeURIComponent(name);
  const dish = menuItems.find((m) => m.name.toLowerCase() === decodedName.toLowerCase());

  const { add, totalQty, total, setOpen: setCartOpen, branch, setBranch } = useCart();
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [qty, setQty] = useState(1);

  if (!dish) {
    return (
      <Layout>
        <div className="mx-auto max-w-md px-6 py-32 text-center space-y-4">
          <h2 className="font-display text-2xl font-bold">Dish Not Found</h2>
          <p className="text-muted-foreground">The dish you are looking for does not exist or has been removed.</p>
          <Button asChild className="gradient-primary text-primary-foreground">
            <Link to="/menu">Back to Menu</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const related = menuItems
    .filter((m) => m.category === dish.category && m.name !== dish.name)
    .slice(0, 3);

  const handleAddToCart = () => {
    if (totalQty === 0) {
      setShowLocationPrompt(true);
    } else {
      add(dish.name, qty);
      toast.success(`${qty}x ${dish.name} added to cart`);
    }
  };

  const selectLocationAndAdd = (selectedBranch: string) => {
    setBranch(selectedBranch);
    setShowLocationPrompt(false);
    add(dish.name, qty);
    toast.success(`${qty}x ${dish.name} added to cart from ${selectedBranch}`);
  };

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-6 pt-32 pb-12">
        <Link
          to="/menu"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition mb-8"
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Back to Menu
        </Link>

        <div className="grid gap-12 md:grid-cols-2 items-center">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-elegant bg-accent">
            <img src={dish.image} alt={dish.name} className="h-full w-full object-cover" />
            <div className="absolute left-4 top-4 flex gap-1.5">
              {dish.veg && (
                <span className="rounded-full bg-green-600/95 px-3 py-1 text-xs font-semibold uppercase text-white flex items-center gap-1 shadow-md">
                  <Leaf className="h-3 w-3" /> Veg
                </span>
              )}
              {Array.from({ length: dish.spicy }).map((_, i) => (
                <Flame key={i} className="h-5 w-5 fill-red-500 text-red-500 drop-shadow-md" />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                {dish.category}
              </span>
              <h1 className="mt-2 font-display text-4xl sm:text-5xl font-bold">{dish.name}</h1>
              <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-sm text-foreground/80">
                <Star className="h-4 w-4 fill-primary text-primary" /> 4.9 · Recommended
              </div>
            </div>

            <div className="font-display text-3xl font-bold text-primary">{dish.price} DKK</div>

            <p className="text-muted-foreground text-lg leading-relaxed">{dish.desc}</p>

            <div className="border-t pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="inline-flex items-center gap-3 rounded-full border p-1 bg-card shadow-soft">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="grid h-10 w-10 place-items-center rounded-full hover:bg-accent text-foreground transition cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <span className="min-w-6 text-center text-base font-semibold select-none">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="grid h-10 w-10 place-items-center rounded-full hover:bg-accent text-foreground transition cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>

                <Button
                  onClick={handleAddToCart}
                  size="lg"
                  className="rounded-full gradient-primary text-primary-foreground shadow-elegant hover:scale-105 transition-transform duration-200 cursor-pointer flex items-center justify-center min-w-[145px]"
                >
                  <ShoppingBag className="mr-2 h-5 w-5" /> Add to cart
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-4">
              <MapPin className="h-4 w-4 text-primary" />
              <span>Ordering from: <strong>{branch}</strong></span>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-24 border-t pt-16 space-y-8">
            <h2 className="font-display text-3xl font-bold">Related Dishes</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((m) => (
                <div
                  key={m.name}
                  className="group overflow-hidden rounded-3xl border bg-card shadow-soft transition hover:shadow-elegant flex flex-col"
                >
                  <Link to="/menu/$name" params={{ name: m.name }} className="relative h-48 overflow-hidden block">
                    <img src={m.image} alt={m.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                    <div className="absolute left-3 top-3 flex gap-1.5">
                      {m.veg && (
                        <span className="rounded-full bg-green-600/95 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                          <Leaf className="inline h-3 w-3" />
                        </span>
                      )}
                      {Array.from({ length: m.spicy }).map((_, i) => (
                        <Flame key={i} className="h-4 w-4 fill-red-500 text-red-500 drop-shadow" />
                      ))}
                    </div>
                  </Link>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <Link to="/menu/$name" params={{ name: m.name }} className="hover:text-primary transition">
                          <div className="font-display text-xl font-semibold">{m.name}</div>
                        </Link>
                        <div className="font-display text-lg text-primary">{m.price} DKK</div>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{m.desc}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full rounded-full cursor-pointer hover:bg-primary hover:text-white transition-colors"
                      >
                        <Link to="/menu/$name" params={{ name: m.name }}>View Details</Link>
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
