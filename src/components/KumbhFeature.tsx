import { Link } from "@tanstack/react-router";
import { CalendarDays, ArrowUpRight, Waves } from "lucide-react";
import { useLanguage, type Lang } from "@/hooks/use-language";
import { cn } from "@/lib/utils";

export const KUMBH_TEXT: Record<Lang, { eyebrow: string; title: string; description: string; action: string; dates: string; temple: string; calendar: string; intro: string; visit: string }> = {
  en: { eyebrow: "Special pilgrimage • 2027", title: "Nashik–Trimbakeshwar Simhastha Kumbh Mela 2027", description: "A sacred gathering on the banks of the Godavari, closely connected with Trimbakeshwar Jyotirlinga.", action: "Explore Kumbh 2027", dates: "2027 pilgrimage", temple: "Trimbakeshwar Jyotirlinga", calendar: "Official event schedule", intro: "Discover the sacred connection between the Godavari, Nashik, and Trimbakeshwar. Plan with information published by the official Kumbh authority.", visit: "Explore Trimbakeshwar" },
  hi: { eyebrow: "विशेष तीर्थयात्रा • २०२७", title: "नाशिक–त्र्यंबकेश्वर सिंहस्थ कुंभ मेला २०२७", description: "गोदावरी के पवित्र तट पर आस्था का महापर्व, त्र्यंबकेश्वर ज्योतिर्लिंग से जुड़ी दिव्य यात्रा।", action: "कुंभ २०२७ के बारे में जानें", dates: "२०२७ तीर्थयात्रा", temple: "त्र्यंबकेश्वर ज्योतिर्लिंग", calendar: "आधिकारिक कार्यक्रम", intro: "गोदावरी, नाशिक और त्र्यंबकेश्वर का आध्यात्मिक संबंध जानें। यात्रा की जानकारी के लिए आधिकारिक कुंभ प्राधिकरण की घोषणाएँ देखें।", visit: "त्र्यंबकेश्वर दर्शन" },
  mr: { eyebrow: "विशेष तीर्थयात्रा • २०२७", title: "नाशिक–त्र्यंबकेश्वर सिंहस्थ कुंभमेळा २०२७", description: "पवित्र गोदावरीच्या तीरावरील श्रद्धेचा महासोहळा, त्र्यंबकेश्वर ज्योतिर्लिंगाशी जोडलेली दिव्य यात्रा.", action: "कुंभ २०२७ विषयी जाणून घ्या", dates: "२०२७ तीर्थयात्रा", temple: "त्र्यंबकेश्वर ज्योतिर्लिंग", calendar: "अधिकृत कार्यक्रम", intro: "गोदावरी, नाशिक आणि त्र्यंबकेश्वर यांचे आध्यात्मिक नाते जाणून घ्या. प्रवासासाठी अधिकृत कुंभ प्राधिकरणाच्या सूचना तपासा.", visit: "त्र्यंबकेश्वर दर्शन" },
  gu: { eyebrow: "વિશેષ યાત્રા • ૨૦૨૭", title: "નાશિક–ત્ર્યંબકેશ્વર સિંહસ્થ કુંભ મેળો ૨૦૨૭", description: "ગોદાવરી કિનારે પવિત્ર યાત્રા અને ત્ર્યંબકેશ્વર જ્યોતિર્લિંગનો આધ્યાત્મિક સંબંધ.", action: "કુંભ ૨૦૨૭ વિશે જાણો", dates: "૨૦૨૭ યાત્રા", temple: "ત્ર્યંબકેશ્વર જ્યોતિર્લિંગ", calendar: "સત્તાવાર કાર્યક્રમ", intro: "નાશિક, ગોદાવરી અને ત્ર્યંબકેશ્વરની પવિત્ર પરંપરા વિશે જાણો. પ્રવાસ પહેલાં સત્તાવાર સૂચનાઓ તપાસો.", visit: "ત્ર્યંબકેશ્વર દર્શન" },
  te: { eyebrow: "ప్రత్యేక యాత్ర • 2027", title: "నాసిక్–త్ర్యంబకేశ్వర్ సింహస్థ కుంభమేళా 2027", description: "గోదావరి తీరాన జరిగే పవిత్ర ఉత్సవం, త్ర్యంబకేశ్వర్ జ్యోతిర్లింగంతో అనుబంధం.", action: "కుంభమేళా 2027 తెలుసుకోండి", dates: "2027 యాత్ర", temple: "త్ర్యంబకేశ్వర్ జ్యోతిర్లింగం", calendar: "అధికారిక కార్యక్రమం", intro: "నాసిక్, గోదావరి మరియు త్ర్యంబకేశ్వర్ ఆధ్యాత్మిక వారసత్వాన్ని తెలుసుకోండి. ప్రయాణానికి ముందు అధికారిక సమాచారాన్ని పరిశీలించండి.", visit: "త్ర్యంబకేశ్వర్ దర్శనం" },
  ta: { eyebrow: "சிறப்புப் பயணம் • 2027", title: "நாசிக்–திரியம்பகேஸ்வர் சிம்ஹஸ்த கும்பமேளா 2027", description: "கோதாவரி நதிக்கரையில் நடைபெறும் புனித விழாவும் திரியம்பகேஸ்வர் ஜோதிர்லிங்கத் தொடர்பும்.", action: "கும்பமேளா 2027 பற்றி அறிக", dates: "2027 யாத்திரை", temple: "திரியம்பகேஸ்வர் ஜோதிர்லிங்கம்", calendar: "அதிகாரப்பூர்வ நிகழ்ச்சி நிரல்", intro: "நாசிக், கோதாவரி மற்றும் திரியம்பகேஸ்வரின் ஆன்மிக மரபை அறிக. பயணத்திற்கு முன் அதிகாரப்பூர்வ அறிவிப்புகளைப் பாருங்கள்.", visit: "திரியம்பகேஸ்வர் தரிசனம்" },
};

export function KumbhFeature() {
  const { lang, fontClass } = useLanguage();
  const t = KUMBH_TEXT[lang];
  return (
    <section aria-labelledby="kumbh-feature-heading" className="relative px-4 py-12 sm:py-20">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-card via-background to-primary/10 p-6 shadow-xl sm:p-10 lg:p-14">
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <p className={cn("mb-4 inline-flex items-center gap-2 text-sm font-semibold text-primary", fontClass)}><Waves className="size-5" aria-hidden="true" />{t.eyebrow}</p>
          <h2 id="kumbh-feature-heading" className={cn("text-3xl leading-snug text-foreground sm:text-4xl lg:text-5xl", fontClass)}>{t.title}</h2>
          <p className={cn("mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg", fontClass)}>{t.description}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/kumbh-mela-2027" className={cn("inline-flex min-h-12 items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary", fontClass)}>{t.action}<ArrowUpRight className="size-4" aria-hidden="true" /></Link>
            <span className={cn("inline-flex items-center gap-2 rounded-lg border border-border px-4 py-3 text-sm text-muted-foreground", fontClass)}><CalendarDays className="size-4" aria-hidden="true" />{t.dates}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
