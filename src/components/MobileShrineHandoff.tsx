import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { displayFontClassFor, toLocalDigits, type Lang } from "@/hooks/use-language";
import type { SacredJourneyTransitionData } from "@/data/transitions";

// One shared scroll listener and one animation frame for ALL shrine handoffs.
// No GSAP, Lenis, observers, scroll pinning, timers, or CSS view timelines.
const subscribers = new Set<() => void>();
let pendingFrame = 0;
const tick = () => {
  pendingFrame = 0;
  subscribers.forEach((update) => update());
};
const requestTick = () => {
  if (!pendingFrame) pendingFrame = window.requestAnimationFrame(tick);
};
function subscribe(update: () => void) {
  subscribers.add(update);
  if (subscribers.size === 1) {
    window.addEventListener("scroll", requestTick, { passive: true });
    window.addEventListener("resize", requestTick, { passive: true });
    window.addEventListener("orientationchange", requestTick, { passive: true });
  }
  requestTick();
  return () => {
    subscribers.delete(update);
    if (subscribers.size === 0) {
      window.removeEventListener("scroll", requestTick);
      window.removeEventListener("resize", requestTick);
      window.removeEventListener("orientationchange", requestTick);
      if (pendingFrame) window.cancelAnimationFrame(pendingFrame);
      pendingFrame = 0;
    }
  };
}
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (a: number, b: number, p: number) => {
  const t = clamp((p - a) / (b - a));
  return t * t * (3 - 2 * t);
};

interface Props {
  transition: SacredJourneyTransitionData;
  lang: Lang;
  isEn: boolean;
  className?: string;
}

export function MobileShrineHandoff({ transition, lang, isEn, className }: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const arrivalRef = useRef<HTMLImageElement>(null);
  const departureRef = useRef<HTMLImageElement>(null);
  const omRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const progressTextRef = useRef<HTMLSpanElement>(null);
  const lastPercent = useRef(-1);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const update = () => {
      if (window.innerWidth >= 1024) return;
      const rect = root.getBoundingClientRect();
      const viewport = window.innerHeight;
      if (rect.top > viewport + 150 || rect.bottom < -150) return;
      // Every pixel of scroll maps to exactly one progress position.
      // No easing of the progress itself; no post-scroll catch-up.
      const start = viewport * 0.78;
      const end = viewport * 0.22;
      const distance = Math.max(1, rect.height + start - end);
      const progress = clamp((start - rect.top) / distance);
      const arrival = reduceMotion ? (progress > 0.5 ? 1 : 0) : smooth(0.18, 0.88, progress);
      const middle = reduceMotion ? 0 : smooth(0.15, 0.42, progress) * (1 - smooth(0.58, 0.85, progress));
      if (departureRef.current) departureRef.current.style.opacity = String(1 - arrival);
      if (arrivalRef.current) arrivalRef.current.style.opacity = String(arrival);
      if (omRef.current) omRef.current.style.opacity = String(middle);
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`;
      const pct = Math.round(progress * 100);
      if (pct !== lastPercent.current && progressTextRef.current) {
        lastPercent.current = pct;
        progressTextRef.current.textContent = `${toLocalDigits(pct, lang)}%`;
      }
    };
    return subscribe(update);
  }, [transition.fromSlug, transition.toSlug, lang]);

  return (
    <section ref={rootRef} className={cn("relative w-full overflow-hidden border-y border-border/30 bg-background/95 py-5 lg:hidden", className)} aria-label={transition.label}>
      <div className="mx-auto w-full max-w-3xl px-3 sm:px-6">
        <div className="mb-3 text-center">
          <p className={cn("text-xs font-semibold text-accent", isEn ? "font-display uppercase tracking-wider" : displayFontClassFor(lang))}>{transition.label}</p>
          <p className={cn("mt-1 text-xs text-muted-foreground", displayFontClassFor(lang))}>{transition.subtitle}</p>
        </div>
        <div className="relative mx-auto h-[min(58svh,540px)] min-h-[270px] w-full overflow-hidden rounded-2xl border border-primary/20 bg-[#07080b]">
          <img ref={departureRef} src={transition.fromImage} alt={transition.fromName} loading="lazy" decoding="async" className="pointer-events-none absolute inset-0 h-full w-full object-cover" style={{ opacity: 1 }} />
          <img ref={arrivalRef} src={transition.toImage} alt={transition.toName} loading="lazy" decoding="async" className="pointer-events-none absolute inset-0 h-full w-full object-cover" style={{ opacity: 0 }} />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
          <div ref={omRef} className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 px-5 text-center" style={{ opacity: 0 }}>
            <span className="rounded-full border border-amber-400/50 bg-black/60 px-4 py-2 text-4xl text-amber-300">ॐ</span>
            <h3 className={cn("text-lg font-semibold text-amber-200", displayFontClassFor(lang))}>{transition.spiritualEssence}</h3>
          </div>
          <div className="pointer-events-none absolute inset-x-3 bottom-4 flex items-center justify-between gap-2 text-xs font-semibold text-white drop-shadow-lg">
            <span className={cn("max-w-[46%] truncate", displayFontClassFor(lang))}>{transition.fromName}</span>
            <span className="text-amber-300">→</span>
            <span className={cn("max-w-[46%] truncate text-right", displayFontClassFor(lang))}>{transition.toName}</span>
          </div>
        </div>
        <div className="mx-auto mt-3 max-w-xl">
          <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className={displayFontClassFor(lang)}>{toLocalDigits(transition.fromIndex, lang)}. {transition.fromName}</span>
            <span ref={progressTextRef} className="px-2 font-mono tabular-nums">0%</span>
            <span className={displayFontClassFor(lang)}>{toLocalDigits(transition.toIndex, lang)}. {transition.toName}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-border/40">
            <div ref={progressRef} className="h-full w-full origin-left bg-gradient-to-r from-primary via-amber-300 to-accent" style={{ transform: "scaleX(0)" }} />
          </div>
        </div>
      </div>
    </section>
  );
}
