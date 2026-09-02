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

export const LANGUAGES: {
  code: Lang;
  label: string;
  fontClass: string;
  displayFontClass: string;
}[] = [
  { code: "en", label: "English", fontClass: "font-en", displayFontClass: "font-display" },
  { code: "mr", label: "मराठी", fontClass: "font-marathi", displayFontClass: "font-marathi" },
  { code: "hi", label: "हिन्दी", fontClass: "font-hindi", displayFontClass: "font-hindi" },
  { code: "gu", label: "ગુજરાતી", fontClass: "font-gujarati", displayFontClass: "font-gujarati" },
  { code: "te", label: "తెలుగు", fontClass: "font-telugu", displayFontClass: "font-telugu" },
  { code: "ta", label: "தமிழ்", fontClass: "font-tamil", displayFontClass: "font-tamil" },
];

export function fontClassFor(lang: Lang): string {
  return LANGUAGES.find((l) => l.code === lang)?.fontClass ?? "font-sans";
}

export function displayFontClassFor(lang: Lang): string {
  return LANGUAGES.find((l) => l.code === lang)?.displayFontClass ?? "font-display";
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
  /** Font utility class for the active language body/UI ("" for English). */
  fontClass: string;
  /** Display/Hero font utility class for the active language. */
  displayFontClass: string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (saved && LANGUAGES.some((l) => l.code === saved)) {
        setLangState(saved);
        if (typeof document !== "undefined") {
          document.documentElement.lang = saved;
          document.documentElement.setAttribute("data-lang", saved);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
      if (typeof document !== "undefined") {
        document.documentElement.lang = l;
        document.documentElement.setAttribute("data-lang", l);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.setAttribute("data-lang", lang);

      if (document.fonts) {
        const fontQueries: Record<Lang, string> = {
          mr: '16px "Noto Serif Devanagari"',
          hi: '16px "Yatra One"',
          en: '16px "Inter"',
          gu: '16px "Noto Sans Gujarati"',
          te: '16px "Noto Sans Telugu"',
          ta: '16px "Noto Sans Tamil"',
        };
        const query = fontQueries[lang];
        if (query) {
          document.fonts
            .load(query)
            .then(() => {
              const available = document.fonts.check(query);
              console.log(
                `[Typography] Script font active for "${lang}" (${query}): ${available ? "READY" : "PENDING"}`,
              );
            })
            .catch(() => {
              /* font load silent catch */
            });
        }
      }
    }
  }, [lang]);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      isMr: lang === "mr",
      isEn: lang === "en",
      fontClass: fontClassFor(lang),
      displayFontClass: displayFontClassFor(lang),
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
      displayFontClass: "font-display",
    };
  }
  return ctx;
}
