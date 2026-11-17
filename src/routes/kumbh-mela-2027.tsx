import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, CalendarDays, MapPin, Waves } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { KUMBH_TEXT } from "@/components/KumbhFeature";
import { cn } from "@/lib/utils";

const OFFICIAL_SCHEDULE = "https://simhasthamahakumbh.maharashtra.gov.in/snan-calendar";
const SNAN_DATES = [
  { date: "15 Jun 2027", en: "Main Mela period begins", mr: "मुख्य मेळा कालावधी सुरू", hi: "मुख्य मेला अवधि शुरू" },
  { date: "02 Aug 2027", en: "First Amrut Snan", mr: "पहिले अमृत स्नान", hi: "पहला अमृत स्नान" },
  { date: "31 Aug 2027", en: "Second Amrut Snan", mr: "दुसरे अमृत स्नान", hi: "दूसरा अमृत स्नान" },
  { date: "11 Sep 2027", en: "Third Amrut Snan · Ramtirth, Nashik", mr: "तिसरे अमृत स्नान · रामतीर्थ, नाशिक", hi: "तीसरा अमृत स्नान · रामतीर्थ, नाशिक" },
  { date: "12 Sep 2027", en: "Third Amrut Snan · Kushavarta, Trimbakeshwar", mr: "तिसरे अमृत स्नान · कुशावर्त, त्र्यंबकेश्वर", hi: "तीसरा अमृत स्नान · कुशावर्त, त्र्यंबकेश्वर" },
];

export const Route = createFileRoute("/kumbh-mela-2027")({
  head: () => ({ meta: [
    { title: "Nashik–Trimbakeshwar Kumbh Mela 2027 | 12 Jyotirlinga Darshan" },
    { name: "description", content: "Explore Nashik–Trimbakeshwar Simhastha Kumbh Mela 2027, its connection to Trimbakeshwar Jyotirlinga, and the official event schedule." },
  ] }),
  component: KumbhPage,
});

function KumbhPage() {
  const { lang, fontClass } = useLanguage();
  const t = KUMBH_TEXT[lang];
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:pt-16">
        <Link to="/" className={cn("inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-primary", fontClass)}><ArrowLeft className="size-4" aria-hidden="true" />{lang === "mr" ? "मुख्य पान" : lang === "hi" ? "मुख्य पृष्ठ" : "Home"}</Link>
        <div className="relative mt-6 overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-card via-background to-primary/10 p-7 sm:p-12">
          <p className={cn("flex items-center gap-2 text-sm font-semibold text-primary", fontClass)}><Waves className="size-5" aria-hidden="true" />{t.eyebrow}</p>
          <h1 className={cn("mt-5 max-w-4xl text-3xl leading-snug sm:text-5xl lg:text-6xl", fontClass)}>{t.title}</h1>
          <p className={cn("mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground", fontClass)}>{t.intro}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={OFFICIAL_SCHEDULE} target="_blank" rel="noopener noreferrer" className={cn("inline-flex min-h-12 items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground hover:opacity-90", fontClass)}><CalendarDays className="size-4" aria-hidden="true" />{t.calendar}<ArrowUpRight className="size-4" aria-hidden="true" /></a>
          </div>
        </div>
        <section aria-labelledby="snan-calendar-heading" className="mt-10 rounded-2xl border border-primary/25 bg-card p-6 sm:p-8">
          <p className={cn("text-sm font-semibold text-primary", fontClass)}>{lang === "mr" ? "सिंहस्थ २०२७" : lang === "hi" ? "सिंहस्थ २०२७" : "Simhastha 2027"}</p>
          <h2 id="snan-calendar-heading" className={cn("mt-2 text-2xl sm:text-3xl", fontClass)}>{lang === "mr" ? "महत्त्वाच्या स्नान तारखा" : lang === "hi" ? "प्रमुख स्नान तिथियाँ" : "Important Snan dates"}</h2>
          <ol className="mt-6 grid gap-3 md:grid-cols-2">
            {SNAN_DATES.map((event) => (
              <li key={event.date} className="flex gap-4 rounded-xl border border-border/70 bg-background/60 p-4">
                <CalendarDays className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" />
                <div><time className="text-sm font-semibold text-primary">{event.date}</time><p className={cn("mt-1 leading-relaxed", fontClass)}>{lang === "mr" ? event.mr : lang === "hi" ? event.hi : event.en}</p></div>
              </li>
            ))}
          </ol>
          <p className={cn("mt-5 text-sm text-muted-foreground", fontClass)}>{lang === "mr" ? "कार्यक्रम व वेळा बदलू शकतात. प्रवासापूर्वी अधिकृत स्नान दिनदर्शिका तपासा." : lang === "hi" ? "कार्यक्रम और समय बदल सकते हैं। यात्रा से पहले आधिकारिक स्नान कैलेंडर देखें।" : "Dates and arrangements may change. Verify with the official Snan calendar before travelling."}</p>
          <a href={OFFICIAL_SCHEDULE} target="_blank" rel="noopener noreferrer" className={cn("mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-primary hover:underline", fontClass)}>{t.calendar}<ArrowUpRight className="size-4" aria-hidden="true" /></a>
        </section>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <MapPin className="mb-4 size-6 text-primary" aria-hidden="true" />
            <h2 className={cn("text-2xl", fontClass)}>{t.temple}</h2>
            <p className={cn("mt-3 leading-relaxed text-muted-foreground", fontClass)}>{t.description}</p>
            <Link to="/$slug" params={{ slug: "trimbakeshwar" }} className={cn("mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-primary hover:underline", fontClass)}>{t.visit}<ArrowUpRight className="size-4" aria-hidden="true" /></Link>
          </article>
          <article className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <CalendarDays className="mb-4 size-6 text-primary" aria-hidden="true" />
            <h2 className={cn("text-2xl", fontClass)}>{t.calendar}</h2>
            <p className={cn("mt-3 leading-relaxed text-muted-foreground", fontClass)}>{lang === "mr" ? "स्नानपर्व, प्रवेश, वाहतूक आणि सुरक्षेसंबंधी अद्ययावत माहितीसाठी अधिकृत संकेतस्थळ तपासा." : lang === "hi" ? "स्नान पर्व, प्रवेश, यातायात और सुरक्षा से जुड़ी नवीनतम जानकारी के लिए आधिकारिक वेबसाइट देखें।" : "For confirmed bathing dates, access arrangements, transport and safety advisories, consult the official authority."}</p>
            <a href={OFFICIAL_SCHEDULE} target="_blank" rel="noopener noreferrer" className={cn("mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-primary hover:underline", fontClass)}>{t.calendar}<ArrowUpRight className="size-4" aria-hidden="true" /></a>
          </article>
        </div>
      </div>
    </main>
  );
}
