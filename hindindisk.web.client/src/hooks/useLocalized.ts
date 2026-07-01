import { useI18n } from "@/i18n/I18nProvider";

/** Returns the DA value when the active language is Danish and the value is non-empty, otherwise falls back to the EN value. */
export function useLocalized() {
  const { lang } = useI18n();
  const da = lang === "da";

  return {
    localName:  (en: string, da_val?: string | null) => (da && da_val) ? da_val : en,
    localDesc:  (en: string, da_val?: string | null) => (da && da_val) ? da_val : en,
  };
}
