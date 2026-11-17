import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Flame, MapPin, Mountain, Play, Waves } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";
import templeImg from "@/assets/jl-trimbakeshwar.jpg";
import fallbackImg from "@/assets/hero-aarti.jpg";
import "./kumbh-experience.css";
import { useGSAP, gsap, prefersReducedMotion } from "@/hooks/use-gsap";

const MEDIA = {
  ramkund: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Ramkund%20Nashik.jpg?width=1200",
  mela: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Kumbhmela%20Nashik%202015%20-%20view%20across%20Ramkund.JPG?width=1200",
  kushavarta: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Kumbhmela%20Nashik%202015%20-%20Trimbakeshwar%20Kushavarta.JPG?width=1200",
  pilgrims: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Kumbha%20mela%20on%20ghats%20of%20the%20river%20godavari%20nashik.jpg?width=1200",
};
const PHOTO_CREDITS = "Historical photographs: Wikimedia Commons contributors (2014–2025), CC BY-SA 4.0. These are not photographs of the 2027 event.";
const EVENTS = [
  { date: "2027-06-15", dateText: "15 JUN 2027", img: MEDIA.ramkund, location: "Nashik", label: ["Main Mela period begins","मुख्य मेळा कालावधी सुरू","मुख्य मेला अवधि शुरू"] },
  { date: "2027-08-02", dateText: "02 AUG 2027", img: MEDIA.pilgrims, location: "Nashik & Trimbakeshwar", label: ["First Amrut Snan","पहिले अमृत स्नान","पहला अमृत स्नान"] },
  { date: "2027-08-31", dateText: "31 AUG 2027", img: MEDIA.mela, location: "Nashik & Trimbakeshwar", label: ["Second Amrut Snan","दुसरे अमृत स्नान","दूसरा अमृत स्नान"] },
  { date: "2027-09-11", dateText: "11 SEP 2027", img: MEDIA.ramkund, location: "Ramtirth, Nashik", label: ["Third Amrut Snan · Nashik","तिसरे अमृत स्नान · नाशिक","तीसरा अमृत स्नान · नाशिक"] },
  { date: "2027-09-12", dateText: "12 SEP 2027", img: MEDIA.kushavarta, location: "Kushavarta, Trimbakeshwar", label: ["Third Amrut Snan · Trimbakeshwar","तिसरे अमृत स्नान · त्र्यंबकेश्वर","तीसरा अमृत स्नान · त्र्यंबकेश्वर"] },
];
const COPY = {
  en: { what: "What is the Kumbh Mela?", watch: "Explore the story", journey: "A journey of faith", steps: ["A sacred gathering","The holy rivers","A living tradition"], details: ["Pilgrims come together in a shared celebration of faith and spiritual renewal.","Ritual bathing in sacred waters is a central part of the pilgrimage.","At Nashik and Trimbakeshwar, Simhastha connects the Godavari with generations of devotion."], calendar: "The sacred Snan journey", locations: "Two sacred destinations", nashik: "Nashik · Ramkund", nashikDesc: "The Godavari ghats in Panchavati are a gathering place for pilgrims.", trimbak: "Trimbakeshwar · Kushavarta", trimbakDesc: "The sacred tank near Trimbakeshwar Jyotirlinga is another important bathing site.", temple: "Explore Trimbakeshwar", official: "Verify the official schedule", warning: "Historical images are illustrative; dates and arrangements may change." },
  mr: { what: "कुंभमेळा म्हणजे काय?", watch: "ही कथा अनुभवा", journey: "श्रद्धेची यात्रा", steps: ["श्रद्धेचा महासंगम","पवित्र नद्यांचे महत्त्व","जिवंत परंपरा"], details: ["आध्यात्मिक शुद्धी आणि श्रद्धेसाठी भाविक एकत्र येतात.","पवित्र जलात स्नान करणे हा या तीर्थयात्रेचा महत्त्वाचा भाग आहे.","नाशिक–त्र्यंबकेश्वर येथे सिंहस्थ गोदावरीला भक्तीच्या परंपरेशी जोडतो."], calendar: "पवित्र स्नानयात्रा", locations: "दोन पवित्र तीर्थक्षेत्रे", nashik: "नाशिक · रामकुंड", nashikDesc: "पंचवटीतील गोदावरी घाट भाविकांचे महत्त्वाचे तीर्थस्थान आहे.", trimbak: "त्र्यंबकेश्वर · कुशावर्त", trimbakDesc: "त्र्यंबकेश्वर ज्योतिर्लिंगाजवळील पवित्र कुंड हे आणखी एक स्नानस्थळ आहे.", temple: "त्र्यंबकेश्वर दर्शन", official: "अधिकृत कार्यक्रम तपासा", warning: "छायाचित्रे मागील वर्षांतील आहेत; तारखा आणि व्यवस्था बदलू शकतात." },
  hi: { what: "कुंभ मेला क्या है?", watch: "कहानी देखें", journey: "आस्था की यात्रा", steps: ["आस्था का महासंगम","पवित्र नदियाँ","जीवंत परंपरा"], details: ["श्रद्धालु आध्यात्मिक शुद्धि और आस्था के लिए एकत्र होते हैं।","पवित्र जल में स्नान इस तीर्थयात्रा का महत्वपूर्ण अंग है।","नाशिक–त्र्यंबकेश्वर में सिंहस्थ गोदावरी को भक्ति की परंपरा से जोड़ता है।"], calendar: "पवित्र स्नान यात्रा", locations: "दो पवित्र तीर्थस्थल", nashik: "नाशिक · रामकुंड", nashikDesc: "पंचवटी के गोदावरी घाट श्रद्धालुओं के लिए प्रमुख तीर्थस्थल हैं।", trimbak: "त्र्यंबकेश्वर · कुशावर्त", trimbakDesc: "त्र्यंबकेश्वर ज्योतिर्लिंग के पास स्थित पवित्र कुंड एक महत्वपूर्ण स्नान स्थल है।", temple: "त्र्यंबकेश्वर दर्शन", official: "आधिकारिक कार्यक्रम देखें", warning: "तस्वीरें पिछले वर्षों की हैं; तिथियाँ और व्यवस्थाएँ बदल सकती हैं।" },
};
function Photo({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return <img src={failed ? fallbackImg : src} onError={() => setFailed(true)} alt={alt} loading="lazy" className={cn("size-full object-cover", className)} />;
}

function KumbhSnanScene({ event, previous, index, label, fontClass }: {
  event: typeof EVENTS[number]; previous?: typeof EVENTS[number]; index: number; label: string; fontClass: string;
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const fromRef = useRef<HTMLDivElement | null>(null);
  const toRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  useGSAP(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const to = toRef.current;
    const from = fromRef.current;
    const copy = textRef.current;
    const progress = progressRef.current;
    if (!section || !stage || !to || !copy || !progress) return;
    if (prefersReducedMotion()) {
      gsap.set([to, copy], { opacity: 1, clearProps: "transform" });
      if (from) gsap.set(from, { opacity: 0 });
      gsap.set(progress, { scaleX: 1 });
      return;
    }
    const mobile = window.innerWidth < 768;
    gsap.set(to, { opacity: 0.15, scale: 1.13, filter: "brightness(0.45)" });
    if (from) gsap.set(from, { opacity: 1, scale: 1 });
    gsap.set(copy, { opacity: 0, y: 30 });
    gsap.set(progress, { scaleX: 0, transformOrigin: "left center" });
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: mobile ? "top 70%" : "top top",
        end: mobile ? "bottom 25%" : "+=85%",
        scrub: mobile ? 0.45 : 0.75,
        pin: mobile ? false : stage,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
    timeline.to(to, { opacity: 1, scale: 1, filter: "brightness(1)", duration: 0.72, ease: "power1.inOut" }, 0.06);
    if (from) timeline.to(from, { opacity: 0, scale: 1.08, duration: 0.62, ease: "power1.inOut" }, 0.04);
    timeline.to(copy, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }, 0.22);
    timeline.to(progress, { scaleX: 1, duration: 1, ease: "none" }, 0);
  }, { dependencies: [index, label] });
  return <section ref={sectionRef} aria-label={label} className="relative min-h-[75vh] md:min-h-[90vh]">
    <div ref={stageRef} className="relative flex min-h-[75vh] items-end overflow-hidden border-y border-primary/20 bg-background md:min-h-[90vh] md:items-center">
      {previous && <div ref={fromRef} className="absolute inset-0"><Photo src={previous.img} alt="" className="absolute inset-0" /></div>}
      <div ref={toRef} className="absolute inset-0"><Photo src={event.img} alt={"Historical Kumbh pilgrimage photograph: "+event.location} className="absolute inset-0" /></div>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/20 md:bg-gradient-to-r md:from-background/95 md:via-background/55 md:to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1 bg-primary/15"><div ref={progressRef} className="h-full w-full bg-primary" /></div>
      <div ref={textRef} className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 pt-24 sm:px-10 md:py-24">
        <div className="max-w-2xl rounded-2xl border border-primary/25 bg-background/65 p-6 shadow-2xl backdrop-blur-md sm:p-9">
          <p className="mb-5 text-sm font-semibold tracking-widest text-primary">{String(index+1).padStart(2,"0")} / 05 · {event.location}</p>
          <time dateTime={event.date} className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><CalendarDays className="size-5" />{event.dateText}</time>
          <h3 className={cn("mt-4 text-3xl leading-snug text-foreground sm:text-5xl",fontClass)}>{label}</h3>
          <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><Flame className="size-4 text-primary" />{index === 4 ? "Kushavarta · Trimbakeshwar" : index === 3 ? "Ramkund · Nashik" : "Simhastha Kumbh Mela 2027"}</div>
        </div>
      </div>
    </div>
  </section>;
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
        {EVENTS.map((event, i) => <KumbhSnanScene key={event.date} event={event} previous={i > 0 ? EVENTS[i-1] : undefined} index={i} label={event.label[langIndex]} fontClass={fontClass} />)}
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
