import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useState } from "react";
import { Flame, MapPin, Check, Play, Radio } from "lucide-react";

import { jyotirlingas, getLocalized } from "@/data/jyotirlingas";
import { getDarshanLinks } from "@/lib/darshan.functions";
import { validateYoutubeUrl } from "@/lib/youtube";
import { cn } from "@/lib/utils";
import { DarshanTile, type DarshanStatus } from "@/components/darshan-tile";
import { useLanguage, toLocalDigits, type Lang } from "@/hooks/use-language";
import heroImg from "@/assets/hero-aarti.jpg";

type UIStrings = {
  tagline: string;
  heroTitlePre: string;
  heroTitleHi: string;
  heroDesc: string;
  cta: string;
  liveTitle: string;
  liveDesc: string;
  sacredTitle: string;
  sacredDesc: string;
  open: string;
};

const STRINGS: Record<Lang, UIStrings> = {
  en: {
    tagline: "Har Har Mahadev",
    heroTitlePre: "The Twelve",
    heroTitleHi: "Jyotirlingas",
    heroDesc:
      "Embark on a sacred darshan of all twelve self-manifested abodes of Lord Shiva. Watch live aarti, gaze upon each temple, and share the feelings of your pilgrimage.",
    cta: "Begin the Darshan",
    liveTitle: "All 12 Live Darshan",
    liveDesc: "Watch every Jyotirlinga's live stream at once.",
    sacredTitle: "The Sacred Twelve",
    sacredDesc: "Tap any shrine to enter its darshan, live aarti, gallery and devotee stories.",
    open: "Open",
  },
  mr: {
    tagline: "हर हर महादेव",
    heroTitlePre: "बारा",
    heroTitleHi: "ज्योतिर्लिंगे",
    heroDesc:
      "भगवान शिवांच्या बारा स्वयंभू ज्योतिर्लिंगांचे पवित्र दर्शन घ्या. थेट आरती पाहा, प्रत्येक मंदिराचे दर्शन घ्या आणि आपल्या तीर्थयात्रेच्या भावना सामायिक करा.",
    cta: "दर्शन सुरू करा",
    liveTitle: "बारा थेट दर्शन",
    liveDesc: "प्रत्येक ज्योतिर्लिंगाचे थेट प्रक्षेपण एकाच ठिकाणी.",
    sacredTitle: "पवित्र बारा ज्योतिर्लिंगे",
    sacredDesc:
      "कोणत्याही मंदिरावर स्पर्श करा आणि त्याचे दर्शन, थेट आरती, छायाचित्रे व भक्तकथा अनुभवा.",
    open: "उघडा",
  },
  hi: {
    tagline: "हर हर महादेव",
    heroTitlePre: "बारह",
    heroTitleHi: "ज्योतिर्लिंग",
    heroDesc:
      "भगवान शिव के बारह स्वयंभू ज्योतिर्लिंगों के पवित्र दर्शन कीजिए। लाइव आरती देखें, हर मंदिर के दर्शन करें और अपनी तीर्थयात्रा की भावनाओं को साझा करें।",
    cta: "दर्शन आरंभ करें",
    liveTitle: "सभी 12 लाइव दर्शन",
    liveDesc: "हर ज्योतिर्लिंग का लाइव प्रसारण एक ही जगह।",
    sacredTitle: "पवित्र बारह ज्योतिर्लिंग",
    sacredDesc: "किसी भी मंदिर पर टैप करें और उसके दर्शन, लाइव आरती, गैलरी व भक्त कथाएँ देखें।",
    open: "खोलें",
  },
  gu: {
    tagline: "હર હર મહાદેવ",
    heroTitlePre: "બાર",
    heroTitleHi: "જ્યોતિર્લિંગ",
    heroDesc:
      "ભગવાન શિવનાં બાર સ્વયંભૂ જ્યોતિર્લિંગોનાં પવિત્ર દર્શન કરો. જીવંત આરતી જુઓ, દરેક મંદિરનાં દર્શન કરો અને તમારી તીર્થયાત્રાની ભાવનાઓ વહેંચો.",
    cta: "દર્શન શરૂ કરો",
    liveTitle: "બધાં 12 જીવંત દર્શન",
    liveDesc: "દરેક જ્યોતિર્લિંગનું જીવંત પ્રસારણ એક જ જગ્યાએ.",
    sacredTitle: "પવિત્ર બાર જ્યોતિર્લિંગ",
    sacredDesc: "કોઈપણ મંદિર પર ટૅપ કરો અને તેનાં દર્શન, જીવંત આરતી, ગૅલેરી અને ભક્તકથાઓ માણો.",
    open: "ખોલો",
  },
  te: {
    tagline: "హర హర మహాదేవ",
    heroTitlePre: "పన్నెండు",
    heroTitleHi: "జ్యోతిర్లింగాలు",
    heroDesc:
      "శివుని పన్నెండు స్వయంభూ జ్యోతిర్లింగాల పవిత్ర దర్శనం పొందండి. ప్రత్యక్ష ఆరతిని తిలకించండి, ప్రతి ఆలయాన్ని దర్శించుకోండి, మీ తీర్థయాత్ర అనుభవాలను పంచుకోండి.",
    cta: "దర్శనం ప్రారంభించండి",
    liveTitle: "12 ప్రత్యక్ష దర్శనాలు",
    liveDesc: "ప్రతి జ్యోతిర్లింగ ప్రత్యక్ష ప్రసారం ఒకే చోట.",
    sacredTitle: "పవిత్ర పన్నెండు జ్యోతిర్లింగాలు",
    sacredDesc:
      "ఏదైనా ఆలయాన్ని తాకి, దాని దర్శనం, ప్రత్యక్ష ఆరతి, చిత్రశాల, భక్తుల కథలను అనుభవించండి.",
    open: "తెరువు",
  },
  ta: {
    tagline: "ஹர ஹர மகாதேவ",
    heroTitlePre: "பன்னிரண்டு",
    heroTitleHi: "ஜோதிர்லிங்கங்கள்",
    heroDesc:
      "சிவபெருமானின் பன்னிரண்டு சுயம்பு ஜோதிர்லிங்கங்களின் புனித தரிசனத்தைப் பெறுங்கள். நேரடி ஆரத்தியைக் காணுங்கள், ஒவ்வொரு கோயிலையும் தரிசியுங்கள், உங்கள் யாத்திரை அனுபவங்களைப் பகிருங்கள்.",
    cta: "தரிசனத்தைத் தொடங்குங்கள்",
    liveTitle: "12 நேரடி தரிசனங்கள்",
    liveDesc: "ஒவ்வொரு ஜோதிர்லிங்கத்தின் நேரடி ஒளிபரப்பும் ஒரே இடத்தில்.",
    sacredTitle: "புனித பன்னிரண்டு ஜோதிர்லிங்கங்கள்",
    sacredDesc:
      "எந்த கோயிலையும் தொடவும்: அதன் தரிசனம், நேரடி ஆரத்தி, படத்தொகுப்பு மற்றும் பக்தர்களின் கதைகளை அனுபவியுங்கள்.",
    open: "திற",
  },
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "12 Jyotirlinga Darshan — Live Aarti, Galleries & Devotee Stories" },
      {
        name: "description",
        content:
          "Behold all twelve sacred Jyotirlingas of Lord Shiva. Watch live darshan, explore temple galleries and share your devotional stories.",
      },
      { property: "og:title", content: "12 Jyotirlinga Darshan" },
      {
        property: "og:description",
        content: "All 12 Jyotirlingas — live darshan, galleries and devotee stories.",
      },
      { property: "og:image", content: heroImg },
    ],
  }),
  component: Index,
});

function defaultKey(slug: string) {
  return `${slug}__default`;
}

function Index() {
  const linksFn = useServerFn(getDarshanLinks);
  const links = useQuery({
    queryKey: ["darshan-links"],
    queryFn: () => linksFn(),
    staleTime: 60_000,
  });

  const { lang, isEn, fontClass } = useLanguage();
  const t = STRINGS[lang];
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<Record<string, DarshanStatus>>({});
  const [liveOnly, setLiveOnly] = useState(false);
  const setStatus = useCallback((slug: string, s: DarshanStatus) => {
    setStatuses((prev) => (prev[slug] === s ? prev : { ...prev, [slug]: s }));
  }, []);
  const liveCount = Object.values(statuses).filter((s) => s === "live").length;

  const toggleSelected = (slug: string) =>
    setSelected((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));

  const watchSelected = () => {
    if (!selected.length) return;
    navigate({ to: "/live", search: { slugs: selected.join(",") } });
  };

  const watchAll = () => navigate({ to: "/live", search: {} });

  return (
    <div>
      <section className="relative overflow-hidden">
        <img
          src={heroImg}
          alt="Sacred Shiva lingam surrounded by glowing diya lamps during night aarti"
          width={1920}
          height={1080}
          referrerPolicy="no-referrer"
          className="absolute inset-0 size-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background" />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 py-28 text-center sm:py-36">
          <Flame className="size-10 text-primary diya-flicker" />
          <p
            className={cn(
              "mt-6 text-sm uppercase tracking-[0.3em] text-accent",
              isEn ? "font-display" : cn("text-base normal-case tracking-normal", fontClass),
            )}
          >
            {t.tagline}
          </p>
          <h1
            className={cn(
              "mt-4 text-4xl font-bold leading-tight text-foreground sm:text-6xl",
              isEn ? "font-display" : fontClass,
            )}
          >
            {t.heroTitlePre} <span className="text-gradient-gold">{t.heroTitleHi}</span>
          </h1>
          <p className={cn("mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg", fontClass)}>
            {t.heroDesc}
          </p>
          <a
            href="#shrines"
            className={cn(
              "mt-8 inline-flex items-center justify-center rounded-md bg-gradient-aarti px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90",
              !isEn && cn("text-base", fontClass),
            )}
          >
            {t.cta}
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8 text-center">
          <h2
            className={cn(
              "text-3xl font-semibold text-foreground",
              isEn ? "font-display" : fontClass,
            )}
          >
            {t.liveTitle}
          </h2>
          <p className={cn("mt-2 text-sm text-muted-foreground", fontClass)}>{t.liveDesc}</p>
        </div>
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={watchAll}
            className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-card/70"
          >
            <Play className="size-3.5" /> Watch all 12
          </button>
          <button
            type="button"
            onClick={watchSelected}
            disabled={selected.length === 0}
            className="inline-flex items-center gap-1.5 rounded-md bg-gradient-aarti px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play className="size-3.5" /> Watch selected
            {selected.length > 0 ? ` (${selected.length})` : ""}
          </button>
          <button
            type="button"
            onClick={() => setLiveOnly((v) => !v)}
            aria-pressed={liveOnly}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
              liveOnly
                ? "border-red-600 bg-red-600 text-white hover:bg-red-600/90"
                : "border-border/60 bg-card text-foreground hover:bg-card/70",
            )}
          >
            <Radio className="size-3.5" />
            {liveOnly ? "Showing LIVE only" : "Only LIVE"}
            {liveCount > 0 ? ` (${liveCount})` : ""}
          </button>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => setSelected([])}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {jyotirlingas.map((j) => {
            const liveRaw = links.data?.[j.slug] ?? j.youtubeUrl;
            const defaultRaw = links.data?.[defaultKey(j.slug)] ?? j.defaultYoutubeUrl;
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
            const liveUrl = liveCheck.ok ? liveCheck.embedUrl : null;
            const defaultUrl = defaultCheck.ok ? defaultCheck.embedUrl : null;
            const loc = getLocalized(j, lang);
            const isLive = statuses[j.slug] === "live";
            const hidden = liveOnly && !isLive;
            return (
              <div
                key={j.slug}
                className={cn(
                  "relative overflow-hidden rounded-xl border bg-card shadow-elegant transition-colors",
                  selected.includes(j.slug)
                    ? "border-primary ring-2 ring-primary/60"
                    : "border-border/60",
                  hidden && "hidden",
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleSelected(j.slug)}
                  aria-pressed={selected.includes(j.slug)}
                  aria-label={selected.includes(j.slug) ? `Deselect ${j.name}` : `Select ${j.name}`}
                  className={cn(
                    "absolute right-2 top-2 z-10 inline-flex size-7 items-center justify-center rounded-md border text-xs font-semibold backdrop-blur-sm transition-colors",
                    selected.includes(j.slug)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-white/40 bg-black/40 text-white hover:bg-black/60",
                  )}
                >
                  {selected.includes(j.slug) ? <Check className="size-4" /> : ""}
                </button>
                <DarshanTile
                  title={`${j.name} live darshan`}
                  liveUrl={liveUrl}
                  defaultUrl={defaultUrl}
                  onStatusChange={(s) => setStatus(j.slug, s)}
                />

                <div className="flex items-center justify-between gap-2 p-3">
                  <div>
                    <h3
                      className={cn(
                        "text-sm font-semibold text-foreground",
                        isEn ? "font-display" : cn("text-base", fontClass),
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
      </section>

      <section id="shrines" className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2
            className={cn(
              "text-3xl font-semibold text-foreground",
              isEn ? "font-display" : fontClass,
            )}
          >
            {t.sacredTitle}
          </h2>
          <p className={cn("mt-2 text-sm text-muted-foreground", fontClass)}>{t.sacredDesc}</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {jyotirlingas.map((j) => {
            const loc = getLocalized(j, lang);
            return (
              <Link
                key={j.slug}
                to="/jyotirlinga/$slug"
                params={{ slug: j.slug }}
                className="group overflow-hidden rounded-xl border border-border/60 bg-card shadow-elegant transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={j.image}
                    alt={`${j.name} Jyotirlinga temple`}
                    width={1024}
                    height={768}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                  <span className="absolute left-3 top-3 flex size-8 items-center justify-center rounded-full bg-gradient-aarti text-sm font-bold text-primary-foreground shadow-glow">
                    {toLocalDigits(j.number, lang)}
                  </span>
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
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
