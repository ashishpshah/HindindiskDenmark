import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export type LightboxImage = { url: string; caption?: string };

type LightboxProps = {
  images: LightboxImage[];
  index: number | null;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
};

export function Lightbox({ images, index, onClose, onNavigate }: LightboxProps) {
  const isOpen = index !== null && index >= 0 && index < images.length;

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        onNavigate(((index as number) - 1 + images.length) % images.length);
      } else if (e.key === "ArrowRight") {
        onNavigate(((index as number) + 1) % images.length);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, index, images.length, onClose, onNavigate]);

  const current = isOpen ? images[index as number] : null;

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-6"
          data-tagid="div-gallery-backdrop"
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <button
            className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            data-tagid="button-gallery-close"
            aria-label="Close"
            onClick={onClose}
          >
            <X />
          </button>

          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                data-tagid="button-gallery-prev"
                aria-label="Previous image"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate(((index as number) - 1 + images.length) % images.length);
                }}
              >
                <ChevronLeft />
              </button>
              <button
                className="absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                data-tagid="button-gallery-next"
                aria-label="Next image"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate(((index as number) + 1) % images.length);
                }}
              >
                <ChevronRight />
              </button>
            </>
          )}

          <motion.img
            key={current.url}
            src={current.url}
            className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-elegant"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          />

          {(current.caption || images.length > 1) && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-sm text-white/80">
              {current.caption && <div>{current.caption}</div>}
              {images.length > 1 && (
                <div>
                  {(index as number) + 1} / {images.length}
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
