import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/PageHero";
import { galleryImages as fallbackImages } from "@/data/mock";
import { useI18n } from "@/i18n/I18nProvider";
import { useGalleryImages } from "@/hooks/useGalleryImages";
import { BASE } from "@/lib/api/client";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Hind Indisk Restaurant" },
      { name: "description", content: "A visual taste of our dishes, dining rooms and moments at Hind Indisk." },
      { property: "og:title", content: "Gallery" },
      { property: "og:description", content: "Photos from our kitchens and dining rooms." },
    ],
  }),
  component: GalleryPage,
});

function resolveUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BASE}${url}`;
}

function GalleryPage() {
  const { t, lang } = useI18n();
  const { data: apiImages = [] } = useGalleryImages();
  const [open, setOpen] = useState<string | null>(null);

  const images: { url: string; caption: string }[] = apiImages.length > 0
    ? apiImages.map(img => ({
        url: resolveUrl(img.url),
        caption: lang === "da" ? img.captionDa || img.caption : img.caption,
      }))
    : fallbackImages.map(url => ({ url, caption: "" }));

  return (
    <Layout>
      <PageHero
        eyebrow={t("pages.gallery.throughLens")}
        title={t("pages.gallery.throughLens")}
        subtitle={t("pages.gallery.dishesDetails")}
        image="https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1920&q=80"
      />
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">
          {images.map((img, i) => (
            <motion.button
              key={i}
              onClick={() => setOpen(img.url)}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="group block w-full overflow-hidden rounded-2xl shadow-soft break-inside-avoid"
            >
              <img
                src={img.url}
                alt={img.caption || "Gallery"}
                className="w-full transition duration-700 group-hover:scale-110"
              />
            </motion.button>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
          >
            <button
              className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white"
              onClick={() => setOpen(null)}
            >
              <X />
            </button>
            <motion.img
              src={open}
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-elegant"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
