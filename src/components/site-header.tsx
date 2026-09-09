import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Flame,
  LogOut,
  Languages,
  Check,
  MapPin,
  Leaf,
  Volume2,
  VolumeX,
  Loader2,
  Sparkles,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Compass,
  LogIn,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage, type Lang, LANGUAGES } from "@/hooks/use-language";
import { useSeason, SEASONS, type SeasonMode } from "@/hooks/use-season";
import { useAudioChant } from "@/hooks/use-audio-chant";
import { useLenis } from "@/hooks/use-lenis";
import { LanguageSelector } from "@/components/LanguageSelector";
import { getLanguageOptionFontClass, getLanguageOptionStyle } from "@/lib/language-utils";
import { jyotirlingas, getLocalized } from "@/data/jyotirlingas";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const SITE_TITLE: Record<Lang, string> = {
  en: "12 Jyotirlinga Darshan",
  mr: "१२ ज्योतिर्लिंग दर्शन",
  hi: "१२ ज्योतिर्लिंग दर्शन",
  gu: "૧૨ જ્યોતિર્લિંગ દર્શન",
  te: "౧౨ జ్యోతిర్లింగ దర్శనం",
  ta: "௧௨ ஜோதிர்லிங்க தரிசனம்",
};

const DASHBOARD_LABEL: Record<Lang, string> = {
  en: "Locate Your Ideal Jyotirlingam",
  mr: "तुमचे आदर्श ज्योतिर्लिंग शोधा",
  hi: "अपना आदर्श ज्योतिर्लिंग खोजें",
  gu: "તમારું આદર્શ જ્યોતિર્લિંગ શોધો",
  te: "మీ ఆదర్శ జ్యోతిర్లింగాన్ని కనుగొనండి",
  ta: "உங்கள் இதயத்திற்கு ஏற்ற ஜோதிர்லிங்கத்தைக் கண்டறியுங்கள்",
};

const PRAY_LABEL: Record<Lang, string> = {
  en: "Pray With Us",
  mr: "आमच्यासोबत प्रार्थना करा",
  hi: "हमारे साथ प्रार्थना करें",
  gu: "અમારી સાથે પ્રાર્થના કરો",
  te: "మాతో ప్రార్థించండి",
  ta: "எங்களுடன் பிரார்த்தனை செய்யுங்கள்",
};

const CHANT_STATUS: Record<Lang, { playing: string; paused: string; loading: string }> = {
  en: { playing: "Chant Playing", paused: "Chant Muted", loading: "Loading..." },
  mr: { playing: "मंत्र सुरू आहे", paused: "मंत्र शांत", loading: "लोड होत आहे..." },
  hi: { playing: "मंत्र जारी है", paused: "मंत्र मौन", loading: "लोड हो रहा है..." },
  gu: { playing: "મંત્ર ચાલુ છે", paused: "મંત્ર બંધ છે", loading: "લોડ થઈ રહ્યું છે..." },
  te: {
    playing: "మంత్రం ప్లే అవుతోంది",
    paused: "మంత్రం నిలిపివేయబడింది",
    loading: "లోડ అవుతోంది...",
  },
  ta: {
    playing: "மந்திரம் ஒலிக்கிறது",
    paused: "மந்திரம் நிறுத்தப்பட்டது",
    loading: "ஏற்றப்படுகிறது...",
  },
};

type MobileSection = "explore" | "language" | "audio" | "appearance";

export function SiteHeader() {
  const { user, signOut: authSignOut } = useAuth();
  const { lang, setLang, fontClass } = useLanguage();
  const { season, mode: seasonMode, setMode: setSeasonMode } = useSeason();
  const { playing, loading, volume, setVolume, toggle } = useAudioChant();
  const { lenis } = useLenis();
  const navigate = useNavigate();

  const [isMounted, setIsMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<MobileSection | null>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close mobile menu when viewport expands to wide mobile/desktop (breakpoint: >= 600px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 600) {
        setMobileOpen(false);
        setExpandedSection(null);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile menu on Escape key press
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setExpandedSection(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  // Lock body scroll and pause Lenis while mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      lenis?.stop();
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
        lenis?.start();
      };
    }
  }, [mobileOpen, lenis]);

  const currentSeason = SEASONS.find((s) => s.code === season) ?? SEASONS[0];

  const toggleSection = (section: MobileSection) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const handleNavigationAction = () => {
    setMobileOpen(false);
    setExpandedSection(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    }
  };

  const handleLanguageChange = (newLang: Lang) => {
    setLang(newLang);
    setMobileOpen(false);
    setExpandedSection(null);
    navigate({ to: "/" });
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    }
  };

  const handleSignOut = async () => {
    setMobileOpen(false);
    setExpandedSection(null);
    await authSignOut();
    navigate({ to: "/", replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    }
  };

  const activeLangObj = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-1.5 sm:gap-2 px-3 sm:px-4">
        {/* Left: Brand Logo & Title */}
        <a
          href="/"
          onClick={() => setMobileOpen(false)}
          className="flex min-w-0 shrink items-center gap-2 mr-2 overflow-hidden"
        >
          <Flame className="size-6 shrink-0 text-primary diya-flicker" />
          <span
            className={cn(
              "truncate text-sm sm:text-base md:text-lg font-semibold text-gradient-gold",
              lang === "en" ? "font-display" : fontClass,
            )}
          >
            {SITE_TITLE[lang]}
          </span>
        </a>

        {/* Navigation (Active on sm: >= 600px wide mobile and md: >= 768px desktop) */}
        <nav className="hidden sm:flex shrink-0 items-center gap-1 sm:gap-1.5 md:gap-2">
          <Link
            to="/dashboard"
            className={cn(
              "hidden rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground lg:inline-block",
              fontClass,
            )}
            activeProps={{ className: "text-foreground" }}
          >
            {DASHBOARD_LABEL[lang]}
          </Link>
          <Link
            to="/dashboard"
            aria-label={DASHBOARD_LABEL[lang]}
            className="inline-flex size-8 sm:size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground lg:hidden shrink-0"
          >
            <MapPin className="size-4" />
          </Link>

          {/* Pray With Us Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={PRAY_LABEL[lang]}
                title={PRAY_LABEL[lang]}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 sm:gap-1.5 rounded-full border px-2 sm:px-2.5 py-1.5 text-xs font-semibold transition-all duration-300",
                  playing
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-glow"
                    : "border-border/60 bg-card/70 text-foreground hover:bg-card",
                )}
              >
                {loading ? (
                  <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />
                ) : playing ? (
                  <Flame className="size-3.5 shrink-0 text-primary diya-flicker animate-pulse" />
                ) : (
                  <Sparkles className="size-3.5 shrink-0 text-muted-foreground" />
                )}
                <span className={cn("hidden md:inline font-medium whitespace-nowrap", fontClass)}>
                  {PRAY_LABEL[lang]}
                </span>
                <span
                  className={cn(
                    "inline md:hidden font-medium text-xs whitespace-nowrap",
                    fontClass,
                  )}
                >
                  {lang === "en" ? "Pray" : PRAY_LABEL[lang]}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {playing ? CHANT_STATUS[lang].playing : CHANT_STATUS[lang].paused}
                </span>
                {loading && <Loader2 className="size-3.5 animate-spin text-primary" />}
              </div>

              {/* Toggle Play/Pause button */}
              <Button
                variant={playing ? "default" : "outline"}
                size="sm"
                className="w-full flex items-center justify-center gap-2"
                onClick={toggle}
              >
                {playing ? (
                  <>
                    <VolumeX className="size-4" />
                    Mute Chant
                  </>
                ) : (
                  <>
                    <Volume2 className="size-4" />
                    Play Chant
                  </>
                )}
              </Button>

              {/* Volume Slider Section */}
              <div className="space-y-1.5 pt-1" onPointerDown={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                  <span>Volume</span>
                  <span>{Math.round(volume * 100)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setVolume(volume > 0 ? 0 : 0.55)}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {volume > 0 ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
                  </button>
                  <Slider
                    value={[Math.round(volume * 100)]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([v]) => setVolume((v ?? 0) / 100)}
                    aria-label="Chant volume"
                    className="flex-1"
                  />
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Prakruti season: ${currentSeason.english}`}
                title={`Prakruti · ${currentSeason.english}`}
                className="inline-flex shrink-0 items-center gap-1 sm:gap-1.5 rounded-full border border-border/60 bg-card/70 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-card"
              >
                <Leaf className="size-3.5 shrink-0 text-primary" />
                <span className="hidden font-devanagari sm:inline">{currentSeason.label}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[14rem]">
              <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Prakruti · Ritu (Season)
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setSeasonMode("auto")}
                className="cursor-pointer text-sm"
              >
                <span className="flex-1">
                  Auto
                  <span className="ml-1 text-xs text-muted-foreground">
                    (now: {currentSeason.english})
                  </span>
                </span>
                {seasonMode === "auto" && <Check className="size-3.5 text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {SEASONS.map((s) => (
                <DropdownMenuItem
                  key={s.code}
                  onSelect={() => setSeasonMode(s.code as SeasonMode)}
                  className="cursor-pointer text-sm"
                >
                  <span className="flex-1">
                    <span className="font-devanagari">{s.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {s.english} · {s.description}
                    </span>
                  </span>
                  {seasonMode === s.code && <Check className="size-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <LanguageSelector className="shrink-0" />

          {!isMounted ? (
            <Button
              asChild
              variant="hero"
              size="sm"
              className="shrink-0 whitespace-nowrap px-2.5 sm:px-3 text-xs sm:text-sm"
            >
              <a href="/auth">Sign in</a>
            </Button>
          ) : user ? (
            <>
              <Link
                to="/admin"
                className="hidden rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground lg:inline-block"
              >
                Manage
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                aria-label="Sign out"
                className="shrink-0"
              >
                <LogOut className="size-4" />
                <span className="hidden md:inline">Sign out</span>
              </Button>
            </>
          ) : (
            <Button
              asChild
              variant="hero"
              size="sm"
              className="shrink-0 whitespace-nowrap px-2.5 sm:px-3 text-xs sm:text-sm"
            >
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </nav>

        {/* Right: Mobile Compact Hamburger / Menu Button (< sm: 600px screens) */}
        <div className="flex items-center sm:hidden">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              setMobileOpen((prev) => {
                const next = !prev;
                if (!next) setExpandedSection(null);
                return next;
              });
            }}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            className="size-10 rounded-lg border-border/60 bg-card/70 text-foreground transition-colors hover:bg-card focus-visible:ring-1 active:scale-95"
          >
            {mobileOpen ? (
              <X className="size-5 text-foreground transition-transform duration-200" />
            ) : (
              <Menu className="size-5 text-foreground transition-transform duration-200" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer & Backdrop rendered via Portal directly into document.body
          This prevents fixed positioning and scroll trapping issues caused by backdrop-blur
          or sticky header containing blocks. */}
      {isMounted &&
        mobileOpen &&
        createPortal(
          <div className="sm:hidden">
            {/* Backdrop Overlay */}
            <div
              className="fixed inset-0 top-16 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in-0 motion-reduce:animate-none"
              onClick={() => {
                setMobileOpen(false);
                setExpandedSection(null);
              }}
              aria-hidden="true"
            />

            {/* Interactive Accordion Menu Drawer */}
            <div
              ref={menuContainerRef}
              data-lenis-prevent="true"
              className="fixed inset-x-0 top-16 z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-b border-border/60 bg-background/98 p-3.5 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-2 fade-in-0 duration-200 motion-reduce:animate-none"
              style={{
                overscrollBehavior: "contain",
                WebkitOverflowScrolling: "touch",
                touchAction: "pan-y",
              }}
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              <div className="mx-auto max-w-lg space-y-2.5 pb-4">
                {/* 1. Accordion Item: Explore Jyotirlingas */}
                <div className="overflow-hidden rounded-xl border border-border/60 bg-card/70 transition-colors">
                  <button
                    type="button"
                    onClick={() => toggleSection("explore")}
                    aria-expanded={expandedSection === "explore"}
                    className="flex min-h-[52px] w-full items-center justify-between px-3.5 py-3 text-left transition-colors hover:bg-muted/40 active:bg-muted/60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Compass className="size-5" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className={cn("text-sm font-semibold text-foreground", fontClass)}>
                          {lang === "en" ? "Explore Jyotirlingas" : DASHBOARD_LABEL[lang]}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          12 Sacred Shrines & Darshan Map
                        </span>
                      </div>
                    </div>
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                        expandedSection === "explore" && "rotate-180 text-primary",
                      )}
                    />
                  </button>

                  {expandedSection === "explore" && (
                    <div className="border-t border-border/50 bg-background/60 p-3 space-y-3 animate-in fade-in-0 duration-150">
                      {/* Interactive Map & Recommendation Hub */}
                      <Link
                        to="/dashboard"
                        onClick={handleNavigationAction}
                        className="flex min-h-[46px] items-center justify-between rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5 transition-all hover:bg-primary/20 active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-2.5">
                          <MapPin className="size-4 text-primary shrink-0" />
                          <div className="flex flex-col text-left">
                            <span className="text-xs font-semibold text-foreground">
                              {DASHBOARD_LABEL[lang]}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Interactive distance calculator & pilgrim guide
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="size-4 text-primary shrink-0" />
                      </Link>

                      {/* 12 Shrines Touch List */}
                      <div>
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          12 Sacred Shrines · द्वादश ज्योतिर्लिंग
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {jyotirlingas.map((j) => {
                            const localized = getLocalized(j, lang);
                            return (
                              <Link
                                key={j.slug}
                                to="/$slug"
                                params={{ slug: j.slug }}
                                onClick={handleNavigationAction}
                                className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/60 p-2 text-left transition-all hover:border-primary/40 hover:bg-card active:scale-[0.98]"
                              >
                                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                                  {j.number}
                                </span>
                                <div className="flex min-w-0 flex-col">
                                  <span
                                    className={cn(
                                      "truncate text-xs font-semibold text-foreground",
                                      fontClass,
                                    )}
                                  >
                                    {localized.name}
                                  </span>
                                  <span className="truncate text-[10px] text-muted-foreground">
                                    {localized.state}
                                  </span>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Accordion Item: Language Selector */}
                <div className="overflow-hidden rounded-xl border border-border/60 bg-card/70 transition-colors">
                  <button
                    type="button"
                    onClick={() => toggleSection("language")}
                    aria-expanded={expandedSection === "language"}
                    className="flex min-h-[52px] w-full items-center justify-between px-3.5 py-3 text-left transition-colors hover:bg-muted/40 active:bg-muted/60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Languages className="size-5" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-semibold text-foreground">
                          Language · भाषा
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Active:{" "}
                          <span
                            className={cn(
                              "font-semibold text-primary",
                              getLanguageOptionFontClass(lang),
                            )}
                            style={getLanguageOptionStyle(lang)}
                          >
                            {activeLangObj.label}
                          </span>
                        </span>
                      </div>
                    </div>
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                        expandedSection === "language" && "rotate-180 text-primary",
                      )}
                    />
                  </button>

                  {expandedSection === "language" && (
                    <div className="border-t border-border/50 bg-background/60 p-3 space-y-2 animate-in fade-in-0 duration-150">
                      <p className="text-[11px] text-muted-foreground">
                        Select a language — returns directly to Home in the chosen language:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {LANGUAGES.map((l) => {
                          const isSelected = lang === l.code;
                          const fontCls = getLanguageOptionFontClass(l.code);
                          const fontStyle = getLanguageOptionStyle(l.code);
                          return (
                            <button
                              key={l.code}
                              type="button"
                              onClick={() => handleLanguageChange(l.code)}
                              className={cn(
                                "flex min-h-[46px] items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all active:scale-[0.98]",
                                isSelected
                                  ? "border-primary bg-primary/15 font-semibold text-primary shadow-xs"
                                  : "border-border/60 bg-card/60 text-foreground hover:bg-card hover:text-foreground",
                                fontCls,
                              )}
                              style={fontStyle}
                            >
                              <span lang={l.code}>{l.label}</span>
                              {isSelected && <Check className="size-3.5 shrink-0 text-primary" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Accordion Item: Chant & Audio */}
                <div className="overflow-hidden rounded-xl border border-border/60 bg-card/70 transition-colors">
                  <button
                    type="button"
                    onClick={() => toggleSection("audio")}
                    aria-expanded={expandedSection === "audio"}
                    className="flex min-h-[52px] w-full items-center justify-between px-3.5 py-3 text-left transition-colors hover:bg-muted/40 active:bg-muted/60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        {loading ? (
                          <Loader2 className="size-5 animate-spin" />
                        ) : playing ? (
                          <Flame className="size-5 diya-flicker text-primary" />
                        ) : (
                          <Volume2 className="size-5" />
                        )}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className={cn("text-sm font-semibold text-foreground", fontClass)}>
                          {PRAY_LABEL[lang]}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {loading
                            ? CHANT_STATUS[lang].loading
                            : playing
                              ? CHANT_STATUS[lang].playing
                              : CHANT_STATUS[lang].paused}
                        </span>
                      </div>
                    </div>
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                        expandedSection === "audio" && "rotate-180 text-primary",
                      )}
                    />
                  </button>

                  {expandedSection === "audio" && (
                    <div className="border-t border-border/50 bg-background/60 p-3.5 space-y-3.5 animate-in fade-in-0 duration-150">
                      {/* Play / Mute Chant Button */}
                      <Button
                        type="button"
                        variant={playing ? "default" : "outline"}
                        size="lg"
                        className="w-full min-h-[46px] flex items-center justify-center gap-2 font-medium"
                        onClick={toggle}
                      >
                        {playing ? (
                          <>
                            <VolumeX className="size-4" />
                            Mute Chant
                          </>
                        ) : (
                          <>
                            <Volume2 className="size-4" />
                            Play Sacred Chant
                          </>
                        )}
                      </Button>

                      {/* Volume Slider */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                          <span>Volume</span>
                          <span>{Math.round(volume * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setVolume(volume > 0 ? 0 : 0.55)}
                            aria-label="Toggle mute"
                            className="p-1 text-muted-foreground transition-colors hover:text-primary"
                          >
                            {volume > 0 ? (
                              <Volume2 className="size-4" />
                            ) : (
                              <VolumeX className="size-4" />
                            )}
                          </button>
                          <Slider
                            value={[Math.round(volume * 100)]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={([v]) => setVolume((v ?? 0) / 100)}
                            aria-label="Chant volume"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Accordion Item: Appearance · Prakruti Season */}
                <div className="overflow-hidden rounded-xl border border-border/60 bg-card/70 transition-colors">
                  <button
                    type="button"
                    onClick={() => toggleSection("appearance")}
                    aria-expanded={expandedSection === "appearance"}
                    className="flex min-h-[52px] w-full items-center justify-between px-3.5 py-3 text-left transition-colors hover:bg-muted/40 active:bg-muted/60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Leaf className="size-5" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-semibold text-foreground">
                          Appearance · Prakruti Ritu
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Current:{" "}
                          <span className="font-devanagari font-semibold text-primary">
                            {currentSeason.label}
                          </span>{" "}
                          ({currentSeason.english})
                        </span>
                      </div>
                    </div>
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                        expandedSection === "appearance" && "rotate-180 text-primary",
                      )}
                    />
                  </button>

                  {expandedSection === "appearance" && (
                    <div className="border-t border-border/50 bg-background/60 p-3 space-y-2 animate-in fade-in-0 duration-150">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSeasonMode("auto")}
                          className={cn(
                            "flex min-h-[46px] flex-col justify-center rounded-lg border px-3 py-2 text-left text-xs transition-all active:scale-[0.98]",
                            seasonMode === "auto"
                              ? "border-primary bg-primary/15 font-semibold text-primary"
                              : "border-border/60 bg-card/60 text-foreground hover:bg-card",
                          )}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-semibold">Auto</span>
                            {seasonMode === "auto" && <Check className="size-3 text-primary" />}
                          </div>
                          <span className="text-[10px] text-muted-foreground truncate">
                            {currentSeason.english}
                          </span>
                        </button>
                        {SEASONS.map((s) => {
                          const isSelected = seasonMode === s.code;
                          return (
                            <button
                              key={s.code}
                              type="button"
                              onClick={() => setSeasonMode(s.code as SeasonMode)}
                              className={cn(
                                "flex min-h-[46px] flex-col justify-center rounded-lg border px-3 py-2 text-left text-xs transition-all active:scale-[0.98]",
                                isSelected
                                  ? "border-primary bg-primary/15 font-semibold text-primary"
                                  : "border-border/60 bg-card/60 text-foreground hover:bg-card",
                              )}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="font-devanagari font-semibold">{s.label}</span>
                                {isSelected && <Check className="size-3 text-primary" />}
                              </div>
                              <span className="text-[10px] text-muted-foreground truncate">
                                {s.english}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Account / Sign In / Manage */}
                <div className="pt-1">
                  {!isMounted ? (
                    <Button
                      asChild
                      variant="hero"
                      size="lg"
                      className="w-full min-h-[48px] text-base"
                    >
                      <a href="/auth" onClick={handleNavigationAction}>
                        Sign in
                      </a>
                    </Button>
                  ) : user ? (
                    <div className="space-y-2 rounded-xl border border-border/60 bg-card/70 p-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="truncate max-w-[200px]">{user.email ?? "Devotee"}</span>
                        <span className="font-medium text-primary">Signed In</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          asChild
                          variant="outline"
                          size="lg"
                          className="min-h-[44px] text-foreground"
                        >
                          <Link to="/admin" onClick={handleNavigationAction}>
                            Manage
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="lg"
                          onClick={handleSignOut}
                          className="min-h-[44px] text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <LogOut className="mr-2 size-4" />
                          Sign out
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Link
                      to="/auth"
                      onClick={handleNavigationAction}
                      className="flex min-h-[48px] w-full items-center justify-between rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-primary transition-all hover:bg-primary/20 active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-2.5">
                        <LogIn className="size-4 shrink-0" />
                        <span className="text-sm font-semibold">Sign in / Create Account</span>
                      </div>
                      <ChevronRight className="size-4 shrink-0" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </header>
  );
}
