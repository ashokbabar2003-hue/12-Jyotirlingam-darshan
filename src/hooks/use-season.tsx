import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Lang } from "@/hooks/use-language";

export type Season = "vasanta" | "grishma" | "varsha" | "sharad" | "hemanta" | "shishira";
export type SeasonMode = "auto" | Season;

export interface SeasonOption {
  code: Season;
  label: string;
  labelMr: string;
  english: string;
  description: string;
}

export const SEASONS: SeasonOption[] = [
  {
    code: "vasanta",
    label: "वसन्त",
    labelMr: "वसंत",
    english: "Spring",
    description: "Blossoming pink & saffron",
  },
  {
    code: "grishma",
    label: "ग्रीष्म",
    labelMr: "ग्रीष्म",
    english: "Summer",
    description: "Warm amber & sun-gold",
  },
  {
    code: "varsha",
    label: "वर्षा",
    labelMr: "वर्षा",
    english: "Monsoon",
    description: "Cool teal & rain-blue",
  },
  {
    code: "sharad",
    label: "शरद्",
    labelMr: "शरद",
    english: "Autumn",
    description: "Harvest copper & moonlight",
  },
  {
    code: "hemanta",
    label: "हेमन्त",
    labelMr: "हेमंत",
    english: "Pre-winter",
    description: "Deep violet & ember",
  },
  {
    code: "shishira",
    label: "शिशिर",
    labelMr: "शिशिर",
    english: "Winter",
    description: "Cold indigo & frost",
  },
];

export function seasonLabelFor(
  season: { label: string; labelMr?: string },
  lang: Lang | string,
): string {
  return lang === "mr" ? (season.labelMr ?? season.label) : season.label;
}

/** Detect Ritu from a month (0-11). Approximate Hindu 6-season calendar. */
export function detectSeason(date = new Date()): Season {
  const m = date.getMonth(); // 0=Jan
  // Vasanta: Mar-Apr, Grishma: May-Jun, Varsha: Jul-Aug,
  // Sharad: Sep-Oct, Hemanta: Nov-Dec, Shishira: Jan-Feb
  if (m === 2 || m === 3) return "vasanta";
  if (m === 4 || m === 5) return "grishma";
  if (m === 6 || m === 7) return "varsha";
  if (m === 8 || m === 9) return "sharad";
  if (m === 10 || m === 11) return "hemanta";
  return "shishira";
}

interface SeasonContextValue {
  season: Season;
  mode: SeasonMode;
  setMode: (m: SeasonMode) => void;
}

const SeasonContext = createContext<SeasonContextValue | null>(null);
const STORAGE_KEY = "prakruti-mode";

export function SeasonProvider({ children, initialMode = "auto" }: { children: ReactNode; initialMode?: SeasonMode }) {
  const [mode, setModeState] = useState<SeasonMode>(initialMode);

  // Mirror the server-selected mode; do not override SSR with stale storage.
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, mode); } catch { /* optional storage */ }
  }, [mode]);

  const setMode = useCallback((m: SeasonMode) => {
    setModeState(m);
    if (typeof document !== "undefined") document.cookie = `prakruti-mode=${m}; Path=/; Max-Age=31536000; SameSite=Lax`;
    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch {
      /* ignore */
    }
  }, []);

  const season: Season = mode === "auto" ? detectSeason() : mode;

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-season", season);
  }, [season]);

  const value = useMemo(() => ({ season, mode, setMode }), [season, mode, setMode]);

  return <SeasonContext.Provider value={value}>{children}</SeasonContext.Provider>;
}

export function useSeason() {
  const ctx = useContext(SeasonContext);
  if (!ctx) {
    return {
      season: "varsha" as Season,
      mode: "auto" as SeasonMode,
      setMode: () => {},
    };
  }
  return ctx;
}
