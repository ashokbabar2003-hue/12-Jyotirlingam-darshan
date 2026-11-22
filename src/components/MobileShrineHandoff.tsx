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
  const veilRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const progressTextRef = useRef<HTMLSpanElement>(null);
  const lastPercent = useRef(-1);
  const imagesReadyRef = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let started = false;
    imagesReadyRef.current = false;
    // Predecode images well before the transition reaches the viewport.
    const preload = () => {
      if (started) return;
      started = true;
      const prepare = (src: string) => {
        const image = new Image();
        image.decoding = "async";
        image.src = src;
        return image.decode().catch(() => undefined);
      };
      void Promise.all([prepare(transition.fromImage), prepare(transition.toImage)]).then(() => {
        if (disposed) return;
        imagesReadyRef.current = true;
        requestTick();
      });
    };
    const preloadObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        preload();
        preloadObserver.disconnect();
      }
    }, { rootMargin: "1300px 0px" });
    preloadObserver.observe(root);
    const update = () => {
      if (window.innerWidth >= 1024) return;
      const rect = root.getBoundingClientRect();
      const viewport = window.innerHeight;
      if (rect.top > viewport + 150 || rect.bottom < -150) return;
      // Every pixel of scroll maps to exactly one progress position.
      // No easing of the progress itself; no post-scroll catch-up.
      // The animation must run ONLY while the visual stage is held in view.
      // Before the sticky stage reaches its top offset: 0% (departure).
      // At the exact point where the stage must leave: 100% (arrival).
      // This prevents the old bug where most of the crossfade happened before
      // the stage was centered, leaving a blank scroll tail after it.
      const stage = root.firstElementChild as HTMLElement | null;
      if (!stage) return;
      const stickyTop = viewport * 0.08;
      const stickyTravel = Math.max(1, rect.height - stage.getBoundingClientRect().height - stickyTop);
      const progress = clamp((stickyTop - rect.top) / stickyTravel);
      // Three readable phases: departing shrine, sacred threshold, arriving shrine.
      // The midpoint visibly darkens the photographs and illuminates the Om.
      const arrival = reduceMotion ? (progress > 0.5 ? 1 : 0) : smooth(0.2, 0.8, progress);
      const middle = reduceMotion ? 0 : smooth(0.16, 0.34, progress) * (1 - smooth(0.66, 0.86, progress));
      if (departureRef.current) departureRef.current.style.opacity = "1";
      if (arrivalRef.current) arrivalRef.current.style.opacity = String(imagesReadyRef.current ? arrival : 0);
      if (veilRef.current) veilRef.current.style.opacity = String(reduceMotion ? 0.15 : 0.08 + middle * 0.5);
      if (glowRef.current) glowRef.current.style.opacity = String(middle * 0.8);
      if (omRef.current) {
        omRef.current.style.opacity = String(middle);
        omRef.current.style.transform = `translate3d(0,${(1 - middle) * 10}px,0) scale(${0.92 + middle * 0.08})`;
      }
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`;
      const pct = Math.round(progress * 100);
      if (pct !== lastPercent.current && progressTextRef.current) {
        lastPercent.current = pct;
        progressTextRef.current.textContent = `${toLocalDigits(pct, lang)}%`;
      }
    };
    const unsubscribe = subscribe(update);
    return () => {
      disposed = true;
      preloadObserver.disconnect();
      unsubscribe();
    };
  }, [transition.fromSlug, transition.toSlug, lang]);

  return (
    <section ref={rootRef} className={cn("relative w-full min-h-[145svh] border-y border-border/30 bg-background/95 lg:hidden", className)} aria-label={transition.label}>
      <div className="sticky top-[8svh] mx-auto flex h-[84svh] w-full max-w-3xl flex-col justify-center px-3 sm:px-6">
        <div className="mb-3 text-center">
          <p className={cn("text-xs font-semibold text-accent", isEn ? "font-display uppercase tracking-wider" : displayFontClassFor(lang))}>{transition.label}</p>
          <p className={cn("mt-1 text-xs text-muted-foreground", displayFontClassFor(lang))}>{transition.subtitle}</p>
        </div>
        <div className="relative mx-auto h-[min(56svh,540px)] min-h-[250px] w-full overflow-hidden rounded-2xl border border-primary/20 bg-[#07080b]">
          <img ref={departureRef} src={transition.fromImage} alt={transition.fromName} loading="lazy" decoding="async" className="pointer-events-none absolute inset-0 h-full w-full object-cover" style={{ opacity: 1 }} />
          <img ref={arrivalRef} src={transition.toImage} alt={transition.toName} loading="lazy" decoding="async" className="pointer-events-none absolute inset-0 h-full w-full object-cover" style={{ opacity: 0 }} />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/35" />
          <div ref={veilRef} className="pointer-events-none absolute inset-0 bg-[#07030f]" style={{ opacity: 0.12 }} />
          <div ref={glowRef} className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.25),transparent_65%)]" style={{ opacity: 0 }} />
          <div ref={omRef} className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 px-5 text-center" style={{ opacity: 0, transform: "translate3d(0,10px,0) scale(0.92)" }}>
            <span className="rounded-full border border-amber-300/70 bg-black/70 px-5 py-3 text-4xl text-amber-200 shadow-[0_0_28px_rgba(251,191,36,0.45)]">ॐ</span>
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
