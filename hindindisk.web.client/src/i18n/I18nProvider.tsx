import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { translations, type Lang } from "./translations";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<Ctx | null>(null);

function detectInitialLang(): Lang {
  try {
    const saved = localStorage.getItem("hind-lang") as Lang | null;
    if (saved === "da" || saved === "en") return saved;
    // 1. Browser language — highest signal (user's explicit OS/browser setting)
    if ((navigator.language ?? "").startsWith("da")) return "da";
    // 2. Timezone — catches Danish users whose browser is set to English
    if (Intl.DateTimeFormat().resolvedOptions().timeZone === "Europe/Copenhagen") return "da";
    // 3. Default to English
    return "en";
  } catch {
    return "en";
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectInitialLang);

  // Task 2.2: keep <html lang> in sync with the active language for accessibility
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("hind-lang", l); } catch { /* storage unavailable */ }
  }, []);

  const t = useCallback((key: string) => {
    const parts = key.split(".");
    let cur: Record<string, unknown> | string = translations[lang] as Record<string, unknown>;
    for (const p of parts) {
      if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>))
        cur = (cur as Record<string, unknown>)[p] as Record<string, unknown> | string;
      else return key;
    }
    return typeof cur === "string" ? cur : key;
  }, [lang]);

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const c = useContext(I18nContext);
  if (!c) throw new Error("useI18n must be used inside I18nProvider");
  return c;
}