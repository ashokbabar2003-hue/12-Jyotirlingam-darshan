import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, CalendarDays, MapPin, Waves } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { KUMBH_TEXT } from "@/components/KumbhFeature";
import { cn } from "@/lib/utils";

const OFFICIAL_SCHEDULE = "https://simhasthamahakumbh.maharashtra.gov.in/live-event-schedule";

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
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <MapPin className="mb-4 size-6 text-primary" aria-hidden="true" />
            <h2 className={cn("text-2xl", fontClass)}>{t.temple}</h2>
            <p className={cn("mt-3 leading-relaxed text-muted-foreground", fontClass)}>{t.description}</p>
            <Link to="/jyotirlinga/$slug" params={{ slug: "trimbakeshwar" }} className={cn("mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-primary hover:underline", fontClass)}>{t.visit}<ArrowUpRight className="size-4" aria-hidden="true" /></Link>
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
