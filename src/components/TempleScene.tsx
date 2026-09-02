import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { MapPin, Compass, ArrowRight, Quote } from "lucide-react";
import { useGSAP, gsap, ScrollTrigger, prefersReducedMotion } from "@/hooks/use-gsap";
import { toLocalDigits, displayFontClassFor, type Lang } from "@/hooks/use-language";
import { type Jyotirlinga, getLocalized } from "@/data/jyotirlingas";
import { cn } from "@/lib/utils";

interface TempleSceneProps {
  shrine: Jyotirlinga;
  index?: number;
  totalShrines?: number;
  lang: Lang;
  isEn: boolean;
  fontClass: string;
  className?: string;
}

type TempleSceneLocale = {
  pilgrimageProgress: (curr: string, total: string) => string;
  enterDarshan: (shrineName: string) => string;
};

const TEMPLE_SCENE_STRINGS: Record<Lang, TempleSceneLocale> = {
  en: {
    pilgrimageProgress: (c, t) => `Pilgrimage ${c} of ${t}`,
    enterDarshan: (name) => `Enter ${name} Darshan`,
  },
  mr: {
    pilgrimageProgress: (c, t) => `तीर्थक्षेत्र ${c} / ${t}`,
    enterDarshan: (name) => `${name} दर्शन प्रवेश`,
  },
  hi: {
    pilgrimageProgress: (c, t) => `तीर्थक्षेत्र ${c} / ${t}`,
    enterDarshan: (name) => `${name} दर्शन में प्रवेश करें`,
  },
  gu: {
    pilgrimageProgress: (c, t) => `તીર્થક્ષેત્ર ${c} / ${t}`,
    enterDarshan: (name) => `${name} દર્શનમાં પ્રવેશ કરો`,
  },
  te: {
    pilgrimageProgress: (c, t) => `పుణ్యక్షేత్రం ${c} / ${t}`,
    enterDarshan: (name) => `${name} దర్శనంలోకి ప్రవేశించండి`,
  },
  ta: {
    pilgrimageProgress: (c, t) => `புனித தலம் ${c} / ${t}`,
    enterDarshan: (name) => `${name} தரிசனத்திற்குள் நுழைக`,
  },
};

export function TempleScene({
  shrine,
  index = 0,
  totalShrines = 12,
  lang,
  isEn,
  fontClass,
  className,
}: TempleSceneProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const pinTargetRef = useRef<HTMLDivElement | null>(null);
  const imgWrapperRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const numberBadgeRef = useRef<HTMLDivElement | null>(null);
  const textGroupRef = useRef<HTMLDivElement | null>(null);
  const metaBadgeRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const descRef = useRef<HTMLParagraphElement | null>(null);
  const significanceRef = useRef<HTMLDivElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);

  const loc = getLocalized(shrine, lang);
  const displayNumber = toLocalDigits(shrine.number, lang);
  const totalDisplay = toLocalDigits(totalShrines, lang);
  const tss = TEMPLE_SCENE_STRINGS[lang] ?? TEMPLE_SCENE_STRINGS.en;

  const isEven = index % 2 === 0;
  const presentation = shrine.presentation ?? {};
  const layoutVariant = presentation.layoutVariant ?? "standard";
  const isWideAspect = presentation.aspectRatio === "wide";
  const pinHoldPercent = presentation.pinHold ?? 50;

  useGSAP(
    () => {
      const container = containerRef.current;
      const pinTarget = pinTargetRef.current;
      const img = imgRef.current;
      const numberBadge = numberBadgeRef.current;
      const metaBadge = metaBadgeRef.current;
      const title = titleRef.current;
      const desc = descRef.current;
      const significance = significanceRef.current;
      const cta = ctaRef.current;

      if (!container || !pinTarget || !img) return;

      // Handle accessibility for reduced motion
      if (prefersReducedMotion()) {
        gsap.set([img, numberBadge, metaBadge, title, desc, significance, cta], {
          opacity: 1,
          visibility: "visible",
          clearProps: "transform",
        });
        return;
      }

      const isMobile = window.innerWidth < 768;

      // Initial visual states: restrained, understated offsets
      gsap.set(img, {
        scale: isMobile ? 1.04 : 1.08,
        yPercent: isMobile ? 0 : -4,
        opacity: 0.85,
      });

      gsap.set(numberBadge, {
        opacity: 0,
        y: 8,
      });

      // Unified subtle text entry (y: 12 -> 0)
      gsap.set([metaBadge, title, desc, significance, cta], {
        opacity: 0,
        y: 12,
      });

      if (!isMobile) {
        // Desktop Experience: Data-driven pinned narrative hold
        const masterTl = gsap.timeline({
          scrollTrigger: {
            trigger: container,
            start: "top top",
            end: `+=${pinHoldPercent}%`,
            pin: pinTarget,
            scrub: 0.8,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        // 1. Coordinated Editorial Reveal (0 - 35% scroll)
        masterTl
          .to(
            img,
            {
              scale: 1.04,
              yPercent: 0,
              opacity: 1,
              ease: "power2.out",
            },
            0,
          )
          .to(
            numberBadge,
            {
              opacity: 1,
              y: 0,
              ease: "power2.out",
            },
            0.04,
          )
          .to(
            metaBadge,
            {
              opacity: 1,
              y: 0,
              ease: "power2.out",
            },
            0.08,
          )
          .to(
            title,
            {
              opacity: 1,
              y: 0,
              ease: "power2.out",
            },
            0.12,
          )
          .to(
            desc,
            {
              opacity: 1,
              y: 0,
              ease: "power2.out",
            },
            0.18,
          )
          .to(
            significance,
            {
              opacity: 1,
              y: 0,
              ease: "power2.out",
            },
            0.24,
          )
          .to(
            cta,
            {
              opacity: 1,
              y: 0,
              ease: "power2.out",
            },
            0.3,
          )
          // 2. Slow Camera Drift (35% - 75% scroll)
          .to(
            img,
            {
              scale: 1.0,
              yPercent: 5,
              ease: "none",
            },
            0.35,
          )
          // 3. Gentle Pilgrimage Chapter Transition (75% - 100% scroll)
          .to(
            [title, metaBadge, desc, significance, cta],
            {
              opacity: 0.7,
              y: -6,
              ease: "power1.inOut",
            },
            0.75,
          );
      } else {
        // Mobile / Touch: Natural document flow with subtle opacity reveal
        const mobileTl = gsap.timeline({
          scrollTrigger: {
            trigger: container,
            start: "top 85%",
            end: "bottom 30%",
            scrub: 0.4,
          },
        });

        mobileTl
          .to(
            img,
            {
              scale: 1.0,
              opacity: 1,
              ease: "none",
            },
            0,
          )
          .to(
            [numberBadge, metaBadge, title, desc, significance, cta],
            {
              opacity: 1,
              y: 0,
              stagger: 0.05,
              ease: "power2.out",
            },
            0,
          );
      }

      // Refresh triggers after fonts are ready
      if (typeof document !== "undefined" && "fonts" in document) {
        document.fonts.ready.then(() => {
          ScrollTrigger.refresh();
        });
      }
    },
    { scope: containerRef, dependencies: [shrine.slug, lang] },
  );

  // Column span assignments based on layoutVariant
  const imgColSpan =
    layoutVariant === "cinematic"
      ? "lg:col-span-8"
      : layoutVariant === "intimate"
        ? "lg:col-span-6"
        : "lg:col-span-7";

  const textColSpan =
    layoutVariant === "cinematic"
      ? "lg:col-span-4"
      : layoutVariant === "intimate"
        ? "lg:col-span-6"
        : "lg:col-span-5";

  // Atmosphere tint styling
  const atmosphereGlow =
    presentation.atmosphere === "azure"
      ? "bg-radial-gradient from-cyan-950/20 via-primary/5 to-transparent"
      : presentation.atmosphere === "mountain"
        ? "bg-radial-gradient from-sky-950/25 via-primary/5 to-transparent"
        : presentation.atmosphere === "amber"
          ? "bg-radial-gradient from-amber-950/25 via-primary/5 to-transparent"
          : "bg-radial-gradient from-primary/5 via-transparent to-transparent";

  return (
    <section
      ref={containerRef}
      id={`shrine-scene-${shrine.slug}`}
      className={cn(
        "relative w-full bg-background border-t border-border/20 transition-colors duration-500",
        className,
      )}
    >
      {/* Waypoint marker connecting continuous pilgrimage */}
      <div className="pointer-events-none absolute -top-1.5 left-1/2 -translate-x-1/2 flex items-center justify-center">
        <span className="size-3 rounded-full bg-border border-2 border-background shadow-sm" />
      </div>

      <div
        ref={pinTargetRef}
        className="relative flex min-h-screen w-full flex-col justify-center overflow-hidden px-4 py-12 sm:px-6 lg:px-12 lg:py-16"
      >
        {/* Subtle atmospheric ambient glow */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 select-none opacity-50",
            atmosphereGlow,
          )}
        />

        <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-14">
          {/* Temple Image Stage (Visual Hero) */}
          <div
            ref={imgWrapperRef}
            className={cn(
              "relative order-1 col-span-1 overflow-hidden rounded-2xl border border-border/50 bg-card/60 shadow-xl",
              imgColSpan,
              isEven ? "lg:order-2" : "lg:order-1",
            )}
          >
            <div
              className={cn(
                "relative w-full overflow-hidden",
                isWideAspect
                  ? "aspect-[4/3] sm:aspect-[16/10] lg:aspect-[16/10]"
                  : "aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3]",
              )}
            >
              <img
                ref={imgRef}
                src={shrine.image}
                alt={`${loc.name} - ${shrine.deity}`}
                width={1280}
                height={960}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                style={{ objectPosition: presentation.objectPosition || "center" }}
                className="size-full object-cover select-none will-change-transform"
              />

              {/* Atmospheric vignetting preserving architecture */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/90 via-background/15 to-transparent" />
              <div
                className={cn(
                  "pointer-events-none absolute inset-0 hidden lg:block",
                  isEven
                    ? "bg-gradient-to-r from-background/50 via-transparent to-transparent"
                    : "bg-gradient-to-l from-background/50 via-transparent to-transparent",
                )}
              />

              {/* Understated Shrine Number */}
              <div
                ref={numberBadgeRef}
                className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs backdrop-blur-md sm:left-6 sm:top-6"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="font-medium tracking-wider text-muted-foreground text-[11px] uppercase">
                  {tss.pilgrimageProgress(displayNumber, totalDisplay)}
                </span>
              </div>

              {/* Location & River Bar */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-muted-foreground sm:bottom-6 sm:left-6 sm:right-6">
                <span className="flex items-center gap-1.5 text-foreground/90 font-medium text-xs truncate max-w-[60%] sm:max-w-none">
                  <MapPin className="size-3.5 text-primary shrink-0" />
                  <span className="truncate">
                    {loc.location}, {loc.state}
                  </span>
                </span>
                <span className="rounded-md border border-white/10 bg-black/40 px-2 py-0.5 text-[11px] text-white/85 backdrop-blur-sm shrink-0">
                  {shrine.river}
                </span>
              </div>
            </div>
          </div>

          {/* Editorial Narrative Stage */}
          <div
            ref={textGroupRef}
            className={cn(
              "relative order-2 col-span-1 flex flex-col justify-center space-y-5 lg:space-y-6",
              textColSpan,
              isEven ? "lg:order-1 lg:pr-4" : "lg:order-2 lg:pl-4",
            )}
          >
            {/* Deity / Sacred Form Subtitle */}
            <div
              ref={metaBadgeRef}
              className={cn(
                "flex items-center gap-2 text-xs font-semibold text-accent",
                isEn ? "uppercase tracking-[0.2em]" : cn("normal-case tracking-normal", fontClass),
              )}
            >
              <Compass className="size-3.5 text-primary" />
              <span>{shrine.deity}</span>
            </div>

            {/* Temple Name (Primary Title) */}
            <h2
              ref={titleRef}
              className={cn(
                "text-3xl text-foreground sm:text-4xl lg:text-5xl overflow-visible",
                displayFontClassFor(lang),
                isEn
                  ? "font-bold font-display tracking-tight leading-tight"
                  : "tracking-normal leading-snug sm:leading-[1.28]",
              )}
            >
              <span className="text-gradient-gold">{loc.name}</span>
            </h2>

            {/* Sacred Narrative Description */}
            <p
              ref={descRef}
              className={cn(
                "text-base leading-relaxed text-muted-foreground sm:text-lg sm:leading-relaxed",
                fontClass,
              )}
            >
              {shrine.description}
            </p>

            {/* Scriptural Significance Moment (Reflective sacred quote) */}
            <div
              ref={significanceRef}
              className="relative rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card/40 to-transparent p-4 sm:p-5 backdrop-blur-sm"
            >
              <Quote className="size-4 text-primary/70 mb-2 opacity-80" />
              <p
                className={cn(
                  "text-sm italic leading-relaxed text-foreground/95 sm:text-[15px] sm:leading-relaxed",
                  fontClass,
                )}
              >
                {shrine.significance}
              </p>
            </div>

            {/* Enter Darshan Link */}
            <div ref={ctaRef} className="pt-1">
              <Link
                to="/jyotirlinga/$slug"
                params={{ slug: shrine.slug }}
                className={cn(
                  "group inline-flex items-center gap-2.5 rounded-lg bg-gradient-aarti px-5 py-2.5 sm:px-6 sm:py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-all duration-300 hover:shadow-lg hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-primary/50",
                  !isEn && cn("text-base", fontClass),
                )}
              >
                <span>{tss.enterDarshan(loc.name)}</span>
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
