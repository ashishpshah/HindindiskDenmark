import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/PageHero";
import { galleryImages } from "@/data/mock";

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

function GalleryPage() {
  const [open, setOpen] = useState<string | null>(null);
  const images = [...galleryImages, ...galleryImages];
  return (
    <Layout>
      <PageHero eyebrow="Gallery" title="Through The Lens" subtitle="Dishes, details and quiet moments from inside Hind."
        image="https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1920&q=80" />
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">
          {images.map((src, i) => (
            <motion.button
              key={i}
              onClick={() => setOpen(src)}
              initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
              className="group block w-full overflow-hidden rounded-2xl shadow-soft break-inside-avoid"
            >
              <img src={src} alt="Gallery" className="w-full transition duration-700 group-hover:scale-110" />
            </motion.button>
          ))}
        </div>
      </section>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)}>
            <button className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white" onClick={() => setOpen(null)}><X /></button>
            <motion.img src={open} className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-elegant" initial={{ scale: 0.9 }} animate={{ scale: 1 }} />
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
