import { useRef } from "react";
import { Sparkles, Compass, MapPin } from "lucide-react";
import { useGSAP, gsap, prefersReducedMotion } from "@/hooks/use-gsap";
import { toLocalDigits, displayFontClassFor, type Lang } from "@/hooks/use-language";
import type { SacredJourneyTransitionData } from "@/data/transitions";
import { cn } from "@/lib/utils";

interface SacredJourneyTransitionProps {
  transition: SacredJourneyTransitionData;
  lang: Lang;
  isEn: boolean;
  fontClass: string;
  className?: string;
}

export function SacredJourneyTransition({
  transition,
  lang,
  isEn,
  fontClass,
  className,
}: SacredJourneyTransitionProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  // Cinematic Visual Layers
  const fromImgRef = useRef<HTMLImageElement | null>(null);
  const toImgRef = useRef<HTMLImageElement | null>(null);
  const veilOverlayRef = useRef<HTMLDivElement | null>(null);
  const atmosphericGlowRef = useRef<HTMLDivElement | null>(null);
  const stageRayLineRef = useRef<HTMLDivElement | null>(null);
  const stageRayHeadRef = useRef<HTMLDivElement | null>(null);

  // Typography & Badges
  const chapterBadgeRef = useRef<HTMLDivElement | null>(null);
  const departingBadgeRef = useRef<HTMLDivElement | null>(null);
  const approachingBadgeRef = useRef<HTMLDivElement | null>(null);
  const centralThresholdRef = useRef<HTMLDivElement | null>(null);
  const omIconWrapperRef = useRef<HTMLDivElement | null>(null);
  const spiritualEssenceTextRef = useRef<HTMLHeadingElement | null>(null);
  const destinationPreviewRef = useRef<HTMLDivElement | null>(null);
  const progressLineRef = useRef<HTMLDivElement | null>(null);
  const footerTrackerRef = useRef<HTMLDivElement | null>(null);
  const progressTextRef = useRef<HTMLSpanElement | null>(null);

  const fromNumberDisplay = toLocalDigits(transition.fromIndex, lang);
  const toNumberDisplay = toLocalDigits(transition.toIndex, lang);

  useGSAP(
    () => {
      const container = containerRef.current;
      const stage = stageRef.current;
      const fromImg = fromImgRef.current;
      const toImg = toImgRef.current;
      const veilOverlay = veilOverlayRef.current;
      const atmosphericGlow = atmosphericGlowRef.current;
      const stageRayLine = stageRayLineRef.current;
      const stageRayHead = stageRayHeadRef.current;

      const chapterBadge = chapterBadgeRef.current;
      const departingBadge = departingBadgeRef.current;
      const approachingBadge = approachingBadgeRef.current;
      const centralThreshold = centralThresholdRef.current;
      const omIconWrapper = omIconWrapperRef.current;
      const spiritualEssenceText = spiritualEssenceTextRef.current;
      const destinationPreview = destinationPreviewRef.current;
      const progressLine = progressLineRef.current;
      const footerTracker = footerTrackerRef.current;

      if (!container || !stage || !fromImg || !toImg) return;

      if (prefersReducedMotion()) {
        gsap.set([fromImg, toImg], { clearProps: "all" });
        gsap.set(toImg, { opacity: 1, filter: "none" });
        gsap.set(fromImg, { opacity: 0 });
        gsap.set([chapterBadge, approachingBadge, centralThreshold, footerTracker], {
          opacity: 1,
          y: 0,
        });
        if (progressLine) gsap.set(progressLine, { scaleX: 1 });
        if (stageRayLine) gsap.set(stageRayLine, { scaleX: 1 });
        return;
      }

      const isMobile = window.innerWidth < 768;

      // -------------------------------------------------------------
      // INITIAL VISUAL STATES (Carefully balanced depth and contrast)
      // -------------------------------------------------------------
      gsap.set(fromImg, {
        opacity: 1,
        scale: 1.0,
        yPercent: 0,
        filter: "brightness(1.0) contrast(1.0)",
        transformOrigin: "center center",
      });

      gsap.set(toImg, {
        opacity: 0,
        scale: isMobile ? 1.12 : 1.18,
        yPercent: isMobile ? 2 : 4,
        filter: "brightness(0.2) contrast(1.2)",
        transformOrigin: "center center",
      });

      gsap.set(veilOverlay, { opacity: 0.35 });
      gsap.set(atmosphericGlow, { opacity: 0, scale: 0.8 });

      gsap.set(chapterBadge, { opacity: 0, y: isMobile ? -6 : -10 });
      gsap.set(departingBadge, { opacity: 1, x: 0, y: 0 });
      gsap.set(approachingBadge, { opacity: 0, x: isMobile ? 10 : 20 });

      // Sacred Threshold Group
      gsap.set(centralThreshold, { opacity: 0 });
      gsap.set(omIconWrapper, { opacity: 0, scale: 0.88, y: isMobile ? 8 : 12 });
      gsap.set(spiritualEssenceText, { opacity: 0, y: isMobile ? 6 : 10 });
      gsap.set(destinationPreview, { opacity: 0, y: isMobile ? 4 : 8 });

      // Journey Rays
      if (progressLine) gsap.set(progressLine, { scaleX: 0, transformOrigin: "left center" });
      if (stageRayLine) gsap.set(stageRayLine, { scaleX: 0, transformOrigin: "left center" });
      if (stageRayHead) gsap.set(stageRayHead, { left: "0%", opacity: 0.6 });
      gsap.set(footerTracker, { opacity: 0, y: 6 });

      // -------------------------------------------------------------
      // CONTINUOUS SCROLLTRIGGER CHOREOGRAPHY TIMELINE
      // Timing distribution:
      // - 0.00 -> 0.20: Departure initiation & Header reveal
      // - 0.15 -> 0.35: Atmospheric breathing space & Silhouette dissolve
      // - 0.00 -> 1.00: Journey Ray continuous progress
      // - 0.30 -> 0.68: Sacred Threshold & Om emergence + spiritual essence
      // - 0.52 -> 0.88: Approaching shrine silhouette to architectural detail
      // - 0.80 -> 1.00: Destination handoff & approaching badge lock-in
      // -------------------------------------------------------------
      const scrubDistance = isMobile ? "+=75%" : "+=125%";

      const transitionTl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: isMobile ? "top 80%" : "top 30%",
          end: scrubDistance,
          scrub: isMobile ? 0.4 : 0.65,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            setScrollProgress(self.progress);
          },
        },
      });

      // 1. Header and Progress Tracker enter smoothly as section arrives into view
      transitionTl
        .to(chapterBadge, { opacity: 1, y: 0, ease: "power1.out", duration: 0.18 }, 0)
        .to(footerTracker, { opacity: 1, y: 0, ease: "power1.out", duration: 0.18 }, 0.02);

      // 2. Journey Ray continuously advances across the entire scroll progress (0.00 -> 1.00)
      if (progressLine) {
        transitionTl.to(progressLine, { scaleX: 1, ease: "none", duration: 1.0 }, 0);
      }
      if (stageRayLine) {
        transitionTl.to(stageRayLine, { scaleX: 1, ease: "none", duration: 1.0 }, 0);
      }
      if (stageRayHead) {
        transitionTl
          .to(stageRayHead, { left: "100%", ease: "none", duration: 1.0 }, 0)
          .to(stageRayHead, { opacity: 1, ease: "power1.out", duration: 0.2 }, 0)
          .to(stageRayHead, { opacity: 0.7, ease: "power1.in", duration: 0.2 }, 0.8);
      }

      // 3. DEPARTING SHRINE: Slowly scale outward, subtle vertical drift, preserve silhouette then dissolve
      transitionTl
        .to(
          fromImg,
          {
            scale: isMobile ? 1.06 : 1.12,
            yPercent: isMobile ? -2 : -4,
            filter: "brightness(0.35) contrast(1.2)",
            ease: "power1.inOut",
            duration: 0.22,
          },
          0.04,
        )
        .to(
          fromImg,
          {
            opacity: 0,
            filter: "brightness(0.08) contrast(1.4)",
            ease: "power2.in",
            duration: 0.18,
          },
          0.22,
        )
        // Departing badge stays readable slightly longer than the initial image scale, then dissolves
        .to(
          departingBadge,
          {
            opacity: 0,
            x: isMobile ? -8 : -14,
            ease: "power1.in",
            duration: 0.18,
          },
          0.16,
        );

      // 4. ATMOSPHERIC THRESHOLD: Deep midnight breathing space with warm temple glow aura (0.22 -> 0.72)
      transitionTl
        .to(
          veilOverlay,
          {
            opacity: 0.88,
            ease: "power1.inOut",
            duration: 0.2,
          },
          0.18,
        )
        .to(
          atmosphericGlow,
          {
            opacity: 0.9,
            scale: 1.1,
            ease: "power2.out",
            duration: 0.25,
          },
          0.25,
        );

      // 5. SACRED THRESHOLD: Om emblem & Spiritual Essence reveal at midpoint (0.28 -> 0.70)
      transitionTl
        .to(centralThreshold, { opacity: 1, duration: 0.08 }, 0.28)
        .to(
          omIconWrapper,
          {
            opacity: 1,
            scale: 1.0,
            y: 0,
            ease: "power2.out",
            duration: 0.2,
          },
          0.3,
        )
        .to(
          spiritualEssenceText,
          {
            opacity: 1,
            y: 0,
            ease: "power2.out",
            duration: 0.22,
          },
          0.34,
        )
        .to(
          destinationPreview,
          {
            opacity: 1,
            y: 0,
            ease: "power2.out",
            duration: 0.2,
          },
          0.38,
        )
        // Brief visual hold at the sacred threshold (0.42 to 0.56)
        // Then smoothly dissolves as approaching destination takes over
        .to(
          omIconWrapper,
          {
            opacity: 0,
            scale: 1.06,
            y: isMobile ? -6 : -10,
            ease: "power1.in",
            duration: 0.16,
          },
          0.58,
        )
        .to(
          spiritualEssenceText,
          {
            opacity: 0,
            y: isMobile ? -4 : -8,
            ease: "power1.in",
            duration: 0.16,
          },
          0.6,
        )
        .to(
          destinationPreview,
          {
            opacity: 0,
            y: isMobile ? -3 : -6,
            ease: "power1.in",
            duration: 0.14,
          },
          0.62,
        )
        .to(
          atmosphericGlow,
          {
            opacity: 0.3,
            scale: 0.95,
            ease: "power2.inOut",
            duration: 0.22,
          },
          0.66,
        )
        .to(
          veilOverlay,
          {
            opacity: 0.3,
            ease: "power2.inOut",
            duration: 0.25,
          },
          0.68,
        );

      // 6. APPROACHING SHRINE: Distance -> Silhouette -> Details -> Full Sanctum Illumination (0.50 -> 0.95)
      transitionTl
        // Step A: Distant silhouette emerges from deep darkness with warm ambient backlight
        .to(
          toImg,
          {
            opacity: 0.55,
            scale: isMobile ? 1.08 : 1.1,
            yPercent: isMobile ? 1.5 : 2.5,
            filter: "brightness(0.55) contrast(1.15)",
            ease: "power2.out",
            duration: 0.22,
          },
          0.5,
        )
        // Step B: Architectural details sharpen, scale settles, and full shrine illumination completes
        .to(
          toImg,
          {
            opacity: 1.0,
            scale: 1.0,
            yPercent: 0,
            filter: "brightness(1.0) contrast(1.0)",
            ease: "power2.out",
            duration: 0.28,
          },
          0.68,
        )
        // Step C: Approaching Badge slides in with strong destination presence
        .to(
          approachingBadge,
          {
            opacity: 1,
            x: 0,
            ease: "power2.out",
            duration: 0.24,
          },
          0.68,
        );
    },
    {
      scope: containerRef,
      dependencies: [transition.fromSlug, transition.toSlug, lang],
    },
  );

  return (
    <section
      ref={containerRef}
      id={`journey-transition-${transition.fromSlug}-to-${transition.toSlug}`}
      className={cn(
        "relative w-full overflow-hidden bg-background/95 border-y border-border/30 py-12 sm:py-20 lg:py-24",
        className,
      )}
      aria-label={`Sacred Transition from ${transition.fromName} to ${transition.toName}`}
    >
      {/* Ambient Spiritual Atmosphere Layer */}
      <div className="pointer-events-none absolute inset-0 bg-radial-gradient from-primary/8 via-transparent to-transparent opacity-70 select-none" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full bg-accent/5 blur-3xl select-none" />

      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-4 sm:px-6 lg:px-8">
        {/* Chapter Milestone Header */}
        <div ref={chapterBadgeRef} className="relative mb-6 sm:mb-8 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/70 px-3.5 py-1.5 backdrop-blur-md shadow-sm">
            <Sparkles className="size-3 text-primary diya-flicker" />
            <span
              className={cn(
                "text-[11px] font-semibold text-accent",
                isEn
                  ? "uppercase tracking-[0.2em] font-display"
                  : cn("normal-case tracking-normal", fontClass),
              )}
            >
              {transition.label}
            </span>
          </div>

          <p
            className={cn(
              "mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed",
              fontClass,
            )}
          >
            {transition.subtitle}
          </p>
        </div>

        {/* Central Cinematic Stage Canvas */}
        <div
          ref={stageRef}
          className="relative aspect-[16/10] sm:aspect-[16/9] w-full max-w-4xl overflow-hidden rounded-2xl sm:rounded-3xl border border-border/50 bg-[#07080b] shadow-2xl"
        >
          {/* Departing Image Layer */}
          <img
            ref={fromImgRef}
            src={transition.fromImage}
            alt={transition.fromName}
            className="absolute inset-0 size-full object-cover select-none pointer-events-none will-change-transform"
            loading="lazy"
          />

          {/* Approaching Image Layer */}
          <img
            ref={toImgRef}
            src={transition.toImage}
            alt={transition.toName}
            className="absolute inset-0 size-full object-cover select-none pointer-events-none will-change-transform"
            loading="lazy"
          />

          {/* Atmospheric Threshold Radial Glow */}
          <div
            ref={atmosphericGlowRef}
            className="pointer-events-none absolute inset-0 bg-radial-gradient from-primary/25 via-accent/10 to-transparent blur-2xl select-none"
          />

          {/* Dynamic Midnight Atmospheric Veil */}
          <div
            ref={veilOverlayRef}
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#07080b]/95 via-[#07080b]/50 to-[#07080b]/80"
          />

          {/* In-Canvas Journey Ray Track & Illuminated Meridian */}
          <div className="pointer-events-none absolute inset-x-4 sm:inset-x-8 top-1/2 -translate-y-1/2 h-px bg-white/10 z-10 overflow-hidden">
            <div
              ref={stageRayLineRef}
              className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-primary to-accent"
            />
          </div>

          {/* Traveling Ray Glowing Head */}
          <div
            ref={stageRayHeadRef}
            className="pointer-events-none absolute top-1/2 -translate-y-1/2 size-3 rounded-full bg-accent blur-[1px] shadow-glow z-10 select-none"
          />

          {/* Optical Inner Border & Subtle Vignette */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl sm:rounded-3xl ring-1 ring-inset ring-white/10" />

          {/* Central Sacred Threshold Core */}
          <div
            ref={centralThresholdRef}
            className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none z-20"
          >
            {/* Sacred Origin & Destination Context (Small Hierarchy) */}
            <div className="mb-2 flex items-center gap-2 text-[10px] sm:text-xs font-mono uppercase tracking-widest text-primary/80">
              <span className={cn(!isEn && cn(displayFontClassFor(lang), "text-xs"))}>
                {fromNumberDisplay} • {transition.fromName}
              </span>
              <span className="text-muted-foreground/60">→</span>
              <span
                className={cn(
                  "text-accent font-semibold",
                  !isEn && cn(displayFontClassFor(lang), "text-xs"),
                )}
              >
                {toNumberDisplay} • {transition.toName}
              </span>
            </div>

            {/* Sacred Om Emblem */}
            <div
              ref={omIconWrapperRef}
              className="inline-flex size-11 sm:size-14 items-center justify-center rounded-full border border-primary/40 bg-black/70 backdrop-blur-md mb-3 shadow-glow"
            >
              <span className="text-2xl sm:text-3xl text-primary font-bold font-display select-none leading-none">
                ॐ
              </span>
            </div>

            {/* Spiritual Essence Mantra (Medium Hierarchy) */}
            <h4
              ref={spiritualEssenceTextRef}
              className={cn(
                "text-base sm:text-xl lg:text-2xl font-bold text-gradient-gold max-w-xl overflow-visible",
                displayFontClassFor(lang),
                isEn
                  ? "font-display uppercase tracking-widest leading-tight"
                  : "normal-case tracking-normal leading-snug sm:leading-[1.28]",
              )}
            >
              {transition.spiritualEssence}
            </h4>

            {/* Destination Preview (Large / Strongest Typographic Moment) */}
            <div
              ref={destinationPreviewRef}
              className="mt-3 flex items-center gap-2 text-xs sm:text-sm font-semibold text-white/90"
            >
              <span className="text-accent/90">{isEn ? "Approaching Sanctuary" : "समीप धाम"}:</span>
              <span
                className={cn(
                  "text-white font-bold",
                  displayFontClassFor(lang),
                  isEn ? "font-display tracking-wide" : "tracking-normal",
                )}
              >
                {transition.toName}
              </span>
            </div>
          </div>

          {/* Dynamic Stage Badges */}
          <div className="absolute inset-x-3 bottom-3 sm:inset-x-6 sm:bottom-6 flex items-end justify-between z-20">
            {/* Departing Shrine Badge (Left) */}
            <div
              ref={departingBadgeRef}
              className="flex flex-col rounded-xl border border-white/10 bg-black/75 px-3 py-2 sm:px-4 sm:py-2.5 backdrop-blur-md shadow-lg max-w-[46%]"
            >
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-primary/90">
                <span className="inline-block size-1.5 rounded-full bg-primary/80 animate-pulse" />
                <span>{isEn ? "Departing" : "प्रस्थान"}</span>
                <span className="text-muted-foreground">#{fromNumberDisplay}</span>
              </div>
              <span
                className={cn(
                  "font-bold text-white text-xs sm:text-sm lg:text-base truncate mt-0.5",
                  displayFontClassFor(lang),
                  isEn && "font-display",
                )}
              >
                {transition.fromName}
              </span>
              <span className="text-[10px] sm:text-xs text-white/70 truncate flex items-center gap-1 mt-0.5">
                <MapPin className="size-2.5 sm:size-3 text-primary/70 shrink-0" />
                <span className="truncate">{transition.fromState}</span>
              </span>
            </div>

            {/* Approaching Shrine Badge (Right) */}
            <div
              ref={approachingBadgeRef}
              className="flex flex-col items-end rounded-xl border border-accent/40 bg-black/75 px-3 py-2 sm:px-4 sm:py-2.5 backdrop-blur-md shadow-lg max-w-[46%] text-right"
            >
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-accent">
                <span className="text-muted-foreground">#{toNumberDisplay}</span>
                <span>{isEn ? "Approaching" : "समीप"}</span>
                <span className="inline-block size-1.5 rounded-full bg-accent animate-pulse" />
              </div>
              <span
                className={cn(
                  "font-bold text-white text-xs sm:text-sm lg:text-base truncate mt-0.5",
                  displayFontClassFor(lang),
                  isEn && "font-display",
                )}
              >
                {transition.toName}
              </span>
              <span className="text-[10px] sm:text-xs text-white/70 truncate flex items-center gap-1 mt-0.5">
                <span className="truncate">{transition.toState}</span>
                <Compass className="size-2.5 sm:size-3 text-accent/70 shrink-0" />
              </span>
            </div>
          </div>
        </div>

        {/* Continuous Journey Progress Tracker Bar */}
        <div
          ref={footerTrackerRef}
          className="mt-6 sm:mt-8 flex w-full max-w-xl flex-col items-center"
        >
          <div className="flex w-full items-center justify-between px-1 text-[11px] sm:text-xs text-muted-foreground font-mono">
            <span
              className={cn(
                "font-semibold text-primary truncate max-w-[40%]",
                displayFontClassFor(lang),
                !isEn && "text-xs",
              )}
            >
              {fromNumberDisplay}. {transition.fromName}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70 shrink-0 px-2">
              {Math.round(scrollProgress * 100)}% {isEn ? "Traversed" : "प्रवास"}
            </span>
            <span
              className={cn(
                "font-semibold text-accent truncate max-w-[40%] text-right",
                displayFontClassFor(lang),
                !isEn && "text-xs",
              )}
            >
              {toNumberDisplay}. {transition.toName}
            </span>
          </div>

          {/* Thin Illuminated Journey Line with Glowing Position Head */}
          <div className="relative mt-2.5 h-1.5 w-full rounded-full bg-border/40 overflow-hidden">
            <div
              ref={progressLineRef}
              className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-primary via-accent to-primary"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
