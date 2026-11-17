import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Flame, MapPin, Mountain, Play, Waves } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";
import templeImg from "@/assets/jl-trimbakeshwar.jpg";
import fallbackImg from "@/assets/hero-aarti.jpg";
import "./kumbh-experience.css";
import { SacredJourneyTransition } from "@/components/SacredJourneyTransition";
import type { SacredJourneyTransitionData } from "@/data/transitions";

const MEDIA = {
  ramkund: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Ramkund%20Nashik.jpg?width=1200",
  mela: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Kumbhmela%20Nashik%202015%20-%20view%20across%20Ramkund.JPG?width=1200",
  kushavarta: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Kumbhmela%20Nashik%202015%20-%20Trimbakeshwar%20Kushavarta.JPG?width=1200",
  pilgrims: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Kumbha%20mela%20on%20ghats%20of%20the%20river%20godavari%20nashik.jpg?width=1200",
};
const PHOTO_CREDITS = "Historical photographs: Wikimedia Commons contributors (2014–2025), CC BY-SA 4.0. These are not photographs of the 2027 event.";
const EVENTS = [
  { date: "2026-10-31", dateText: "31 OCT 2026", time: "12:02 PM", img: MEDIA.kushavarta, location: "Nashik–Trimbakeshwar", label: ["Dhwajarohan (Flag Hoisting)","ध्वजारोहण (ध्वजवंदन)","ध्वजारोहण (ध्वज फहराना)"], description: "Dhwaj Parv, Jupiter’s entry into Leo, and commencement of Simhastha Mahakumbh." },
  { date: "2027-06-15", dateText: "15 JUN 2027", time: "All Day", img: MEDIA.ramkund, location: "Nashik–Trimbakeshwar", label: ["Major Mela Period Begins","मुख्य मेळा कालावधी सुरू","मुख्य मेला अवधि शुरू"], description: "The official major Mela period begins." },
  { date: "2027-07-29", dateText: "29 JUL 2027", time: "To be notified", img: MEDIA.mela, location: "Nashik", label: ["Nagar Pradakshina","नगर प्रदक्षिणा","नगर प्रदक्षिणा"], description: "The traditional procession around Nashik before the Amrut Snans." },
  { date: "2027-08-02", dateText: "02 AUG 2027", time: "All Day", img: MEDIA.pilgrims, location: "Nashik–Trimbakeshwar", label: ["First Amrut Snan","पहिले अमृत स्नान","पहला अमृत स्नान"], description: "The first sacred bathing day of Simhastha Mahakumbh." },
  { date: "2027-08-31", dateText: "31 AUG 2027", time: "All Day", img: MEDIA.mela, location: "Nashik–Trimbakeshwar", label: ["Second Amrut Snan","दुसरे अमृत स्नान","दूसरा अमृत स्नान"], description: "The second sacred bathing day of Simhastha Mahakumbh." },
  { date: "2027-09-11", dateText: "11 SEP 2027", time: "All Day", img: MEDIA.ramkund, location: "Ramtirth, Nashik", label: ["Third Amrut Snan","तिसरे अमृत स्नान","तीसरा अमृत स्नान"], description: "The third sacred bathing day of Simhastha Mahakumbh at Ramtirth, Nashik." },
  { date: "2027-09-12", dateText: "12 SEP 2027", time: "All Day", img: MEDIA.kushavarta, location: "Kushavarta Tirth, Trimbakeshwar", label: ["Third Amrut Snan","तिसरे अमृत स्नान","तीसरा अमृत स्नान"], description: "The third sacred bathing day of Simhastha Mahakumbh at Kushavarta Tirth, Trimbakeshwar." },
  { date: "2028-07-24", dateText: "24 JUL 2028", time: "3:36 PM", img: MEDIA.pilgrims, location: "Nashik–Trimbakeshwar", label: ["Dhwajavatarana (Flag Lowering)","ध्वजावतरण (ध्वज उतरवणे)","ध्वजावतरण (ध्वज उतारना)"], description: "Lowering of the flag, marking the conclusion of Simhastha Mahakumbh." },
];
const COPY = {
  en: { what: "What is the Kumbh Mela?", watch: "Explore the story", journey: "A journey of faith", steps: ["A sacred gathering","The holy rivers","A living tradition"], details: ["Pilgrims come together in a shared celebration of faith and spiritual renewal.","Ritual bathing in sacred waters is a central part of the pilgrimage.","At Nashik and Trimbakeshwar, Simhastha connects the Godavari with generations of devotion."], calendar: "The sacred Snan journey", locations: "Two sacred destinations", nashik: "Nashik · Ramkund", nashikDesc: "The Godavari ghats in Panchavati are a gathering place for pilgrims.", trimbak: "Trimbakeshwar · Kushavarta", trimbakDesc: "The sacred tank near Trimbakeshwar Jyotirlinga is another important bathing site.", temple: "Explore Trimbakeshwar", official: "Verify the official schedule", warning: "Historical images are illustrative; dates and arrangements may change." },
  mr: { what: "कुंभमेळा म्हणजे काय?", watch: "ही कथा अनुभवा", journey: "श्रद्धेची यात्रा", steps: ["श्रद्धेचा महासंगम","पवित्र नद्यांचे महत्त्व","जिवंत परंपरा"], details: ["आध्यात्मिक शुद्धी आणि श्रद्धेसाठी भाविक एकत्र येतात.","पवित्र जलात स्नान करणे हा या तीर्थयात्रेचा महत्त्वाचा भाग आहे.","नाशिक–त्र्यंबकेश्वर येथे सिंहस्थ गोदावरीला भक्तीच्या परंपरेशी जोडतो."], calendar: "पवित्र स्नानयात्रा", locations: "दोन पवित्र तीर्थक्षेत्रे", nashik: "नाशिक · रामकुंड", nashikDesc: "पंचवटीतील गोदावरी घाट भाविकांचे महत्त्वाचे तीर्थस्थान आहे.", trimbak: "त्र्यंबकेश्वर · कुशावर्त", trimbakDesc: "त्र्यंबकेश्वर ज्योतिर्लिंगाजवळील पवित्र कुंड हे आणखी एक स्नानस्थळ आहे.", temple: "त्र्यंबकेश्वर दर्शन", official: "अधिकृत कार्यक्रम तपासा", warning: "छायाचित्रे मागील वर्षांतील आहेत; तारखा आणि व्यवस्था बदलू शकतात." },
  hi: { what: "कुंभ मेला क्या है?", watch: "कहानी देखें", journey: "आस्था की यात्रा", steps: ["आस्था का महासंगम","पवित्र नदियाँ","जीवंत परंपरा"], details: ["श्रद्धालु आध्यात्मिक शुद्धि और आस्था के लिए एकत्र होते हैं।","पवित्र जल में स्नान इस तीर्थयात्रा का महत्वपूर्ण अंग है।","नाशिक–त्र्यंबकेश्वर में सिंहस्थ गोदावरी को भक्ति की परंपरा से जोड़ता है।"], calendar: "पवित्र स्नान यात्रा", locations: "दो पवित्र तीर्थस्थल", nashik: "नाशिक · रामकुंड", nashikDesc: "पंचवटी के गोदावरी घाट श्रद्धालुओं के लिए प्रमुख तीर्थस्थल हैं।", trimbak: "त्र्यंबकेश्वर · कुशावर्त", trimbakDesc: "त्र्यंबकेश्वर ज्योतिर्लिंग के पास स्थित पवित्र कुंड एक महत्वपूर्ण स्नान स्थल है।", temple: "त्र्यंबकेश्वर दर्शन", official: "आधिकारिक कार्यक्रम देखें", warning: "तस्वीरें पिछले वर्षों की हैं; तिथियाँ और व्यवस्थाएँ बदल सकती हैं।" },
};

const DATE_LOCALES = { en: "en-IN", mr: "mr-IN-u-nu-deva", hi: "hi-IN-u-nu-deva", gu: "gu-IN-u-nu-gujr", te: "te-IN-u-nu-telu", ta: "ta-IN-u-nu-taml" } as const;
const EVENT_TRANSLATIONS = {
  gu: ["ધ્વજારોહણ (ધ્વજ ફરકાવવો)", "મુખ્ય મેળાનો સમય શરૂ", "નગર પ્રદક્ષિણા", "પ્રથમ અમૃત સ્નાન", "બીજું અમૃત સ્નાન", "ત્રીજું અમૃત સ્નાન", "ત્રીજું અમૃત સ્નાન", "ધ્વજાવતરણ (ધ્વજ ઉતારવો)"],
  te: ["ధ్వజారోహణం", "ప్రధాన మేళా ప్రారంభం", "నగర ప్రదక్షిణ", "మొదటి అమృత స్నానం", "రెండవ అమృత స్నానం", "మూడవ అమృత స్నానం", "మూడవ అమృత స్నానం", "ధ్వజావతరణం"],
  ta: ["கொடியேற்றம்", "முக்கிய விழாக்காலம் தொடக்கம்", "நகர வலம்", "முதல் அமிர்த நீராடல்", "இரண்டாம் அமிர்த நீராடல்", "மூன்றாம் அமிர்த நீராடல்", "மூன்றாம் அமிர்த நீராடல்", "கொடியிறக்கம்"],
} as const;
const TIME_TRANSLATIONS = {
  en: { all: "All Day", pending: "To be notified", afternoon: "PM" },
  mr: { all: "संपूर्ण दिवस", pending: "वेळ जाहीर होणे बाकी", afternoon: "दुपारी" },
  hi: { all: "पूरा दिन", pending: "समय घोषित होना बाकी", afternoon: "दोपहर" },
  gu: { all: "આખો દિવસ", pending: "સમય જાહેર થવાનો બાકી", afternoon: "બપોરે" },
  te: { all: "రోజంతా", pending: "సమయం ప్రకటించాల్సి ఉంది", afternoon: "మధ్యాహ్నం" },
  ta: { all: "நாள் முழுவதும்", pending: "நேரம் அறிவிக்கப்படவில்லை", afternoon: "பிற்பகல்" },
} as const;
function localDate(iso: string, lang: keyof typeof DATE_LOCALES) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(DATE_LOCALES[lang], { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, day)));
}
function localDateParts(iso: string, lang: keyof typeof DATE_LOCALES) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const locale = DATE_LOCALES[lang];
  const number = new Intl.NumberFormat(locale, { useGrouping: false });
  return {
    weekday: new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(date),
    day: number.format(day),
    monthYear: new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(date),
  };
}
function localEventTime(time: string, lang: keyof typeof TIME_TRANSLATIONS) {
  const t = TIME_TRANSLATIONS[lang];
  if (time === "All Day") return t.all;
  if (time === "To be notified") return t.pending;
  const [hour, minute] = time.split(":");
  const localized = new Intl.NumberFormat(DATE_LOCALES[lang], { minimumIntegerDigits: 2, useGrouping: false });
  const mins = Number(minute.slice(0, 2));
  return lang === "en" ? time : t.afternoon + " " + localized.format(Number(hour)) + ":" + localized.format(mins);
}
function localEventLabel(event: typeof EVENTS[number], index: number, lang: keyof typeof DATE_LOCALES) {
  if (lang === "mr") return event.label[1];
  if (lang === "hi") return event.label[2];
  if (lang === "gu" || lang === "te" || lang === "ta") return EVENT_TRANSLATIONS[lang][index];
  return event.label[0];
}

function Photo({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return <img src={failed ? fallbackImg : src} onError={() => setFailed(true)} alt={alt} loading="lazy" className={cn("size-full object-cover", className)} />;
}

export function KumbhExperience() {
  const { lang, fontClass } = useLanguage();
  const t = COPY[lang === "mr" || lang === "hi" ? lang : "en"];
  const langIndex = lang === "mr" ? 1 : lang === "hi" ? 2 : 0;
  const [scene, setScene] = useState(0);
  const [playing, setPlaying] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) { node.querySelectorAll(".kumbh-reveal").forEach(el => el.classList.add("is-visible")); return; }
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
    }), { threshold: 0.12 });
    node.querySelectorAll(".kumbh-reveal").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!playing || typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setScene(s => (s + 1) % 3), 4800);
    return () => window.clearInterval(timer);
  }, [playing]);
  const storyImages = [MEDIA.pilgrims, MEDIA.ramkund, MEDIA.kushavarta];
  return <div ref={root} className="mx-auto max-w-6xl space-y-20 px-4 pb-20 pt-14 sm:space-y-28 sm:pt-20">
    <section aria-labelledby="kumbh-story-title" className="kumbh-reveal overflow-hidden rounded-3xl border border-primary/30 bg-card shadow-2xl">
      <div className="grid lg:grid-cols-[1.2fr_1fr]">
        <div className="relative min-h-[320px] overflow-hidden sm:min-h-[420px]">
          <Photo key={scene} src={storyImages[scene]} alt="Historic photograph of the Nashik Kumbh pilgrimage" className="kumbh-story-photo absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-background/10" />
          <div className="absolute bottom-5 left-5 flex items-center gap-3">
            <button type="button" onClick={() => setPlaying(p => !p)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/60 bg-background/80 px-4 text-sm font-semibold text-foreground backdrop-blur-md"><Play className="size-4 text-primary" />{playing ? "Pause" : t.watch}</button>
            <span className="text-xs text-foreground/80">{scene + 1} / 3</span>
          </div>
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-10">
          <p className={cn("text-sm font-semibold text-primary", fontClass)}>{t.journey}</p>
          <h2 id="kumbh-story-title" className={cn("mt-3 text-3xl leading-snug sm:text-4xl", fontClass)}>{t.what}</h2>
          <div key={scene} className="kumbh-story-copy mt-8">
            <p className={cn("text-2xl text-primary", fontClass)}>{t.steps[scene]}</p>
            <p className={cn("mt-4 text-base leading-relaxed text-muted-foreground", fontClass)}>{t.details[scene]}</p>
          </div>
          <div className="mt-9 flex items-center gap-3">
            <button type="button" aria-label="Previous story scene" onClick={() => setScene(s => (s + 2) % 3)} className="grid size-11 place-items-center rounded-full border border-primary/40 hover:bg-primary/10"><ChevronLeft className="size-5" /></button>
            {t.steps.map((step, i) => <button key={step} type="button" aria-label={step} aria-current={scene === i ? "step" : undefined} onClick={() => setScene(i)} className={cn("h-2 rounded-full transition-all duration-500", scene === i ? "w-12 bg-primary" : "w-5 bg-primary/25")} />)}
            <button type="button" aria-label="Next story scene" onClick={() => setScene(s => (s + 1) % 3)} className="grid size-11 place-items-center rounded-full border border-primary/40 hover:bg-primary/10"><ChevronRight className="size-5" /></button>
          </div>
        </div>
      </div>
    </section>
    <section id="snan-dates" aria-labelledby="kumbh-dates-title" className="scroll-mt-28">
      <div className="kumbh-reveal text-center"><Flame className="mx-auto mb-3 size-8 text-primary" /><h2 id="kumbh-dates-title" className={cn("text-3xl sm:text-4xl", fontClass)}>{t.calendar}</h2></div>
      <div className="relative left-1/2 mt-10 w-screen -translate-x-1/2">
        {EVENTS.map((event, i) => {
          const transition: SacredJourneyTransitionData | null = i < EVENTS.length - 1 ? {
            fromSlug: "kumbh-" + event.date,
            toSlug: "kumbh-" + EVENTS[i + 1].date,
            fromIndex: i + 1,
            toIndex: i + 2,
            fromName: localEventLabel(event, i, lang),
            toName: localEventLabel(EVENTS[i + 1], i + 1, lang),
            fromLocation: event.location,
            toLocation: EVENTS[i + 1].location,
            fromState: "Maharashtra",
            toState: "Maharashtra",
            fromImage: event.img,
            toImage: EVENTS[i + 1].img,
            label: lang === "mr" ? "सिंहस्थ स्नानयात्रा" : lang === "hi" ? "सिंहस्थ स्नान यात्रा" : "Sacred Simhastha Journey",
            subtitle: localDate(event.date, lang) + " → " + localDate(EVENTS[i + 1].date, lang),
            spiritualEssence: lang === "mr" ? "गोदावरीच्या तीरावर श्रद्धेचा संगम" : lang === "hi" ? "गोदावरी के तट पर आस्था का संगम" : "A sacred journey along the Godavari",
          } : null;
          return <div key={event.date} className="relative">

            <section className="kumbh-calendar-event relative mx-auto max-w-6xl px-4 py-10 sm:py-16" aria-label={localEventLabel(event, i, lang)}>
              <div className="grid overflow-hidden rounded-3xl border border-primary/35 bg-card/95 shadow-2xl md:grid-cols-[minmax(220px,0.85fr)_minmax(280px,1.3fr)_minmax(260px,1.3fr)]">
                <div className="flex flex-col items-center justify-center border-b border-primary/30 bg-gradient-to-br from-primary/20 via-card to-card p-7 text-center md:border-b-0 md:border-r md:border-primary/30">
                  <span className="text-sm font-semibold tracking-wider text-primary">{new Intl.NumberFormat(DATE_LOCALES[lang], { minimumIntegerDigits: 2 }).format(i + 1)} / {new Intl.NumberFormat(DATE_LOCALES[lang], { minimumIntegerDigits: 2 }).format(EVENTS.length)}</span>
                  <time dateTime={event.date} className={cn("mt-4 flex flex-col items-center text-primary", fontClass)}>
                    <span className="text-lg font-semibold">{localDateParts(event.date, lang).weekday}</span>
                    <span className="my-2 text-7xl font-bold leading-none tabular-nums sm:text-8xl lg:text-9xl">{localDateParts(event.date, lang).day}</span>
                    <span className="text-xl font-semibold leading-relaxed sm:text-2xl">{localDateParts(event.date, lang).monthYear}</span>
                  </time>
                </div>
                <div className="flex flex-col justify-center p-6 sm:p-9">
                  <h3 className={cn("text-2xl leading-relaxed text-foreground sm:text-3xl", lang === "mr" || lang === "hi" ? "kumbh-devanagari" : fontClass)}>{localEventLabel(event, i, lang)}</h3>
                  <p className={cn("mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-primary/40 px-4 py-2 text-sm font-semibold text-primary", lang === "mr" || lang === "hi" ? "kumbh-devanagari" : fontClass)}><CalendarDays className="size-4 shrink-0" />{localEventTime(event.time, lang)}</p>
                  <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{event.description}</p>
                  <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="size-4 shrink-0 text-primary" />{event.location}</p>
                </div>
                <div className="relative min-h-60 overflow-hidden md:min-h-80">
                  <Photo src={event.img} alt={"Historical pilgrimage photograph of " + event.location} className="absolute inset-0 transition-transform duration-700 hover:scale-105" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/45 to-transparent" />
                </div>
              </div>
            </section>
            {transition && <SacredJourneyTransition transition={transition} lang={lang} isEn={lang === "en"} fontClass={fontClass} />}
          </div>;
        })}
      </div>
      <p className={cn("mx-auto max-w-3xl text-center text-sm text-muted-foreground", fontClass)}>{t.warning}</p>
      <div className="mt-5 text-center"><a href="https://simhasthamahakumbh.maharashtra.gov.in/#snan" target="_blank" rel="noopener noreferrer" className={cn("inline-flex min-h-11 items-center gap-2 font-semibold text-primary hover:underline", fontClass)}>{t.official}<ArrowUpRight className="size-4" /></a></div>
    </section>
    <section aria-labelledby="kumbh-places-title">
      <h2 id="kumbh-places-title" className={cn("kumbh-reveal mb-9 text-center text-3xl sm:text-4xl", fontClass)}>{t.locations}</h2>
      <div className="grid gap-6 md:grid-cols-2">
        <article className="kumbh-reveal group overflow-hidden rounded-2xl border border-primary/25 bg-card"><div className="h-56 overflow-hidden"><Photo src={MEDIA.ramkund} alt="Ramkund on the Godavari in Nashik" className="transition-transform duration-700 group-hover:scale-105" /></div><div className="p-6"><Waves className="mb-3 size-6 text-primary" /><h3 className={cn("text-2xl", fontClass)}>{t.nashik}</h3><p className={cn("mt-3 leading-relaxed text-muted-foreground", fontClass)}>{t.nashikDesc}</p></div></article>
        <article className="kumbh-reveal group overflow-hidden rounded-2xl border border-primary/25 bg-card"><div className="h-56 overflow-hidden"><img src={templeImg} alt="Trimbakeshwar Jyotirlinga temple" loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" /></div><div className="p-6"><Mountain className="mb-3 size-6 text-primary" /><h3 className={cn("text-2xl", fontClass)}>{t.trimbak}</h3><p className={cn("mt-3 leading-relaxed text-muted-foreground", fontClass)}>{t.trimbakDesc}</p><Link to="/$slug" params={{slug:"trimbakeshwar"}} className={cn("mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-primary",fontClass)}>{t.temple}<ArrowUpRight className="size-4" /></Link></div></article>
      </div>
    </section>
    <p className="text-center text-xs text-muted-foreground">{PHOTO_CREDITS} <a href="https://commons.wikimedia.org/" target="_blank" rel="noopener noreferrer" className="underline">Wikimedia Commons</a></p>
  </div>;
}
