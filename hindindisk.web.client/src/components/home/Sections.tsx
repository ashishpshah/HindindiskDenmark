import { motion, useInView } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Star, ChefHat, Leaf, Bike, HeartHandshake, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { stats, whyChooseUs } from "@/data/mock";
import { SectionHeading } from "./Branches";
import { useMenuItems } from "@/hooks/useMenuItems";
import { useBranches } from "@/hooks/useBranches";
import { useCart } from "@/context/CartContext";
import { useI18n } from "@/i18n/I18nProvider";

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
    const timer = setInterval(() => {
      cur += step;
      if (cur >= num) { cur = num; clearInterval(timer); }
      setDisplay(cur + suffix);
    }, 30);
    return () => clearInterval(timer);
  }, [inView, value]);
  return <div ref={ref} className="font-display text-5xl font-bold text-gradient">{display}</div>;
}

export function About() {
  const { t, lang } = useI18n();
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
              <div className="text-xs uppercase text-muted-foreground">{t("home.about.heritageLabel")}</div>
              <div className="font-display text-lg font-semibold">{t("home.about.since")}</div>
            </div>
          </div>
        </div>
        <div>
          <SectionHeading center={false} eyebrow={t("home.about.eyebrow")} title={t("home.about.title")}
            subtitle={t("home.about.subtitle")} />
          <div className="mt-10 grid grid-cols-2 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border bg-card p-5 shadow-soft">
                <Counter value={s.value} />
                <div className="mt-1 text-sm text-muted-foreground">{lang === "da" ? s.labelDa : s.label}</div>
              </div>
            ))}
          </div>
          <Button asChild className="mt-10 gradient-primary text-primary-foreground"><Link to="/about">{t("home.about.discoverBtn")} <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
        </div>
      </div>
    </section>
  );
}

export function FeaturedMenu() {
  const { t, lang } = useI18n();
  const da = lang === "da";
  const loc = (en: string, daVal?: string | null) => (da && daVal) ? daVal : en;
  const [i, setI] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stepWidth, setStepWidth] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const { add, branch } = useCart();
  const { data: branchesData = [] } = useBranches();
  const currentBranchId = branchesData.find(b => b.name === branch)?.id;
  const { data: items = [] } = useMenuItems({ signature: true, branchId: currentBranchId });

  const duplicated = useMemo(() => [...items, ...items, ...items], [items]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const firstCard = containerRef.current.children[0] as HTMLElement;
        if (firstCard) setStepWidth(firstCard.offsetWidth + 20);
      }
    };
    handleResize();
    const timer = setTimeout(handleResize, 100);
    window.addEventListener("resize", handleResize);
    return () => { window.removeEventListener("resize", handleResize); clearTimeout(timer); };
  }, [items]);

  useEffect(() => {
    if (isHovered || items.length === 0) return;
    const timer = setInterval(() => {
      setI(prev => (prev >= items.length - 1 ? 0 : prev + 1));
    }, 4500);
    return () => clearInterval(timer);
  }, [isHovered, items.length]);

  if (items.length === 0) return null;

  return (
    <section
      className="bg-surface py-24 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading center={false} eyebrow={t("home.menu.eyebrow")} title={t("home.menu.title")} subtitle={t("home.menu.subtitle")} />
          <div className="flex items-center gap-3">
            <button
              onClick={() => setI(prev => (prev <= 0 ? items.length - 1 : prev - 1))}
              className="grid h-10 w-10 place-items-center rounded-full border bg-card text-foreground transition hover:border-primary hover:text-primary shadow-soft"
              aria-label={t("home.menu.prevLabel")}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setI(prev => (prev >= items.length - 1 ? 0 : prev + 1))}
              className="grid h-10 w-10 place-items-center rounded-full border bg-card text-foreground transition hover:border-primary hover:text-primary shadow-soft"
              aria-label={t("home.menu.nextLabel")}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <Button asChild variant="outline" className="rounded-full hidden sm:inline-flex">
              <Link to="/menu">{t("home.menu.viewAll")} <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>

        <div className="relative mt-14 w-full overflow-hidden">
          <motion.div
            ref={containerRef}
            className="flex gap-5"
            animate={{ x: -i * stepWidth }}
            transition={{ type: "spring", stiffness: 60, damping: 15 }}
          >
            {duplicated.map((m, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -8 }}
                className="group relative w-full shrink-0 sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] overflow-hidden rounded-3xl bg-card shadow-soft hover:shadow-elegant"
              >
                <Link to="/menu/$name" params={{ name: m.name }} className="block relative h-56 overflow-hidden">
                  <img src={m.imageUrl} alt={loc(m.name, m.nameDa)} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                  <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-black">{loc(m.category, m.categoryDa)}</div>
                </Link>
                <div className="p-5">
                  <Link to="/menu/$name" params={{ name: m.name }} className="font-display text-xl font-semibold hover:text-primary transition">
                    {loc(m.name, m.nameDa)}
                  </Link>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="font-display text-lg text-primary">{m.price} DKK</div>
                    <button
                      onClick={() => {
                        add({ id: m.id, name: m.name, price: m.price, imageUrl: m.imageUrl });
                        toast.success(`${loc(m.name, m.nameDa)} ${t("home.menu.addedToCart")}`);
                      }}
                      className="grid h-10 w-10 place-items-center rounded-full gradient-primary text-primary-foreground transition hover:scale-110"
                      aria-label={`${t("pages.menu.addToCart")} ${loc(m.name, m.nameDa)}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export function WhyChooseUs() {
  const { t, lang } = useI18n();
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow={t("home.whyChoose.eyebrow")} title={t("home.whyChoose.title")} subtitle={t("home.whyChoose.subtitle")} />
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
                <h3 className="mt-5 font-display text-xl font-semibold">{lang === "da" ? w.titleDa : w.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{lang === "da" ? w.descDa : w.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function CTA() {
  const { t } = useI18n();
  return (
    <section className="px-6 py-24">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] p-12 text-center text-primary-foreground sm:p-20" style={{ background: "var(--gradient-primary)" }}>
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-black/20 blur-3xl" />
        <motion.h2
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="relative font-display text-4xl font-bold sm:text-6xl">
          {t("home.cta.title")}
        </motion.h2>
        <p className="relative mx-auto mt-5 max-w-xl text-white/85">{t("home.cta.subtitle")}</p>
        <div className="relative mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" variant="secondary" className="rounded-full bg-white text-foreground hover:bg-white/90"><Link to="/menu">{t("home.cta.orderOnline")}</Link></Button>
          <Button asChild size="lg" className="rounded-full bg-black text-white hover:bg-black/90"><Link to="/reservation">{t("home.cta.bookTable")}</Link></Button>
        </div>
      </div>
    </section>
  );
}
