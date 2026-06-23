import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, Globe, ShoppingBag, User, LogOut, MapPin, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { logoUrl } from "@/data/mock";
import { useBranches } from "@/hooks/useBranches";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const DK_FLAG = (
  <svg viewBox="0 0 37 28" className="h-3 w-4 shrink-0 rounded-[2px] object-cover shadow-[0_1px_2px_rgba(0,0,0,0.15)]">
    <rect width="37" height="28" fill="#C8102E" />
    <rect x="12" width="4" height="28" fill="#FFFFFF" />
    <rect y="12" width="37" height="4" fill="#FFFFFF" />
  </svg>
);

const GB_FLAG = (
  <svg viewBox="0 0 50 30" className="h-3 w-4 shrink-0 rounded-[2px] object-cover shadow-[0_1px_2px_rgba(0,0,0,0.15)]">
    <clipPath id="uk-flag-clip">
      <path d="M25,15 L50,0 L50,30 Z" />
      <path d="M25,15 L0,30 L0,0 Z" />
      <path d="M25,15 L0,0 L50,0 Z" />
      <path d="M25,15 L50,30 L0,30 Z" />
    </clipPath>
    <rect width="50" height="30" fill="#00247d" />
    <path d="M0,0 L50,30 M50,0 L0,30" stroke="#fff" strokeWidth="6" />
    <path d="M0,0 L50,30 M50,0 L0,30" stroke="#cf142b" strokeWidth="4" clipPath="url(#uk-flag-clip)" />
    <path d="M25,0 L25,30 M0,15 L50,15" stroke="#fff" strokeWidth="10" />
    <path d="M25,0 L25,30 M0,15 L50,15" stroke="#cf142b" strokeWidth="6" />
  </svg>
);

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { t, lang, setLang } = useI18n();
  const { user, openModal, logout } = useAuth();
  const { totalQty, setOpen: setCartOpen, branch, setBranch } = useCart();
  const { data: branchesData = [] } = useBranches();

  const navLinks = [
    { to: "/", label: t("nav.home") },
    { to: "/about", label: t("nav.about") },
    { to: "/menu", label: t("nav.menu") },
    { to: "/locations", label: t("nav.locations") },
    { to: "/reservation", label: t("nav.reservation") },
    { to: "/gallery", label: t("nav.gallery") },
    { to: "/contact", label: t("nav.contact") },
  ] as const;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 bg-background transition-all duration-300",
        scrolled ? "shadow-soft" : "shadow-[0_1px_0_0_rgba(0,0,0,0.04)]",
      )}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={logoUrl} alt="Hind Indisk Restaurant" className="h-12 w-auto drop-shadow-md" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-full px-3 py-2 text-sm font-medium font-sans text-foreground/80 transition hover:bg-accent hover:text-primary"
              activeProps={{ className: "text-primary bg-accent" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex max-w-[140px] items-center gap-1 rounded-full px-2 py-2 text-xs text-foreground/70 hover:text-primary">
                <MapPin className="h-4 w-4" /> <span className="truncate">{branch.replace("Hind Indisk ", "")}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {branchesData.map((b) => (
                <DropdownMenuItem key={b.name} onClick={() => setBranch(b.name)}>{b.name}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-foreground/70 hover:text-primary transition">
                {lang === "da" ? DK_FLAG : GB_FLAG} <span className="font-semibold text-xs">{lang.toUpperCase()}</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => setLang("da")} className="flex items-center gap-2 cursor-pointer">
                {DK_FLAG} <span>{t("common.languageDanish")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLang("en")} className="flex items-center gap-2 cursor-pointer">
                {GB_FLAG} <span>{t("common.languageEnglish")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  <User className="h-4 w-4" /> {user.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild><Link to="/account">{t("nav.account")}</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/account/orders">{t("account.myOrders")}</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/account/reservations">{t("account.myReservations")}</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}><LogOut className="mr-2 h-4 w-4" /> {t("actions.logout")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-accent text-foreground/70 hover:text-primary transition" aria-label={t("actions.login")}>
                  <User className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem className="cursor-pointer" onClick={() => openModal("login")}>{t("actions.login")}</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => openModal("register")}>{t("actions.register")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <button onClick={() => setCartOpen(true)} className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-accent" aria-label="Cart">
            <ShoppingBag className="h-5 w-5" />
            {totalQty > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full gradient-primary px-1 text-[10px] font-bold text-primary-foreground">{totalQty}</span>
            )}
          </button>

          <Button asChild className="gradient-primary text-primary-foreground shadow-elegant hover:opacity-90">
            <Link to="/menu"><ShoppingBag className="mr-1 h-4 w-4" /> {t("actions.orderOnline")}</Link>
          </Button>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <button onClick={() => setCartOpen(true)} className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-accent" aria-label="Cart">
            <ShoppingBag className="h-5 w-5" />
            {totalQty > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full gradient-primary px-1 text-[10px] font-bold text-primary-foreground">{totalQty}</span>
            )}
          </button>
          <button className="rounded-full p-2 hover:bg-accent" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] bg-secondary text-secondary-foreground lg:hidden"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
          >
            <div className="flex h-20 items-center justify-between px-4">
              <img src={logoUrl} alt="Hind" className="h-12" />
              <button className="rounded-full p-2 hover:bg-white/10" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 px-6 py-6 text-xl font-sans">
              {navLinks.map((l) => (
                <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="border-b border-white/10 py-3 font-sans hover:text-primary">
                  {l.label}
                </Link>
              ))}
              <div className="mt-4 flex items-center gap-3 text-sm">
                <button onClick={() => setLang("da")} className={`flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 transition ${lang === "da" ? "bg-primary text-primary-foreground border-primary" : "text-white/80 hover:bg-white/5"}`}>
                  {DK_FLAG} <span>DA</span>
                </button>
                <button onClick={() => setLang("en")} className={`flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 transition ${lang === "en" ? "bg-primary text-primary-foreground border-primary" : "text-white/80 hover:bg-white/5"}`}>
                  {GB_FLAG} <span>EN</span>
                </button>
              </div>
              {user ? (
                <>
                  <Link to="/account" onClick={() => setOpen(false)} className="mt-3 border-b border-white/10 py-3 hover:text-primary">{t("nav.account")}</Link>
                  <button onClick={() => { logout(); setOpen(false); }} className="border-b border-white/10 py-3 text-left hover:text-primary">{t("actions.logout")}</button>
                </>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => { openModal("login"); setOpen(false); }}>{t("actions.login")}</Button>
                  <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => { openModal("register"); setOpen(false); }}>{t("actions.register")}</Button>
                </div>
              )}
              <Button asChild className="mt-4 gradient-primary text-primary-foreground">
                <Link to="/menu" onClick={() => setOpen(false)}>{t("actions.orderOnline")}</Link>
              </Button>
              <Button asChild variant="outline" className="mt-2 border-white/20 bg-transparent text-white hover:bg-white/10">
                <Link to="/reservation" onClick={() => setOpen(false)}>{t("actions.bookTable")}</Link>
              </Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
