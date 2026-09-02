import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useState } from "react";

import { jyotirlingas } from "@/data/jyotirlingas";
import { getDarshanLinks } from "@/lib/darshan.functions";
import { type DarshanStatus } from "@/components/darshan-tile";
import { useLanguage, type Lang } from "@/hooks/use-language";
import { HeroAarti } from "@/components/HeroAarti";
import { LiveDarshanSection } from "@/components/LiveDarshanSection";
import { PilgrimageJourney } from "@/components/PilgrimageJourney";
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
    liveDesc: "Witness continuous live sanctum aarti and darshan directly from each holy shrine.",
    sacredTitle: "The Sacred Twelve",
    sacredDesc: "Tap any shrine to enter its darshan, live aarti, gallery and devotee stories.",
    open: "Open",
  },
  mr: {
    tagline: "हर हर महादेव",
    heroTitlePre: "बारा",
    heroTitleHi: "ज्योतिर्लिंग",
    heroDesc:
      "भगवान शिवांच्या बारा स्वयंभू ज्योतिर्लिंगांचे पवित्र दर्शन घ्या. थेट आरती पाहा, प्रत्येक मंदिराचे दर्शन घ्या आणि आपल्या तीर्थयात्रेच्या भावना सामायिक करा.",
    cta: "दर्शन सुरू करा",
    liveTitle: "बारा थेट दर्शन",
    liveDesc: "प्रत्येक ज्योतिर्लिंगाचे थेट प्रक्षेपण एकाच ठिकाणी.",
    sacredTitle: "पवित्र बारा ज्योतिर्लिंग",
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

  const toggleSelected = (slug: string) =>
    setSelected((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));

  const watchSelected = () => {
    if (!selected.length) return;
    navigate({ to: "/live", search: { slugs: selected.join(",") } });
  };

  const watchAll = () => navigate({ to: "/live", search: {} });

  return (
    <div className="relative w-full overflow-hidden bg-background">
      {/* 1. ARRIVAL: Hero Aarti Sacred Awakening */}
      <HeroAarti t={t} lang={lang} isEn={isEn} fontClass={fontClass} />

      {/* 2. DARSHAN: Living Sanctum Live Darshan & Editorial Bridge */}
      <LiveDarshanSection
        linksData={links.data}
        lang={lang}
        isEn={isEn}
        fontClass={fontClass}
        statuses={statuses}
        setStatus={setStatus}
        selected={selected}
        toggleSelected={toggleSelected}
        watchSelected={watchSelected}
        watchAll={watchAll}
        liveOnly={liveOnly}
        setLiveOnly={setLiveOnly}
        onClearSelected={() => setSelected([])}
        t={t}
      />

      {/* 3. PILGRIMAGE: 12-Jyotirlinga Canonical Journey & Sacred Reflection */}
      <PilgrimageJourney shrines={jyotirlingas} lang={lang} isEn={isEn} fontClass={fontClass} />
    </div>
  );
}
