import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Star, ChefHat, Leaf, Bike, HeartHandshake, Quote, ArrowRight, BadgePercent, Copy, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { stats, featuredMenu, whyChooseUs, offers, reviews, branches } from "@/data/mock";
import { SectionHeading } from "./Branches";
import { useCart } from "@/context/CartContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const iconMap = { ChefHat, Leaf, Bike, HeartHandshake } as const;

function Counter({ value }: { value: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState("0");
  useEffect(() => {
    if (!inView) return;
    const num = parseInt(value.replace(/\D/g, "")) || 0;
    const suffix = value.replace(/[0-9]/g, "");
    let cur = 0;
    const step = Math.max(1, Math.floor(num / 40));
    const t = setInterval(() => {
      cur += step;
      if (cur >= num) { cur = num; clearInterval(t); }
      setDisplay(cur + suffix);
    }, 30);
    return () => clearInterval(t);
  }, [inView, value]);
  return <div ref={ref} className="font-display text-5xl font-bold text-gradient">{display}</div>;
}

export function About() {
  return (
    <section className="py-24">
      <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-2 lg:items-center">
        <div className="relative">
          <motion.img
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            src="https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&w=900&q=80"
            className="aspect-[4/5] w-full rounded-3xl object-cover shadow-elegant"
            alt="Chef preparing dish"
          />
          <motion.img
            initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            src="https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80"
            className="absolute -bottom-10 -right-6 hidden h-56 w-44 rounded-3xl border-8 border-background object-cover shadow-soft sm:block"
            alt="Spices"
          />
          <div className="absolute -left-6 top-10 hidden rounded-2xl glass px-5 py-4 shadow-soft sm:flex sm:items-center sm:gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full gradient-primary text-primary-foreground"><ChefHat className="h-5 w-5" /></div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Heritage</div>
              <div className="font-display text-lg font-semibold">Since 2004</div>
            </div>
          </div>
        </div>
        <div>
          <SectionHeading center={false} eyebrow="Our Story" title="A Family Kitchen, Rooted In Denmark"
            subtitle="Two decades of crafting authentic Indian cuisine using time-honoured recipes, locally sourced ingredients and a deep respect for the craft of hospitality." />
          <div className="mt-10 grid grid-cols-2 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border bg-card p-5 shadow-soft">
                <Counter value={s.value} />
                <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
          <Button asChild className="mt-10 gradient-primary text-primary-foreground"><Link to="/about">Discover Our Story <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
        </div>
      </div>
    </section>
  );
}

export function FeaturedMenu() {
  const [i, setI] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stepWidth, setStepWidth] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const { branch, setBranch, add } = useCart();
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [pendingItem, setPendingItem] = useState<any>(null);

  // Triple the featured items array to enable infinite smooth scroll-wrapping
  const duplicatedMenu = [...featuredMenu, ...featuredMenu, ...featuredMenu];

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const firstCard = containerRef.current.children[0] as HTMLElement;
        if (firstCard) {
          // card width + 20px gap
          setStepWidth(firstCard.offsetWidth + 20);
        }
      }
    };

    handleResize();
    const t = setTimeout(handleResize, 100);

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (isHovered) return;
    const t = setInterval(() => {
      setI((prev) => {
        if (prev >= featuredMenu.length - 1) {
          return 0;
        }
        return prev + 1;
      });
    }, 4500);
    return () => clearInterval(t);
  }, [isHovered]);

  const handleNext = () => {
    setI((prev) => (prev >= featuredMenu.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setI((prev) => (prev <= 0 ? featuredMenu.length - 1 : prev - 1));
  };

  const handleAddToCart = (item: any) => {
    if (!branch) {
      setPendingItem(item);
      setShowLocationDialog(true);
    } else {
      add(item.name);
      toast.success(`${item.name} added to cart!`);
    }
  };

  const selectBranch = (selectedBranch: string) => {
    setBranch(selectedBranch);
    setShowLocationDialog(false);
    if (pendingItem) {
      add(pendingItem.name);
      toast.success(`${pendingItem.name} added to cart for ${selectedBranch}!`);
      setPendingItem(null);
    }
  };

  return (
    <section
      className="bg-surface py-24 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading center={false} eyebrow="Most Loved" title="Signature Dishes" subtitle="Hand-picked favourites from our chef's table." />
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrev}
              className="grid h-10 w-10 place-items-center rounded-full border bg-card text-foreground transition hover:border-primary hover:text-primary shadow-soft"
              aria-label="Previous dishes"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={handleNext}
              className="grid h-10 w-10 place-items-center rounded-full border bg-card text-foreground transition hover:border-primary hover:text-primary shadow-soft"
              aria-label="Next dishes"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <Button asChild variant="outline" className="rounded-full hidden sm:inline-flex"><Link to="/menu">View Full Menu <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          </div>
        </div>

        <div className="relative mt-14 w-full overflow-hidden">
          <motion.div
            ref={containerRef}
            className="flex gap-5"
            animate={{ x: -i * stepWidth }}
            transition={{ type: "spring", stiffness: 60, damping: 15 }}
          >
            {duplicatedMenu.map((m, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -8 }}
                className="group relative w-full shrink-0 sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] overflow-hidden rounded-3xl bg-card shadow-soft hover:shadow-elegant"
              >
                <Link to="/menu/$name" params={{ name: m.name }} className="block relative h-56 overflow-hidden">
                  <img src={m.image} alt={m.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                  <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-black">{m.category}</div>
                  <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white"><Star className="h-3 w-3 fill-primary text-primary" />{m.rating}</div>
                </Link>
                <div className="p-5">
                  <Link to="/menu/$name" params={{ name: m.name }} className="font-display text-xl font-semibold hover:text-primary transition">{m.name}</Link>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="font-display text-lg text-primary">{m.price}</div>
                    <button
                      onClick={() => handleAddToCart(m)}
                      className="grid h-10 w-10 place-items-center rounded-full gradient-primary text-primary-foreground transition hover:scale-110"
                      aria-label={`Add ${m.name} to cart`}
                    ><Plus className="h-4 w-4" /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Location Selector Dialog Modal */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent className="max-w-md rounded-3xl p-6 bg-card">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold text-center">Choose Location</DialogTitle>
            <DialogDescription className="text-center mt-2 text-muted-foreground">
              Please select which branch you would like to order from.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 mt-6">
            {branches.map((b) => (
              <button
                key={b.city}
                onClick={() => selectBranch(b.city)}
                className="flex items-center justify-between rounded-2xl border p-4 text-left transition hover:border-primary hover:bg-primary/5 group"
              >
                <div>
                  <div className="font-semibold text-lg group-hover:text-primary">{b.city}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">{b.address}</div>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <MapPin className="h-5 w-5" />
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export function WhyChooseUs() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="Why Choose Us" title="Crafted With Care, Always" subtitle="Four reasons our guests keep coming back." />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {whyChooseUs.map((w, i) => {
            const Icon = iconMap[w.icon as keyof typeof iconMap];
            return (
              <motion.div
                key={w.title}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -6 }}
                className="group rounded-3xl border bg-card p-7 text-center shadow-soft transition hover:shadow-elegant"
              >
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-glow">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold">{w.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{w.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Offers() {
  return (
    <section className="relative overflow-hidden bg-secondary py-28 text-secondary-foreground">
      {/* Decorative premium background elements */}
      <div className="absolute inset-0 opacity-40" style={{ background: "var(--gradient-dark)" }} />
      <div className="absolute -left-20 top-20 h-96 w-96 rounded-full bg-primary/20 blur-[120px]" />
      <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-primary-glow/20 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold uppercase tracking-[0.3em] text-primary"
          >
            Limited Time Offers
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-3 font-display text-4xl font-bold sm:text-5xl"
          >
            Special Dining Perks
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-white/70 max-w-lg mx-auto"
          >
            Indulge in authentic Indian flavors with our exclusive offers. Save more on your next visit or online order.
          </motion.p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {offers.map((o, i) => (
            <motion.div
              key={o.code}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.6 }}
              whileHover={{ y: -10 }}
              className="group relative h-[480px] overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-elegant"
            >
              {/* Background Image with Zoom */}
              <div className="absolute inset-0 z-0">
                <img
                  src={o.image}
                  alt={o.title}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />
                {/* Beautiful deep gradient overlay for high contrast text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
              </div>

              {/* Card Content */}
              <div className="relative z-10 flex h-full flex-col justify-between p-7">
                {/* Top: Badges */}
                <div className="flex items-center justify-between">
                  <div className="rounded-full bg-primary/95 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-black shadow-glow">
                    {o.badge}
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-xs text-white/80 backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    {o.validity}
                  </div>
                </div>

                {/* Bottom: Details & Interaction */}
                <div>
                  <h3 className="font-display text-2xl font-bold text-white group-hover:text-primary transition duration-300">
                    {o.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/75 line-clamp-3">
                    {o.desc}
                  </p>

                  {/* Promo Code Box */}
                  <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-sm">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wider text-white/50">PROMO CODE</span>
                      <span className="font-mono text-sm font-semibold tracking-widest text-primary">{o.code}</span>
                    </div>
                    <button
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 active:scale-95"
                      onClick={() => {
                        navigator.clipboard?.writeText(o.code);
                        toast.success(`Code "${o.code}" copied to clipboard!`);
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </button>
                  </div>

                  {/* CTA Link Button */}
                  <Button asChild className="mt-5 w-full gradient-primary text-primary-foreground font-semibold hover:scale-[1.02] active:scale-98 transition duration-300 rounded-2xl">
                    <Link to={o.ctaLink as any}>
                      {o.ctaText} <ArrowRight className="ml-2 h-4 w-4 transition duration-300 group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Reviews() {
  const [i, setI] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stepWidth, setStepWidth] = useState(0);

  // Triple the reviews array to enable infinite smooth scroll-wrapping
  const duplicatedReviews = [...reviews, ...reviews, ...reviews];

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const firstCard = containerRef.current.children[0] as HTMLElement;
        if (firstCard) {
          // card width + 24px gap
          setStepWidth(firstCard.offsetWidth + 24);
        }
      }
    };

    handleResize();
    // Run after a short delay to ensure DOM styles have applied
    const t = setTimeout(handleResize, 100);

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setI((prev) => {
        if (prev >= reviews.length - 1) {
          return 0;
        }
        return prev + 1;
      });
    }, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="bg-surface py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="Guest Stories" title="Loved By Diners Across Denmark" />

        <div className="relative mt-14 w-full overflow-hidden">
          <motion.div
            ref={containerRef}
            className="flex gap-6"
            animate={{ x: -i * stepWidth }}
            transition={{ type: "spring", stiffness: 60, damping: 15 }}
          >
            {duplicatedReviews.map((r, idx) => (
              <div
                key={idx}
                className="w-full shrink-0 sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] rounded-3xl border bg-card p-8 shadow-soft flex flex-col justify-between min-h-[220px]"
              >
                <div>
                  <Quote className="h-8 w-8 text-primary/30" />
                  <p className="mt-4 text-base leading-relaxed text-foreground/90 italic">
                    "{r.review}"
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between border-t pt-4">
                  <div>
                    <div className="font-semibold text-sm">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.city}</div>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: r.rating }).map((_, k) => (
                      <Star key={k} className="h-3.5 w-3.5 fill-primary text-primary" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="mt-8 flex justify-center gap-1.5">
          {reviews.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`Review page ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? "w-8 gradient-primary" : "w-2 bg-border"
                }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function CTA() {
  return (
    <section className="px-6 py-24">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] p-12 text-center text-primary-foreground sm:p-20" style={{ background: "var(--gradient-primary)" }}>
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-black/20 blur-3xl" />
        <motion.h2
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="relative font-display text-4xl font-bold sm:text-6xl">
          Ready To Taste Authentic Indian Cuisine?
        </motion.h2>
        <p className="relative mx-auto mt-5 max-w-xl text-white/85">From slow-simmered curries to crisp tandoor breads — your seat is waiting.</p>
        <div className="relative mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" variant="secondary" className="rounded-full bg-white text-foreground hover:bg-white/90"><Link to="/menu">Order Online</Link></Button>
          <Button asChild size="lg" className="rounded-full bg-black text-white hover:bg-black/90"><Link to="/reservation">Book a Table</Link></Button>
        </div>
      </div>
    </section>
  );
}
