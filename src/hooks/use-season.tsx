import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Season = "vasanta" | "grishma" | "varsha" | "sharad" | "hemanta" | "shishira";
export type SeasonMode = "auto" | Season;

export const SEASONS: {
  code: Season;
  label: string;
  english: string;
  description: string;
}[] = [
  { code: "vasanta", label: "वसन्त", english: "Spring", description: "Blossoming pink & saffron" },
  { code: "grishma", label: "ग्रीष्म", english: "Summer", description: "Warm amber & sun-gold" },
  { code: "varsha", label: "वर्षा", english: "Monsoon", description: "Cool teal & rain-blue" },
  { code: "sharad", label: "शरद्", english: "Autumn", description: "Harvest copper & moonlight" },
  { code: "hemanta", label: "हेमन्त", english: "Pre-winter", description: "Deep violet & ember" },
  { code: "shishira", label: "शिशिर", english: "Winter", description: "Cold indigo & frost" },
];

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

export function SeasonProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<SeasonMode>("auto");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as SeasonMode | null;
      if (saved) setModeState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const setMode = useCallback((m: SeasonMode) => {
    setModeState(m);
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
