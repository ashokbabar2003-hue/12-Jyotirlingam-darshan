import { useRef } from "react";
import { Flame, ChevronDown } from "lucide-react";
import { useGSAP, gsap, ScrollTrigger, prefersReducedMotion } from "@/hooks/use-gsap";
import { displayFontClassFor, type Lang } from "@/hooks/use-language";
import { cn } from "@/lib/utils";
import heroImg from "@/assets/hero-aarti.jpg";

interface HeroStrings {
  tagline: string;
  heroTitlePre: string;
  heroTitleHi: string;
  heroDesc: string;
  cta: string;
}

interface HeroAartiProps {
  t: HeroStrings;
  lang: Lang;
  isEn: boolean;
  fontClass: string;
}

export function HeroAarti({ t, lang, isEn, fontClass }: HeroAartiProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const flameRef = useRef<HTMLDivElement | null>(null);
  const taglineRef = useRef<HTMLParagraphElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const descRef = useRef<HTMLParagraphElement | null>(null);
  const ctaRef = useRef<HTMLAnchorElement | null>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const container = containerRef.current;
      const bgImg = bgImgRef.current;
      const overlay = overlayRef.current;
      const flame = flameRef.current;
      const tagline = taglineRef.current;
      const title = titleRef.current;
      const desc = descRef.current;
      const cta = ctaRef.current;
      const scrollIndicator = scrollIndicatorRef.current;

      if (!container || !bgImg) return;

      // Handle reduced motion accessibility
      if (prefersReducedMotion()) {
        gsap.set([bgImg, overlay, flame, tagline, title, desc, cta, scrollIndicator], {
          opacity: 1,
          visibility: "visible",
          clearProps: "transform",
        });
        return;
      }

      // 1. Initial State: Atmospheric darkness and subdued elements
      gsap.set(bgImg, {
        scale: 1.15,
        opacity: 0.1,
        yPercent: 0,
      });

      gsap.set(overlay, {
        opacity: 0.9,
      });

      gsap.set([flame, tagline, title, desc, cta, scrollIndicator], {
        opacity: 0,
        y: 20,
      });

      // 2. Coordinated Entrance Timeline: Slow, cinematic, sacred
      const entranceTl = gsap.timeline({
        defaults: { ease: "power2.out" },
      });

      entranceTl
        // Step 1 & 2: Atmospheric background reveal (1.8s)
        .to(
          bgImg,
          {
            opacity: 0.55,
            scale: 1.05,
            duration: 2.2,
            ease: "power1.inOut",
          },
          0,
        )
        .to(
          overlay,
          {
            opacity: 0.6,
            duration: 2.0,
            ease: "power1.inOut",
          },
          0,
        )
        // Step 3: Sacred Diya Flame (1.2s)
        .to(
          flame,
          {
            opacity: 1,
            y: 0,
            duration: 1.4,
            ease: "power2.out",
          },
          0.6,
        )
        // Step 4: Tagline & Primary Sacred Title (1.2s)
        .to(
          tagline,
          {
            opacity: 1,
            y: 0,
            duration: 1.0,
            ease: "power2.out",
          },
          1.0,
        )
        .to(
          title,
          {
            opacity: 1,
            y: 0,
            duration: 1.4,
            ease: "power3.out",
          },
          1.2,
        )
        // Step 5: Supporting Scripture & Description (0.9s)
        .to(
          desc,
          {
            opacity: 1,
            y: 0,
            duration: 1.1,
            ease: "power2.out",
          },
          1.6,
        )
        // Step 6: CTA button (0.7s)
        .to(
          cta,
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power2.out",
          },
          1.9,
        )
        // Step 7: Subtle Scroll Indicator (0.6s)
        .to(
          scrollIndicator,
          {
            opacity: 0.8,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
          },
          2.2,
        );

      // 3. Scroll Choreography (Parallax and Fade Transition)
      const isMobile = window.innerWidth < 768;
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom top",
          scrub: isMobile ? 0.5 : 1.0,
          invalidateOnRefresh: true,
        },
      });

      // Background gently translates & scales on scroll to give layered optical depth
      scrollTl
        .to(
          bgImg,
          {
            yPercent: isMobile ? 12 : 25,
            scale: isMobile ? 1.08 : 1.15,
            ease: "none",
          },
          0,
        )
        // Foreground elements softly lift and fade out naturally as the user descends into darshan
        .to(
          [flame, tagline, title],
          {
            y: isMobile ? -30 : -60,
            opacity: 0,
            ease: "power1.in",
          },
          0,
        )
        .to(
          [desc, cta],
          {
            y: isMobile ? -20 : -40,
            opacity: 0,
            ease: "power1.in",
          },
          0.05,
        )
        .to(
          scrollIndicator,
          {
            opacity: 0,
            y: -15,
            ease: "power1.in",
          },
          0,
        );

      // 4. Ensure exact calculation after web fonts have settled
      if (typeof document !== "undefined" && "fonts" in document) {
        document.fonts.ready.then(() => {
          ScrollTrigger.refresh();
        });
      }
    },
    { scope: containerRef, dependencies: [lang] },
  );

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-[90vh] items-center justify-center overflow-hidden sm:min-h-[95vh]"
    >
      {/* Background Image with layered scale and parallax depth */}
      <img
        ref={bgImgRef}
        src={heroImg}
        alt="Sacred Shiva lingam surrounded by glowing diya lamps during night aarti"
        width={1920}
        height={1080}
        referrerPolicy="no-referrer"
        className="pointer-events-none absolute inset-0 size-full object-cover select-none"
      />

      {/* Atmospheric dark gradient overlay */}
      <div
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/70 via-background/80 to-background select-none"
      />

      {/* Foreground Hero Content */}
      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 py-24 text-center sm:py-32">
        <div ref={flameRef} className="mb-2">
          <Flame className="size-10 text-primary diya-flicker sm:size-12" />
        </div>

        <p
          ref={taglineRef}
          className={cn(
            "mt-4 text-sm font-semibold text-accent",
            isEn
              ? "font-display uppercase tracking-[0.3em]"
              : cn("text-base normal-case tracking-normal", displayFontClassFor(lang)),
          )}
        >
          {t.tagline}
        </p>

        <h1
          ref={titleRef}
          className={cn(
            "mt-4 text-4xl text-foreground sm:text-6xl lg:text-7xl overflow-visible",
            isEn
              ? "font-display tracking-tight leading-tight"
              : cn("tracking-normal leading-snug sm:leading-[1.28]", displayFontClassFor(lang)),
          )}
        >
          {isEn ? (
            <>
              {t.heroTitlePre} <span className="text-gradient-gold">{t.heroTitleHi}</span>
            </>
          ) : (
            `${t.heroTitlePre} ${t.heroTitleHi}`
          )}
        </h1>

        <p
          ref={descRef}
          className={cn(
            "mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg sm:leading-relaxed",
            fontClass,
          )}
        >
          {t.heroDesc}
        </p>

        <a
          ref={ctaRef}
          href="#live-darshan"
          className={cn(
            "mt-8 inline-flex items-center justify-center rounded-md bg-gradient-aarti px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all duration-300 hover:opacity-95 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50",
            !isEn && cn("text-base", fontClass),
          )}
        >
          {t.cta}
        </a>

        {/* Subtle scroll guide indicator */}
        <div
          ref={scrollIndicatorRef}
          className="mt-14 hidden flex-col items-center gap-1.5 text-xs text-muted-foreground/70 sm:flex"
        >
          <span className="tracking-widest uppercase text-[10px]">Scroll to enter</span>
          <ChevronDown className="size-4 animate-bounce text-muted-foreground/60" />
        </div>
      </div>
    </section>
  );
}
