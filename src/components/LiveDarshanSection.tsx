import { useState, useMemo, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { Play, Radio, Check, MapPin, Sparkles, ArrowRight, Grid, Eye } from "lucide-react";
import { useGSAP, gsap, prefersReducedMotion } from "@/hooks/use-gsap";
import { jyotirlingas, getLocalized, type Jyotirlinga } from "@/data/jyotirlingas";
import { validateYoutubeUrl } from "@/lib/youtube";
import { cn } from "@/lib/utils";
import { DarshanTile, type DarshanStatus } from "@/components/darshan-tile";
import { toLocalDigits, displayFontClassFor, type Lang } from "@/hooks/use-language";

interface LiveDarshanSectionProps {
  linksData: Record<string, string> | undefined;
  lang: Lang;
  isEn: boolean;
  fontClass: string;
  statuses: Record<string, DarshanStatus>;
  setStatus: (slug: string, s: DarshanStatus) => void;
  selected: string[];
  toggleSelected: (slug: string) => void;
  watchSelected: () => void;
  watchAll: () => void;
  liveOnly: boolean;
  setLiveOnly: (fn: (v: boolean) => boolean) => void;
  onClearSelected: () => void;
  t: {
    liveTitle: string;
    liveDesc: string;
    open: string;
  };
}

type LiveSectionLocale = {
  sanctumPresence: string;
  watchAll12: string;
  watchSelected: string;
  showingLiveOnly: string;
  filterLiveOnly: string;
  featured: string;
  grid12: string;
  clear: string;
  explorePrefix: string;
  exploreSuffix: string;
  selectShrineStream: string;
  shrinesCount: string;
  rec: string;
  bridgeEyebrow: string;
  bridgeTitle: string;
  bridgeDesc: string;
};

const LIVE_SECTION_STRINGS: Record<Lang, LiveSectionLocale> = {
  en: {
    sanctumPresence: "Live Sanctum Presence",
    watchAll12: "Watch all 12 streams",
    watchSelected: "Watch selected",
    showingLiveOnly: "Showing LIVE only",
    filterLiveOnly: "Filter LIVE only",
    featured: "Featured",
    grid12: "All 12 Grid",
    clear: "Clear",
    explorePrefix: "Explore",
    exploreSuffix: "",
    selectShrineStream: "Select Shrine Stream",
    shrinesCount: "Shrines",
    rec: "Rec",
    bridgeEyebrow: "From Live Presence to the Timeless Pilgrimage",
    bridgeTitle: "Twelve Sacred Abodes. One Sacred Circuit.",
    bridgeDesc:
      "Descend into the physical sanctums across India, exploring each sacred lingam, ancient legends, and living traditions.",
  },
  mr: {
    sanctumPresence: "थेट गर्भगृह दर्शन",
    watchAll12: "सर्व १२ थेट प्रवाह पाहा",
    watchSelected: "निवडलेले पाहा",
    showingLiveOnly: "फक्त थेट दर्शन",
    filterLiveOnly: "फक्त थेट",
    featured: "मुख्य",
    grid12: "सर्व १२ ग्रिड",
    clear: "साफ करा",
    explorePrefix: "",
    exploreSuffix: "माहिती",
    selectShrineStream: "मंदिर निवडा",
    shrinesCount: "तीर्थक्षेत्रे",
    rec: "थेट प्रवाह",
    bridgeEyebrow: "थेट दर्शनापासून सनातन तीर्थयात्रेपर्यंत",
    bridgeTitle: "बारा स्वयंभू क्षेत्रे. एक अखंड तीर्थमार्ग.",
    bridgeDesc:
      "भारतातील सर्व दिशांना असलेल्या पवित्र ज्योतिर्लिंग मंदिरांचे दर्शन, इतिहास आणि परंपरांचा अनुभव घ्या.",
  },
  hi: {
    sanctumPresence: "लाइव गर्भगृह दर्शन",
    watchAll12: "सभी 12 लाइव प्रसारण देखें",
    watchSelected: "चुने हुए देखें",
    showingLiveOnly: "केवल लाइव दर्शन",
    filterLiveOnly: "केवल लाइव",
    featured: "मुख्य",
    grid12: "12 ग्रिड",
    clear: "साफ़ करें",
    explorePrefix: "",
    exploreSuffix: "विवरण",
    selectShrineStream: "मंदिर चुनें",
    shrinesCount: "तीर्थक्षेत्र",
    rec: "प्रसारण",
    bridgeEyebrow: "प्रत्यक्ष दर्शन से सनातन तीर्थयात्रा की ओर",
    bridgeTitle: "बारह स्वयंभू क्षेत्र। एक अखंड तीर्थमार्ग।",
    bridgeDesc:
      "भारत की सभी दिशाओं में स्थित पवित्र ज्योतिर्लिंग मंदिरों के दर्शन, इतिहास और परंपराओं का अनुभव करें।",
  },
  gu: {
    sanctumPresence: "જીવંત ગર્ભગૃહ દર્શન",
    watchAll12: "બધાં 12 જીવંત પ્રસારણ જુઓ",
    watchSelected: "પસંદ કરેલા જુઓ",
    showingLiveOnly: "માત્ર જીવંત દર્શન",
    filterLiveOnly: "માત્ર જીવંત",
    featured: "મુખ્ય",
    grid12: "12 ગ્રીડ",
    clear: "સાફ કરો",
    explorePrefix: "",
    exploreSuffix: "વિગત",
    selectShrineStream: "મંદિર પસંદ કરો",
    shrinesCount: "તીર્થક્ષેત્રો",
    rec: "પ્રસારણ",
    bridgeEyebrow: "જીવંત દર્શનથી સનાતન તીર્થયાત્રા તરફ",
    bridgeTitle: "બાર સ્વયંભૂ ક્ષેત્રો. એક અખંડ તીર્થમાર્ગ.",
    bridgeDesc:
      "ભારતની તમામ દિશાઓમાં પવિત્ર જ્યોતિર્લિંગ મંદિરોનાં દર્શન, ઇતિહાસ અને પરંપરાઓનો અનુભવ કરો.",
  },
  te: {
    sanctumPresence: "ప్రత్యక్ష గర్భగుడి దర్శనం",
    watchAll12: "అన్ని 12 ప్రత్యక్ష ప్రసారాలు చూడండి",
    watchSelected: "ఎంచుకున్నవి చూడండి",
    showingLiveOnly: "ప్రత్యక్ష ప్రసారాలు మాత్రమే",
    filterLiveOnly: "ప్రత్యక్షం మాత్రమే",
    featured: "ప్రధాన",
    grid12: "12 గ్రిడ్",
    clear: "స్పష్టం చేయండి",
    explorePrefix: "",
    exploreSuffix: "వివరాలు",
    selectShrineStream: "ఆలయాన్ని ఎంచుకోండి",
    shrinesCount: "పుణ్యక్షేత్రాలు",
    rec: "రికార్డ్",
    bridgeEyebrow: "ప్రత్యక్ష దర్శనం నుండి సనాతన తీర్థయాత్ర వైపు",
    bridgeTitle: "పన్నెండు స్వయంభూ క్షేత్రాలు. ఒక అఖండ తీర్థమార్గం.",
    bridgeDesc:
      "భారతదేశం నలుమూలల ఉన్న పవిత్ర జ్యోతిర్లింగ ఆలయాల దర్శనం, చరిత్ర, సంప్రదాయాలను అనుభవించండి.",
  },
  ta: {
    sanctumPresence: "நேரடி கருவறை தரிசனம்",
    watchAll12: "அனைத்து 12 நேரடி ஒளிபரப்புகளையும் காண்க",
    watchSelected: "தேர்ந்தெடுக்கப்பட்டவற்றை காண்க",
    showingLiveOnly: "நேரடி தரிசனம் மட்டும்",
    filterLiveOnly: "நேரடி மட்டும்",
    featured: "முக்கிய",
    grid12: "12 கட்டம்",
    clear: "அழிக்க",
    explorePrefix: "",
    exploreSuffix: "விவரங்கள்",
    selectShrineStream: "கோயிலைத் தேர்ந்தெடுக்கவும்",
    shrinesCount: "புனித தலங்கள்",
    rec: "பதிவு",
    bridgeEyebrow: "நேரடி தரிசனத்திலிருந்து நித்திய யாத்திரையை நோக்கி",
    bridgeTitle: "பன்னிரண்டு சுயம்பு தலங்கள். ஒரு புனித யாத்திரை பாதை.",
    bridgeDesc:
      "இந்தியாவின் அனைத்து திசைகளிலும் உள்ள புனித ஜோதிர்லிங்க கோயில்களின் தரிசனம், வரலாறு மற்றும் மரபுகளை அனுபவியுங்கள்.",
  },
};

function defaultKey(slug: string) {
  return `${slug}__default`;
}

export function LiveDarshanSection({
  linksData,
  lang,
  isEn,
  fontClass,
  statuses,
  setStatus,
  selected,
  toggleSelected,
  watchSelected,
  watchAll,
  liveOnly,
  setLiveOnly,
  onClearSelected,
  t,
}: LiveDarshanSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const featuredStageRef = useRef<HTMLDivElement | null>(null);
  const selectorStripRef = useRef<HTMLDivElement | null>(null);
  const bridgeRef = useRef<HTMLDivElement | null>(null);

  // Active featured shrine in the dominant theater viewport (default to Somnath or first available)
  const [activeSlug, setActiveSlug] = useState<string>("somnath");
  const [viewMode, setViewMode] = useState<"theater" | "grid">("theater");

  const activeShrine: Jyotirlinga = useMemo(() => {
    return jyotirlingas.find((j) => j.slug === activeSlug) || jyotirlingas[0];
  }, [activeSlug]);

  const liveCount = Object.values(statuses).filter((s) => s === "live").length;

  // Compute live & default URLs for all shrines
  const shrineUrls = useMemo(() => {
    const map: Record<string, { liveUrl: string | null; defaultUrl: string | null }> = {};
    for (const j of jyotirlingas) {
      const liveRaw = linksData?.[j.slug] ?? j.youtubeUrl;
      const defaultRaw = linksData?.[defaultKey(j.slug)] ?? j.defaultYoutubeUrl;
      const liveCheck = validateYoutubeUrl(liveRaw, {
        autoplay: true,
        mute: true,
        loop: true,
      });
      const defaultCheck = validateYoutubeUrl(defaultRaw, {
        autoplay: true,
        mute: true,
        loop: true,
      });
      map[j.slug] = {
        liveUrl: liveCheck.ok ? liveCheck.embedUrl : null,
        defaultUrl: defaultCheck.ok ? defaultCheck.embedUrl : null,
      };
    }
    return map;
  }, [linksData]);

  // Entrance & scroll choreography
  useGSAP(
    () => {
      const section = sectionRef.current;
      const header = headerRef.current;
      const featured = featuredStageRef.current;
      const selector = selectorStripRef.current;
      const bridge = bridgeRef.current;

      if (!section) return;

      if (prefersReducedMotion()) {
        gsap.set([header, featured, selector, bridge], {
          opacity: 1,
          visibility: "visible",
          clearProps: "transform",
        });
        return;
      }

      // Scroll-triggered graceful entry as user descends from Hero
      gsap.fromTo(
        header,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1.0,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        },
      );

      if (featured) {
        gsap.fromTo(
          featured,
          { opacity: 0, y: 35, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: featured,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          },
        );
      }

      if (selector) {
        gsap.fromTo(
          selector,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power2.out",
            scrollTrigger: {
              trigger: selector,
              start: "top 90%",
              toggleActions: "play none none reverse",
            },
          },
        );
      }

      if (bridge) {
        gsap.fromTo(
          bridge,
          { opacity: 0, y: 25 },
          {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: "power2.out",
            scrollTrigger: {
              trigger: bridge,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          },
        );
      }
    },
    { scope: sectionRef, dependencies: [lang, viewMode] },
  );

  const activeLoc = getLocalized(activeShrine, lang);
  const activeStatus = statuses[activeShrine.slug] ?? "recorded";
  const activeUrls = shrineUrls[activeShrine.slug] ?? { liveUrl: null, defaultUrl: null };
  const ls = LIVE_SECTION_STRINGS[lang] ?? LIVE_SECTION_STRINGS.en;

  return (
    <section
      ref={sectionRef}
      id="live-darshan"
      className="relative w-full bg-background pt-16 pb-24 overflow-hidden border-t border-border/10"
      aria-label="Live Temple Darshan"
    >
      {/* Background ambient sacred tone continuity */}
      <div className="pointer-events-none absolute inset-0 bg-radial-gradient from-primary/5 via-transparent to-transparent opacity-70 select-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header: Arrival into Sanctum Darshan */}
        <div ref={headerRef} className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/60 px-4 py-1.5 backdrop-blur-md">
            <Sparkles className="size-3.5 text-primary diya-flicker" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              {ls.sanctumPresence}
            </span>
          </div>

          <h2
            className={cn(
              "mt-5 text-3xl text-foreground sm:text-4xl lg:text-5xl overflow-visible",
              displayFontClassFor(lang),
              isEn
                ? "font-display font-bold tracking-tight leading-tight"
                : "tracking-normal leading-snug sm:leading-[1.28]",
            )}
          >
            {isEn ? (
              <>
                Live <span className="text-gradient-gold">Temple Darshan</span>
              </>
            ) : (
              t.liveTitle
            )}
          </h2>

          <p
            className={cn(
              "mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base",
              fontClass,
            )}
          >
            {isEn
              ? "Witness the continuous sacred aarti, pujas, and sanctum darshan directly from all twelve Jyotirlingas."
              : t.liveDesc}
          </p>

          {/* Action & Filter Controls Toolbar */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={watchAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-card/80"
            >
              <Play className="size-3.5 text-primary" />
              <span>{ls.watchAll12}</span>
            </button>

            <button
              type="button"
              onClick={watchSelected}
              disabled={selected.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-aarti px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-glow transition-all duration-200 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Play className="size-3.5" />
              <span>
                {ls.watchSelected}
                {selected.length > 0 ? ` (${toLocalDigits(selected.length, lang)})` : ""}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setLiveOnly((v) => !v)}
              aria-pressed={liveOnly}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all duration-200",
                liveOnly
                  ? "border-red-600 bg-red-600 text-white shadow-sm hover:bg-red-600/90"
                  : "border-border/60 bg-card text-foreground hover:bg-card/80",
              )}
            >
              <Radio className="size-3.5" />
              <span>{liveOnly ? ls.showingLiveOnly : ls.filterLiveOnly}</span>
              {liveCount > 0 ? ` (${toLocalDigits(liveCount, lang)})` : ""}
            </button>

            {/* View Mode Toggle (Dominant Theater vs Full 12 Grid) */}
            <div className="hidden sm:inline-flex items-center rounded-lg border border-border/60 bg-card p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("theater")}
                aria-pressed={viewMode === "theater"}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  viewMode === "theater"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
                title="Theater View"
              >
                <Eye className="size-3.5" />
                <span className="text-[11px]">{ls.featured}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-pressed={viewMode === "grid"}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  viewMode === "grid"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
                title="Grid View"
              >
                <Grid className="size-3.5" />
                <span className="text-[11px]">{ls.grid12}</span>
              </button>
            </div>

            {selected.length > 0 && (
              <button
                type="button"
                onClick={onClearSelected}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {ls.clear}
              </button>
            )}
          </div>
        </div>

        {/* DOMINANT THEATER VIEW (Default Editorial Hierarchy) */}
        {viewMode === "theater" && (
          <div className="space-y-8">
            {/* Featured Dominant Active Stream Stage */}
            <div
              ref={featuredStageRef}
              className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-primary/30 bg-card/90 shadow-2xl backdrop-blur-md"
            >
              <div className="relative aspect-video w-full bg-black">
                <DarshanTile
                  title={`${activeShrine.name} live darshan`}
                  liveUrl={activeUrls.liveUrl}
                  defaultUrl={activeUrls.defaultUrl}
                  onStatusChange={(s) => setStatus(activeShrine.slug, s)}
                />

                {/* Quick Multi-select checkbox */}
                <button
                  type="button"
                  onClick={() => toggleSelected(activeShrine.slug)}
                  aria-pressed={selected.includes(activeShrine.slug)}
                  aria-label={
                    selected.includes(activeShrine.slug)
                      ? `Deselect ${activeShrine.name}`
                      : `Select ${activeShrine.name}`
                  }
                  className={cn(
                    "absolute right-3 top-3 z-10 inline-flex size-8 items-center justify-center rounded-lg border text-xs font-semibold backdrop-blur-md transition-all shadow-md",
                    selected.includes(activeShrine.slug)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-white/40 bg-black/50 text-white hover:bg-black/70",
                  )}
                >
                  {selected.includes(activeShrine.slug) ? <Check className="size-4" /> : "+"}
                </button>
              </div>

              {/* Dominant Active Temple Details Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 bg-gradient-to-r from-card via-card/95 to-card/90 border-t border-border/40">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-primary">
                      {toLocalDigits(activeShrine.number, lang)}.
                    </span>
                    <h3
                      className={cn(
                        "text-lg sm:text-2xl text-foreground",
                        displayFontClassFor(lang),
                        isEn ? "font-bold font-display tracking-tight" : "tracking-normal",
                      )}
                    >
                      {activeLoc.name}
                    </h3>
                    <span
                      className={cn(
                        "rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-accent",
                        isEn ? "uppercase tracking-wider" : "normal-case tracking-normal",
                      )}
                    >
                      {activeShrine.deity}
                    </span>
                  </div>

                  <p
                    className={cn(
                      "flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm",
                      fontClass,
                    )}
                  >
                    <MapPin className="size-3.5 text-primary shrink-0" />
                    <span>
                      {activeLoc.location}, {activeLoc.state} • {activeShrine.river}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <Link
                    to="/jyotirlinga/$slug"
                    params={{ slug: activeShrine.slug }}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg bg-gradient-aarti px-4 py-2 text-xs sm:text-sm font-semibold text-primary-foreground shadow-glow transition-all duration-200 hover:brightness-105",
                      !isEn && fontClass,
                    )}
                  >
                    <span>
                      {isEn
                        ? `Explore ${activeShrine.name}`
                        : `${ls.explorePrefix ? ls.explorePrefix + " " : ""}${activeLoc.name}${ls.exploreSuffix ? " " + ls.exploreSuffix : ""}`}
                    </span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Interactive Shrine Selection Rail (12 Shrines) */}
            <div ref={selectorStripRef} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span
                  className={cn(
                    "text-xs font-semibold text-muted-foreground",
                    isEn ? "uppercase tracking-wider" : "normal-case tracking-normal",
                  )}
                >
                  {ls.selectShrineStream}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {toLocalDigits(jyotirlingas.length, lang)} {ls.shrinesCount}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {jyotirlingas.map((j) => {
                  const isActive = j.slug === activeSlug;
                  const isLive = statuses[j.slug] === "live";
                  const loc = getLocalized(j, lang);
                  const isSelected = selected.includes(j.slug);

                  if (liveOnly && !isLive) return null;

                  return (
                    <button
                      key={j.slug}
                      type="button"
                      onClick={() => setActiveSlug(j.slug)}
                      className={cn(
                        "group relative flex flex-col rounded-xl border p-2.5 text-left transition-all duration-200 bg-card/60 backdrop-blur-sm",
                        isActive
                          ? "border-primary bg-card ring-2 ring-primary/50 shadow-lg scale-[1.02]"
                          : "border-border/60 hover:border-primary/40 hover:bg-card/90",
                      )}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="font-mono text-[10px] text-primary font-bold">
                          {toLocalDigits(j.number, lang)}
                        </span>
                        {isLive ? (
                          <span className="inline-flex items-center gap-1 rounded bg-red-600/90 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                            <span className="size-1 rounded-full bg-white animate-pulse" />
                            Live
                          </span>
                        ) : (
                          <span className="text-[9px] text-muted-foreground/80 font-mono">
                            {ls.rec}
                          </span>
                        )}
                      </div>

                      <span
                        className={cn(
                          "text-xs font-bold truncate text-foreground group-hover:text-primary transition-colors",
                          displayFontClassFor(lang),
                          isEn && "font-display",
                        )}
                      >
                        {loc.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate">
                        {loc.state}
                      </span>

                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* FULL 12 GRID VIEW (Alternate Grid for Multi-stream browsing) */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {jyotirlingas.map((j) => {
              const urls = shrineUrls[j.slug] ?? { liveUrl: null, defaultUrl: null };
              const loc = getLocalized(j, lang);
              const isLive = statuses[j.slug] === "live";
              const isSelected = selected.includes(j.slug);
              if (liveOnly && !isLive) return null;

              return (
                <div
                  key={j.slug}
                  className={cn(
                    "relative overflow-hidden rounded-xl border bg-card shadow-elegant transition-all",
                    isSelected
                      ? "border-primary ring-2 ring-primary/60"
                      : "border-border/60 hover:border-primary/40",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleSelected(j.slug)}
                    aria-pressed={isSelected}
                    aria-label={isSelected ? `Deselect ${j.name}` : `Select ${j.name}`}
                    className={cn(
                      "absolute right-2 top-2 z-10 inline-flex size-7 items-center justify-center rounded-md border text-xs font-semibold backdrop-blur-sm transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-white/40 bg-black/40 text-white hover:bg-black/60",
                    )}
                  >
                    {isSelected ? <Check className="size-4" /> : ""}
                  </button>

                  <DarshanTile
                    title={`${j.name} live darshan`}
                    liveUrl={urls.liveUrl}
                    defaultUrl={urls.defaultUrl}
                    onStatusChange={(s) => setStatus(j.slug, s)}
                  />

                  <div className="flex items-center justify-between gap-2 p-3">
                    <div>
                      <h3
                        className={cn(
                          "text-sm font-semibold text-foreground",
                          displayFontClassFor(lang),
                          isEn ? "font-display" : "text-base",
                        )}
                      >
                        {toLocalDigits(j.number, lang)}. {loc.name}
                      </h3>
                      <p
                        className={cn(
                          "flex items-center gap-1 text-[11px] text-muted-foreground",
                          !isEn && cn("text-xs", fontClass),
                        )}
                      >
                        <MapPin className="size-3" /> {loc.location}, {loc.state}
                      </p>
                    </div>
                    <Link
                      to="/jyotirlinga/$slug"
                      params={{ slug: j.slug }}
                      className={cn(
                        "rounded-md bg-gradient-aarti px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow-glow",
                        !isEn && cn("text-xs", fontClass),
                      )}
                    >
                      {t.open}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PART 3: EDITORIAL BRIDGE TRANSITION INTO THE SACRED TWELVE */}
        <div
          ref={bridgeRef}
          className="relative mt-20 pt-12 text-center border-t border-border/20 max-w-3xl mx-auto"
        >
          <div className="inline-flex size-8 items-center justify-center rounded-full bg-primary/10 border border-primary/20 mb-4">
            <span className="text-primary font-display text-sm font-bold">ॐ</span>
          </div>

          <p
            className={cn(
              "text-xs font-semibold text-accent",
              isEn
                ? "font-display uppercase tracking-[0.3em]"
                : cn("normal-case tracking-normal", fontClass),
            )}
          >
            {ls.bridgeEyebrow}
          </p>

          <h3
            className={cn(
              "mt-3 text-2xl sm:text-3xl text-foreground overflow-visible",
              displayFontClassFor(lang),
              isEn
                ? "font-bold font-display tracking-tight leading-tight"
                : "tracking-normal leading-snug sm:leading-[1.28]",
            )}
          >
            {isEn ? (
              <>
                Twelve Sacred Abodes.{" "}
                <span className="text-gradient-gold">One Sacred Circuit.</span>
              </>
            ) : (
              ls.bridgeTitle
            )}
          </h3>

          <p
            className={cn(
              "mt-3 text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto",
              fontClass,
            )}
          >
            {ls.bridgeDesc}
          </p>
        </div>
      </div>
    </section>
  );
}
