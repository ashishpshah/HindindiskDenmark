import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { motion, useScroll, useSpring, useInView } from "framer-motion";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/PageHero";
import { teamMembers, timeline, stats } from "@/data/mock";
import { Target, Sparkles, Heart } from "lucide-react";
import { WhyChooseUs } from "@/components/home/Sections";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Hind Indisk Restaurant" },
      { name: "description", content: "Our story: two decades of authentic Indian cuisine in Denmark. Meet our chefs, our mission and our journey." },
      { property: "og:title", content: "About Hind Indisk Restaurant" },
      { property: "og:description", content: "Two decades of authentic Indian cuisine in Denmark." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t, lang } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });
  const scaleY = useSpring(scrollYProgress, { stiffness: 80, damping: 25, restDelta: 0.001 });

  const mvvItems = [
    { title: t("pages.about.missionTitle"), desc: t("pages.about.missionDesc"), icon: Target },
    { title: t("pages.about.visionTitle"),  desc: t("pages.about.visionDesc"),  icon: Sparkles },
    { title: t("pages.about.valuesTitle"),  desc: t("pages.about.valuesDesc"),  icon: Heart },
  ];

  return (
    <Layout>
      <PageHero
        eyebrow={t("pages.about.eyebrow")}
        title={t("pages.about.title")}
        subtitle={t("pages.about.subtitle")}
        image="https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&w=1920&q=80"
      />

      <section className="mx-auto grid max-w-7xl gap-14 px-6 py-24 lg:grid-cols-2 lg:items-center">
        {/* Left Column: Image and Stats */}
        <div className="space-y-6">
          <img src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80" alt="Restaurant interior" className="aspect-[16/10] w-full rounded-3xl object-cover shadow-elegant" />
          <div className="grid grid-cols-2 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border bg-card p-5 shadow-soft">
                <div className="font-display text-3xl font-bold text-gradient">{s.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{lang === "da" ? s.labelDa : s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Mission, Vision, Values */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">{t("pages.about.foundationLabel")}</div>
          <h2 className="mt-3 font-display text-4xl font-bold">{t("pages.about.principlesTitle")}</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">{t("pages.about.principlesDesc")}</p>

          <div className="mt-8 space-y-4">
            {mvvItems.map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  className="flex gap-5 p-5 rounded-2xl border bg-card shadow-soft hover:shadow-elegant transition duration-300 items-start"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-glow">
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <WhyChooseUs />

      <section className="bg-surface py-28 overflow-hidden">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">{t("pages.about.timelineLabel")}</div>
            <h2 className="mt-3 font-display text-4xl font-bold">{t("pages.about.journeyTitle")}</h2>
          </div>

          <div ref={containerRef} className="mt-20 relative">
            {/* Background Timeline Line */}
            <div className="absolute left-4 top-4 bottom-4 w-[3px] bg-border sm:left-1/2 sm:-translate-x-1/2 rounded-full" />

            {/* Active Highlight Progress Line */}
            <motion.div
              style={{ scaleY }}
              className="absolute left-4 top-4 bottom-4 w-[3px] bg-primary sm:left-1/2 sm:-translate-x-1/2 origin-top rounded-full shadow-glow"
            />

            <div className="space-y-16">
              {timeline.map((tm, idx) => (
                <TimelineItem key={tm.year} tm={tm} idx={idx} lang={lang} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">{t("pages.about.teamLabel")}</div>
            <h2 className="mt-3 font-display text-4xl font-bold">{t("pages.about.teamTitle")}</h2>
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {teamMembers.map((m, i) => (
              <motion.div key={m.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="group overflow-hidden rounded-3xl bg-card shadow-soft hover:shadow-elegant transition">
                <div className="overflow-hidden">
                  <img src={m.image} alt={m.name} className="aspect-[3/4] w-full object-cover transition duration-700 group-hover:scale-110" />
                </div>
                <div className="p-5 text-center">
                  <div className="font-display text-xl font-semibold">{m.name}</div>
                  <div className="mt-1 text-sm text-primary">{lang === "da" ? m.roleDa : m.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

function TimelineItem({ tm, idx, lang }: { tm: typeof timeline[number]; idx: number; lang: string }) {
  const elementRef = useRef<HTMLDivElement>(null);
  const isActive = useInView(elementRef, {
    once: false,
    margin: "-35% 0px -40% 0px"
  });

  const itemTitle = lang === "da" ? tm.titleDa : tm.title;
  const itemDesc  = lang === "da" ? tm.descDa  : tm.desc;

  return (
    <div
      ref={elementRef}
      className="relative grid gap-8 pl-12 sm:grid-cols-2 sm:pl-0"
    >
      {/* Central Bullet dot with active styling */}
      <div className="absolute left-2 top-8 z-10 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2">
        <motion.div
          animate={{
            scale: isActive ? 1.25 : 1,
            backgroundColor: isActive ? "var(--primary)" : "#E2E8F0",
            boxShadow: isActive
              ? "0 0 0 6px rgba(234, 88, 12, 0.25), 0 0 16px rgba(234, 88, 12, 0.5)"
              : "0 0 0 0px rgba(0,0,0,0)",
          }}
          transition={{ duration: 0.3 }}
          className="grid h-6 w-6 place-items-center rounded-full border-[3px] border-background"
        >
          <motion.div
            animate={{
              backgroundColor: isActive ? "#FFFFFF" : "#94A3B8",
              scale: isActive ? 1 : 0.8
            }}
            className="h-2 w-2 rounded-full"
          />
        </motion.div>
      </div>

      {idx % 2 === 0 ? (
        <>
          <motion.div
            animate={{
              opacity: isActive ? 1 : 0.45,
              x: isActive ? 0 : -20,
              scale: isActive ? 1 : 0.96,
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="bg-card border p-7 rounded-3xl shadow-soft hover:shadow-elegant transition duration-300 sm:mr-8 sm:text-right"
          >
            <div className={`font-display text-4xl font-extrabold transition duration-300 ${isActive ? "text-primary text-shadow-glow" : "text-muted-foreground/60"}`}>
              {tm.year}
            </div>
            <div className="mt-2 text-xl font-bold text-foreground">{itemTitle}</div>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{itemDesc}</p>
          </motion.div>
          <div className="hidden sm:block" />
        </>
      ) : (
        <>
          <div className="hidden sm:block" />
          <motion.div
            animate={{
              opacity: isActive ? 1 : 0.45,
              x: isActive ? 0 : 20,
              scale: isActive ? 1 : 0.96,
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="bg-card border p-7 rounded-3xl shadow-soft hover:shadow-elegant transition duration-300 sm:ml-8 sm:text-left"
          >
            <div className={`font-display text-4xl font-extrabold transition duration-300 ${isActive ? "text-primary text-shadow-glow" : "text-muted-foreground/60"}`}>
              {tm.year}
            </div>
            <div className="mt-2 text-xl font-bold text-foreground">{itemTitle}</div>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{itemDesc}</p>
          </motion.div>
        </>
      )}
    </div>
  );
}
