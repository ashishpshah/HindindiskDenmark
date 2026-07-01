import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ArrowUp } from "lucide-react";
import { CartDrawer } from "./CartDrawer";
import { AuthModal } from "./AuthModal";
import { useCart } from "@/context/CartContext";
import { useBranches } from "@/hooks/useBranches";

export function Layout({ children }: { children: ReactNode }) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { branch } = useCart();
  const { data: branchesData = [] } = useBranches();
  const currentBranch = branchesData.find(b => b.name === branch);
  const phoneHref = currentBranch?.phone
    ? `tel:${currentBranch.phone.replace(/\s+/g, "")}`
    : "tel:+4586123456";

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {children}
      </motion.main>
      <Footer />
      <CartDrawer />
      <AuthModal />

      {/* Floating Actions on the Right Side */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              key="back-to-top"
              initial={{ opacity: 0, y: 15, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.8 }}
              transition={{ duration: 0.25 }}
              onClick={scrollToTop}
              className="grid h-12 w-12 place-items-center rounded-full border bg-card text-foreground shadow-elegant hover:scale-110 hover:text-primary hover:border-primary/30 transition duration-300"
              aria-label="Back to top"
            >
              <ArrowUp className="h-5 w-5" />
            </motion.button>
          )}
        </AnimatePresence>

<a href={phoneHref} className="grid h-12 w-12 place-items-center rounded-full gradient-primary text-primary-foreground shadow-elegant transition hover:scale-110" aria-label="Call Us">
          <Phone className="h-5 w-5" />
        </a>
      </div>
    </div>
  );
}
