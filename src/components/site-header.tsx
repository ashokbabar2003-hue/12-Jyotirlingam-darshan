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
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage, LANGUAGES, type Lang } from "@/hooks/use-language";
import { useSeason, SEASONS, type SeasonMode } from "@/hooks/use-season";
import { useAudioChant } from "@/hooks/use-audio-chant";
import { supabase } from "@/integrations/supabase/client";

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
  mr: { playing: "जप सुरू आहे", paused: "जप थांबवला", loading: "लोड होत आहे..." },
  hi: { playing: "मंत्र जारी है", paused: "मंत्र मौन", loading: "लोड हो रहा है..." },
  gu: { playing: "મંત્ર ચાલુ છે", paused: "મંત્ર બંધ છે", loading: "લોડ થઈ રહ્યું છે..." },
  te: {
    playing: "మంత్రం ప్లే అవుతోంది",
    paused: "మంత్రం నిలిపివేయబడింది",
    loading: "లోడ్ అవుతోంది...",
  },
  ta: {
    playing: "மந்திரம் ஒலிக்கிறது",
    paused: "மந்திரம் நிறுத்தப்பட்டது",
    loading: "ஏற்றப்படுகிறது...",
  },
};

export function SiteHeader() {
  const { user } = useAuth();
  const { lang, setLang, fontClass } = useLanguage();
  const { season, mode: seasonMode, setMode: setSeasonMode } = useSeason();
  const { playing, loading, volume, setVolume, toggle } = useAudioChant();
  const navigate = useNavigate();

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];
  const currentSeason = SEASONS.find((s) => s.code === season) ?? SEASONS[0];

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 sm:px-4">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <Flame className="size-6 shrink-0 text-primary diya-flicker" />
          <span className="truncate font-display text-base font-semibold text-gradient-gold sm:text-lg">
            12 Jyotirlinga Darshan
          </span>
        </Link>
        <nav className="flex shrink-0 items-center gap-1.5 sm:gap-2">
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
            className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground lg:hidden"
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
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition-all duration-300",
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
                <span className={cn("font-medium", fontClass)}>{PRAY_LABEL[lang]}</span>
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
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/70 px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-card"
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Select language"
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/70 px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-card"
              >
                <Languages className="size-3.5 shrink-0 text-muted-foreground" />
                <span className={cn("hidden max-w-[7rem] truncate sm:inline", fontClass)}>
                  {current.label}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem]">
              <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Language
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {LANGUAGES.map((l) => (
                <DropdownMenuItem
                  key={l.code}
                  onSelect={() => setLang(l.code as Lang)}
                  className={cn("cursor-pointer text-sm", l.fontClass)}
                >
                  <span className="flex-1">{l.label}</span>
                  {lang === l.code && <Check className="size-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <>
              <Link
                to="/admin"
                className="hidden rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
              >
                Manage
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut} aria-label="Sign out">
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </>
          ) : (
            <Button asChild variant="hero" size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
