import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "en" | "mr" | "hi" | "gu" | "te" | "ta";

export const LANGUAGES: { code: Lang; label: string; fontClass: string }[] = [
  { code: "en", label: "English", fontClass: "" },
  { code: "mr", label: "मराठी", fontClass: "font-marathi" },
  { code: "hi", label: "हिन्दी", fontClass: "font-devanagari" },
  { code: "gu", label: "ગુજરાતી", fontClass: "font-gujarati" },
  { code: "te", label: "తెలుగు", fontClass: "font-telugu" },
  { code: "ta", label: "தமிழ்", fontClass: "font-tamil" },
];

export function fontClassFor(lang: Lang): string {
  return LANGUAGES.find((l) => l.code === lang)?.fontClass ?? "";
}

const DIGIT_MAPS: Partial<Record<Lang, string[]>> = {
  mr: ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"],
  hi: ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"],
  gu: ["૦", "૧", "૨", "૩", "૪", "૫", "૬", "૭", "૮", "૯"],
  te: ["౦", "౧", "౨", "౩", "౪", "౫", "౬", "౭", "౮", "౯"],
  ta: ["௦", "௧", "௨", "௩", "௪", "௫", "௬", "௭", "௮", "௯"],
};

export function toLocalDigits(value: number | string, lang: Lang): string {
  const map = DIGIT_MAPS[lang];
  const s = String(value);
  if (!map) return s;
  return s.replace(/[0-9]/g, (d) => map[Number(d)]);
}

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  isMr: boolean;
  isEn: boolean;
  /** Font utility class for the active language ("" for English). */
  fontClass: string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (saved && LANGUAGES.some((l) => l.code === saved)) setLangState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      isMr: lang === "mr",
      isEn: lang === "en",
      fontClass: fontClassFor(lang),
    }),
    [lang, setLang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      lang: "en" as Lang,
      setLang: () => {},
      isMr: false,
      isEn: true,
      fontClass: "",
    };
  }
  return ctx;
}
