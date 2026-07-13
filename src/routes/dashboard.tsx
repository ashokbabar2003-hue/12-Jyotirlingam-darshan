import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MapPin, Filter, Mountain, Compass, X, Home } from "lucide-react";
import { jyotirlingas, getLocalized } from "@/data/jyotirlingas";
import {
  jyotirlingaMeta,
  ZONES,
  DIFFICULTIES,
  type Zone,
  type Difficulty,
} from "@/data/jyotirlinga-meta";
import { useLanguage, toLocalDigits, type Lang } from "@/hooks/use-language";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      {
        title: "Locate Your Ideal Jyotirlingam — Filter by State, Zone & Trek Difficulty",
      },
      {
        name: "description",
        content:
          "Interactive dashboard for the 12 Jyotirlingas. Filter sacred Shiva temples by Indian state, regional zone, or pilgrimage difficulty.",
      },
      { property: "og:title", content: "Locate Your Ideal Jyotirlingam" },
      {
        property: "og:description",
        content: "Filter the 12 Jyotirlingas by state, regional zone and trek difficulty.",
      },
    ],
  }),
  component: Dashboard,
});

type DashboardStrings = {
  title: string;
  titleAccent: string;
  subtitle: string;
  shrinesMatching: string;
  totalSuffix: string;
  byZone: string;
  byDifficulty: string;
  stateLabel: string;
  zoneLabel: string;
  difficultyLabel: string;
  clearFilters: string;
  emptyState: string;
  elevation: string;
  backHome: string;
};

const DASHBOARD_STRINGS: Record<Lang, DashboardStrings> = {
  en: {
    title: "Locate Your Ideal",
    titleAccent: "Jyotirlingam",
    subtitle:
      "Explore the twelve sacred abodes of Lord Shiva. Filter by state, regional zone, or pilgrimage difficulty to plan your darshan.",
    shrinesMatching: "Shrines matching filters",
    totalSuffix: " / 12",
    byZone: "By zone",
    byDifficulty: "By difficulty",
    stateLabel: "State",
    zoneLabel: "Regional Zone",
    difficultyLabel: "Transit Difficulty",
    clearFilters: "Clear filters",
    emptyState: "No shrines match the selected filters. Try clearing one of them.",
    elevation: "Elevation ~{0} m",
    backHome: "Back to Home",
  },
  mr: {
    title: "तुमचे आदर्श",
    titleAccent: "ज्योतिर्लिंग शोधा",
    subtitle:
      "भगवान शिवांच्या बारा पवित्र ज्योतिर्लिंगांचे अन्वेषण करा. राज्य, प्रादेशिक विभाग किंवा तीर्थयात्रेच्या कठीणतेनुसार फिल्टर करा.",
    shrinesMatching: "फिल्टरशी जुळणारी मंदिरे",
    totalSuffix: " / १२",
    byZone: "विभागानुसार",
    byDifficulty: "कठीणतेनुसार",
    stateLabel: "राज्य",
    zoneLabel: "प्रादेशिक विभाग",
    difficultyLabel: "प्रवास कठीणता",
    clearFilters: "फिल्टर साफ करा",
    emptyState: "निवडलेल्या फिल्टरशी कोणतीही मंदिरे जुळत नाहीत. एक फिल्टर काढून टाकून पहा.",
    elevation: "उंची ~{0} मी",
    backHome: "मुख्यपृष्ठावर परत जा",
  },
  hi: {
    title: "अपना आदर्श",
    titleAccent: "ज्योतिर्लिंग खोजें",
    subtitle:
      "भगवान शिव के बारह पवित्र ज्योतिर्लिंगों का अन्वेषण करें। राज्य, क्षेत्रीय जोन या तीर्थयात्रा की कठिनाई के अनुसार फ़िल्टर करें।",
    shrinesMatching: "फ़िल्टर से मेल खाते मंदिर",
    totalSuffix: " / 12",
    byZone: "जोन के अनुसार",
    byDifficulty: "कठिनाई के अनुसार",
    stateLabel: "राज्य",
    zoneLabel: "क्षेत्रीय जोन",
    difficultyLabel: "यात्रा की कठिनाई",
    clearFilters: "फ़िल्टर साफ़ करें",
    emptyState: "चयनित फ़िल्टर से कोई मंदिर मेल नहीं खाता। किसी एक फ़िल्टर को हटाकर देखें।",
    elevation: "ऊँचाई ~{0} मी",
    backHome: "मुख्य पृष्ठ पर लौटें",
  },
  gu: {
    title: "તમારું આદર્શ",
    titleAccent: "જ્યોતિર્લિંગ શોધો",
    subtitle:
      "ભગવાન શિવનાં બાર પવિત્ર જ્યોતિર્લિંગોનું અન્વેષણ કરો. રાજ્ય, પ્રાદેશિક વિસ્તાર અથવા તીર્થયાત્રાની કઠિનાઈ અનુસાર ફિલ્ટર કરો.",
    shrinesMatching: "ફિલ્ટરને અનુરૂપ મંદિરો",
    totalSuffix: " / 12",
    byZone: "વિસ્તાર અનુસાર",
    byDifficulty: "કઠિનાઈ અનુસાર",
    stateLabel: "રાજ્ય",
    zoneLabel: "પ્રાદેશિક વિસ્તાર",
    difficultyLabel: "મુસાફરી કઠિનાઈ",
    clearFilters: "ફિલ્ટર સાફ કરો",
    emptyState: "પસંદ કરેલા ફિલ્ટર અનુરૂપ કોઈ મંદિર નથી. એક ફિલ્ટર દૂર કરીને જુઓ.",
    elevation: "ઊંચાઈ ~{0} મી",
    backHome: "મુખ્ય પૃષ્ઠ પર પાછા જાઓ",
  },
  te: {
    title: "మీ ఆదర్శ",
    titleAccent: "జ్యోతిర్లింగాన్ని కనుగొనండి",
    subtitle:
      "శివుడి పన్నెండు పవిత్ర జ్యోతిర్లింగాలను అన్వేషించండి. రాష్ట్రం, ప్రాంతీయ జోన్ లేదా తీర్థయాత్ర కష్టతరత్వం ప్రకారం ఫిల్టర్ చేయండి.",
    shrinesMatching: "ఫిల్టర్లకు సరిపోలిన ఆలయాలు",
    totalSuffix: " / 12",
    byZone: "జోన్ ప్రకారం",
    byDifficulty: "కష్టతరత్వం ప్రకారం",
    stateLabel: "రాష్ట్రం",
    zoneLabel: "ప్రాంతీయ జోన్",
    difficultyLabel: "ప్రయాణ కష్టతరత్వం",
    clearFilters: "ఫిల్టర్లను స్పష్టం చేయండి",
    emptyState: "ఎంచుకున్న ఫిల్టర్లకు ఆలయాలు సరిపోలలేదు. ఏదైనా ఫిల్టర్ తీసివేసి చూడండి.",
    elevation: "ఎత్తు ~{0} మీ",
    backHome: "హోమ్‌కు తిరిగి వెళ్ళండి",
  },
  ta: {
    title: "உங்கள் இதயத்திற்கு",
    titleAccent: "ஏற்ற ஜோதிர்லிங்கத்தைக் கண்டறியுங்கள்",
    subtitle:
      "சிவபெருமானின் பன்னிரண்டு புனித ஜோதிர்லிங்கங்களை ஆராயுங்கள். மாநிலம், பிராந்திய மண்டலம் அல்லது தீர்த்தயாத்திரை சிரமத்தின்படி வடிகட்டவும்.",
    shrinesMatching: "வடிப்பான்களுடன் பொருந்தும் கோயில்கள்",
    totalSuffix: " / 12",
    byZone: "மண்டலத்தின்படி",
    byDifficulty: "சிரமத்தின்படி",
    stateLabel: "மாநிலம்",
    zoneLabel: "பிராந்திய மண்டலம்",
    difficultyLabel: "பயண சிரமம்",
    clearFilters: "வடிப்பான்களை அழிக்கவும்",
    emptyState:
      "தேர்ந்தெடுக்கப்பட்ட வடிப்பான்களுடன் எந்த கோயிலும் பொருந்தவில்லை. ஒன்றை அகற்றிப் பாருங்கள்.",
    elevation: "உயரம் ~{0} மீ",
    backHome: "முகப்புக்குத் திரும்புக",
  },
};

const ALL_STATES = Array.from(new Set(jyotirlingas.map((j) => j.state))).sort();

const zoneLabels: Record<Lang, Record<Zone, string>> = {
  en: { North: "North", South: "South", East: "East", West: "West", Central: "Central" },
  mr: { North: "उत्तर", South: "दक्षिण", East: "पूर्व", West: "पश्चिम", Central: "मध्य" },
  hi: { North: "उत्तर", South: "दक्षिण", East: "पूर्व", West: "पश्चिम", Central: "मध्य" },
  gu: { North: "ઉત્તર", South: "દક્ષિણ", East: "પૂર્વ", West: "પશ્ચિમ", Central: "મધ્ય" },
  te: { North: "ఉత్తర", South: "దక్షిణ", East: "తూర్పు", West: "పడమర", Central: "మధ్య" },
  ta: { North: "வடக்கு", South: "தெற்கு", East: "கிழக்கு", West: "மேற்கு", Central: "மத்திய" },
};

const difficultyLabels: Record<Lang, Record<Difficulty, string>> = {
  en: { Easy: "Easy", Medium: "Medium", "Challenging Trek": "Challenging Trek" },
  mr: { Easy: "सरल", Medium: "मध्यम", "Challenging Trek": "कठिन पदयात्रा" },
  hi: { Easy: "सरल", Medium: "मध्यम", "Challenging Trek": "कठिन पदयात्रा" },
  gu: { Easy: "સરળ", Medium: "મધ્યમ", "Challenging Trek": "કઠિણ ટ્રેક" },
  te: { Easy: "సులభం", Medium: "మధ్యస్థం", "Challenging Trek": "సవాలుతరం ట్రెక్" },
  ta: { Easy: "எளிதானது", Medium: "நடுத்தரம்", "Challenging Trek": "சவாலான பயணம்" },
};

const stateLabels: Record<Lang, Record<string, string>> = {
  en: {},
  mr: {},
  hi: {},
  gu: {},
  te: {},
  ta: {},
};

jyotirlingas.forEach((j) => {
  const labels = getLocalized(j, "en");
  stateLabels.en[j.state] = labels.state;
  const mr = getLocalized(j, "mr");
  stateLabels.mr[j.state] = mr.state;
  (["hi", "gu", "te", "ta"] as Lang[]).forEach((l) => {
    stateLabels[l][j.state] = getLocalized(j, l).state;
  });
});

const difficultyClass: Record<Difficulty, string> = {
  Easy: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "Challenging Trek": "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

const zoneClass: Record<Zone, string> = {
  North: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  South: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  East: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  West: "bg-teal-500/15 text-teal-300 border-teal-500/30",
  Central: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
};

function Chip({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-border/60 bg-card/60 text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}

function Dashboard() {
  const { lang, isEn, fontClass } = useLanguage();
  const t = DASHBOARD_STRINGS[lang];
  const [states, setStates] = useState<Set<string>>(new Set());
  const [zones, setZones] = useState<Set<Zone>>(new Set());
  const [difficulties, setDifficulties] = useState<Set<Difficulty>>(new Set());

  const toggle = <T,>(set: Set<T>, value: T, apply: (s: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    apply(next);
  };

  const filtered = useMemo(() => {
    return jyotirlingas.filter((j) => {
      const meta = jyotirlingaMeta[j.slug];
      if (states.size && !states.has(j.state)) return false;
      if (zones.size && !zones.has(meta.zone)) return false;
      if (difficulties.size && !difficulties.has(meta.difficulty)) return false;
      return true;
    });
  }, [states, zones, difficulties]);

  const totals = useMemo(() => {
    const byZone = ZONES.map((z) => ({
      key: z,
      count: filtered.filter((j) => jyotirlingaMeta[j.slug].zone === z).length,
    }));
    const byDiff = DIFFICULTIES.map((d) => ({
      key: d,
      count: filtered.filter((j) => jyotirlingaMeta[j.slug].difficulty === d).length,
    }));
    return { byZone, byDiff };
  }, [filtered]);

  const anyActive = states.size + zones.size + difficulties.size > 0;

  const formatElevation = (m: number) => t.elevation.replace("{0}", toLocalDigits(m, lang));
  const totalSuffix = ` / ${toLocalDigits(12, lang)}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Link
        to="/"
        className={cn(
          "mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
          fontClass,
        )}
      >
        <Home className="size-4" /> {t.backHome}
      </Link>

      <header className="mb-8 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="min-w-0">
          <h1
            className={cn(
              "text-3xl font-bold text-foreground sm:text-4xl",
              isEn ? "font-display" : fontClass,
            )}
          >
            {t.title} <span className="text-gradient-gold">{t.titleAccent}</span>
          </h1>
          <p
            className={cn(
              "mt-2 max-w-2xl text-sm text-muted-foreground",
              !isEn && cn("text-base", fontClass),
            )}
          >
            {t.subtitle}
          </p>
        </div>
        {anyActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStates(new Set());
              setZones(new Set());
              setDifficulties(new Set());
            }}
          >
            <X className="size-4" />
            <span className={cn(!isEn && fontClass)}>{t.clearFilters}</span>
          </Button>
        )}
      </header>

      {/* Stats strip */}
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <Card className="border-border/60 bg-card/60">
          <CardContent className="flex items-center gap-3 p-4">
            <Filter className="size-5 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">
                {toLocalDigits(filtered.length, lang)}
                <span className="text-sm font-normal text-muted-foreground">{totalSuffix}</span>
              </p>
              <p className={cn("text-xs text-muted-foreground", !isEn && cn("text-sm", fontClass))}>
                {t.shrinesMatching}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Compass className="size-4" /> {t.byZone}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {totals.byZone.map((b) => (
                <span
                  key={b.key}
                  className={cn(
                    "rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                    zoneClass[b.key],
                  )}
                >
                  {zoneLabels[lang][b.key]} · {toLocalDigits(b.count, lang)}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Mountain className="size-4" /> {t.byDifficulty}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {totals.byDiff.map((b) => (
                <span
                  key={b.key}
                  className={cn(
                    "rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                    difficultyClass[b.key],
                  )}
                >
                  {difficultyLabels[lang][b.key]} · {toLocalDigits(b.count, lang)}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-8 grid gap-4 rounded-xl border border-border/60 bg-card/40 p-4 lg:grid-cols-3">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.stateLabel}
          </p>
          <div className="flex flex-wrap gap-2">
            {ALL_STATES.map((s) => (
              <Chip
                key={s}
                active={states.has(s)}
                onClick={() => toggle(states, s, setStates)}
                className={cn(!isEn && fontClass)}
              >
                {stateLabels[lang][s] ?? s}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.zoneLabel}
          </p>
          <div className="flex flex-wrap gap-2">
            {ZONES.map((z) => (
              <Chip
                key={z}
                active={zones.has(z)}
                onClick={() => toggle(zones, z, setZones)}
                className={cn(!isEn && fontClass)}
              >
                {zoneLabels[lang][z]}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.difficultyLabel}
          </p>
          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map((d) => (
              <Chip
                key={d}
                active={difficulties.has(d)}
                onClick={() => toggle(difficulties, d, setDifficulties)}
                className={cn(!isEn && fontClass)}
              >
                {difficultyLabels[lang][d]}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-12 text-center">
          <p className={cn("text-sm text-muted-foreground", !isEn && cn("text-base", fontClass))}>
            {t.emptyState}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((j) => {
            const meta = jyotirlingaMeta[j.slug];
            const loc = getLocalized(j, lang);
            return (
              <Link
                key={j.slug}
                to="/jyotirlinga/$slug"
                params={{ slug: j.slug }}
                className="group overflow-hidden rounded-xl border border-border/60 bg-card shadow-elegant transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={j.image}
                    alt={`${j.name} Jyotirlinga temple`}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                  <span className="absolute left-3 top-3 flex size-8 items-center justify-center rounded-full bg-gradient-aarti text-sm font-bold text-primary-foreground shadow-glow">
                    {toLocalDigits(j.number, lang)}
                  </span>
                  <div className="absolute right-3 top-3 flex flex-col items-end gap-1">
                    <span
                      className={cn(
                        "rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                        zoneClass[meta.zone],
                        !isEn && fontClass,
                      )}
                    >
                      {zoneLabels[lang][meta.zone]}
                    </span>
                    <span
                      className={cn(
                        "rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                        difficultyClass[meta.difficulty],
                        !isEn && fontClass,
                      )}
                    >
                      {difficultyLabels[lang][meta.difficulty]}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3
                    className={cn(
                      "text-lg font-semibold text-foreground group-hover:text-primary",
                      isEn ? "font-display" : fontClass,
                    )}
                  >
                    {loc.name}
                  </h3>
                  <p
                    className={cn(
                      "mt-1 flex items-center gap-1 text-xs text-muted-foreground",
                      !isEn && cn("text-sm", fontClass),
                    )}
                  >
                    <MapPin className="size-3" /> {loc.location}, {loc.state}
                  </p>
                  <p
                    className={cn(
                      "mt-2 text-[11px] text-muted-foreground",
                      !isEn && cn("text-xs", fontClass),
                    )}
                  >
                    {formatElevation(meta.elevation)} · {j.river}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
