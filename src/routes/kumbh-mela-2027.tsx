import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, CalendarDays, Clock3, Flame, ShieldCheck } from "lucide-react";
import { useLanguage, type Lang } from "@/hooks/use-language";
import { KUMBH_TEXT } from "@/components/KumbhFeature";
import { KumbhExperience } from "@/components/KumbhExperience";
import { cn } from "@/lib/utils";
import heroImg from "@/assets/hero-aarti.jpg";
import templeImg from "@/assets/jl-trimbakeshwar.jpg";

const OFFICIAL_SITE = "https://simhasthamahakumbh.maharashtra.gov.in/";
const OFFICIAL_SCHEDULE = "https://simhasthamahakumbh.maharashtra.gov.in/#snan";
const START_TIME = new Date("2027-06-15T00:00:00+05:30").getTime();

const EXTRA: Record<Lang, { back: string; countdown: string; begins: string; days: string; hours: string; minutes: string; seconds: string; started: string; what: string; whatDesc: string; keyDates: string; locations: string; nashik: string; nashikDesc: string; trimbak: string; trimbakDesc: string; official: string; officialNote: string; explore: string; travel: string; note: string; pilgrimage: string; dateLabels: string[] }> = {
  en: { back: "Back to Darshan", countdown: "Simhastha Kumbh 2027", begins: "Countdown to the main Mela period", days: "Days", hours: "Hours", minutes: "Minutes", seconds: "Seconds", started: "The 2027 Mela period has begun", what: "Where faith meets the Godavari", whatDesc: "At Nashik and Trimbakeshwar, pilgrims gather on the sacred banks of the Godavari. Explore the traditions of Simhastha and the Jyotirlinga pilgrimage while planning your visit with official guidance.", keyDates: "Sacred bathing calendar", locations: "Two sacred pilgrimage sites", nashik: "Nashik · Ramtirth", nashikDesc: "Sacred bathing traditions on the banks of the Godavari at Ramkund in Panchavati.", trimbak: "Trimbakeshwar · Kushavarta", trimbakDesc: "The holy Kushavarta Tirth near the ancient Trimbakeshwar Jyotirlinga temple.", official: "Official Kumbh portal", officialNote: "Dates and access arrangements may change. Confirm all travel details with the official authority.", explore: "Explore Trimbakeshwar", travel: "Plan your pilgrimage", note: "Schedule and pilgrim guidance", pilgrimage: "Faith · Tradition · Pilgrimage", dateLabels: ["Main Mela period begins", "First Amrut Snan", "Second Amrut Snan", "Third Amrut Snan · Nashik", "Third Amrut Snan · Trimbakeshwar"] },
  mr: { back: "दर्शनाकडे परत", countdown: "सिंहस्थ कुंभमेळा २०२७", begins: "मुख्य मेळा कालावधी सुरू होण्यासाठी", days: "दिवस", hours: "तास", minutes: "मिनिटे", seconds: "सेकंद", started: "२०२७ चा मेळा कालावधी सुरू झाला आहे", what: "गोदावरीच्या तीरावर श्रद्धेचा संगम", whatDesc: "नाशिक आणि त्र्यंबकेश्वर येथे पवित्र गोदावरीच्या तीरावर भाविक एकत्र येतात. सिंहस्थ परंपरा आणि ज्योतिर्लिंग यात्रेचा अनुभव घ्या; प्रवासासाठी अधिकृत सूचना तपासा.", keyDates: "पवित्र स्नान दिनदर्शिका", locations: "दोन पवित्र तीर्थक्षेत्रे", nashik: "नाशिक · रामतीर्थ", nashikDesc: "पंचवटीतील रामकुंड येथे गोदावरीच्या पवित्र तीरावर स्नान परंपरा.", trimbak: "त्र्यंबकेश्वर · कुशावर्त", trimbakDesc: "प्राचीन त्र्यंबकेश्वर ज्योतिर्लिंग मंदिराजवळील पवित्र कुशावर्त तीर्थ.", official: "अधिकृत कुंभ पोर्टल", officialNote: "तारखा आणि व्यवस्था बदलू शकतात. प्रवासापूर्वी अधिकृत माहिती तपासा.", explore: "त्र्यंबकेश्वर दर्शन", travel: "तीर्थयात्रेचे नियोजन", note: "कार्यक्रम व भाविकांसाठी मार्गदर्शन", pilgrimage: "श्रद्धा · परंपरा · तीर्थयात्रा", dateLabels: ["मुख्य मेळा कालावधी सुरू", "पहिले अमृत स्नान", "दुसरे अमृत स्नान", "तिसरे अमृत स्नान · नाशिक", "तिसरे अमृत स्नान · त्र्यंबकेश्वर"] },
  hi: { back: "दर्शन पर लौटें", countdown: "सिंहस्थ कुंभ मेला २०२७", begins: "मुख्य मेला अवधि शुरू होने में", days: "दिन", hours: "घंटे", minutes: "मिनट", seconds: "सेकंड", started: "२०२७ की मेला अवधि शुरू हो गई है", what: "गोदावरी के तट पर आस्था का संगम", whatDesc: "नाशिक और त्र्यंबकेश्वर में पवित्र गोदावरी के तट पर श्रद्धालु एकत्र होते हैं। सिंहस्थ परंपरा और ज्योतिर्लिंग यात्रा के बारे में जानें; यात्रा से पहले आधिकारिक निर्देश देखें।", keyDates: "पवित्र स्नान तिथियाँ", locations: "दो पवित्र तीर्थस्थल", nashik: "नाशिक · रामतीर्थ", nashikDesc: "पंचवटी के रामकुंड में गोदावरी के पवित्र तट पर स्नान परंपरा।", trimbak: "त्र्यंबकेश्वर · कुशावर्त", trimbakDesc: "प्राचीन त्र्यंबकेश्वर ज्योतिर्लिंग मंदिर के पास पवित्र कुशावर्त तीर्थ।", official: "आधिकारिक कुंभ पोर्टल", officialNote: "तिथियाँ और व्यवस्थाएँ बदल सकती हैं। यात्रा से पहले आधिकारिक जानकारी देखें।", explore: "त्र्यंबकेश्वर दर्शन", travel: "यात्रा की योजना बनाएँ", note: "कार्यक्रम और श्रद्धालुओं के लिए मार्गदर्शन", pilgrimage: "आस्था · परंपरा · तीर्थयात्रा", dateLabels: ["मुख्य मेला अवधि शुरू", "पहला अमृत स्नान", "दूसरा अमृत स्नान", "तीसरा अमृत स्नान · नाशिक", "तीसरा अमृत स्नान · त्र्यंबकेश्वर"] },
  gu: { back: "દર્શન પર પાછા", countdown: "સિંહસ્થ કુંભ મેળો ૨૦૨૭", begins: "મેળાની શરૂઆત સુધી", days: "દિવસ", hours: "કલાક", minutes: "મિનિટ", seconds: "સેકન્ડ", started: "૨૦૨૭નો મેળો શરૂ થયો છે", what: "ગોદાવરી કિનારે શ્રદ્ધાનો સંગમ", whatDesc: "નાશિક અને ત્ર્યંબકેશ્વરમાં ગોદાવરીના પવિત્ર કિનારે યાત્રાળુઓ ભેગા થાય છે. સત્તાવાર માર્ગદર્શન સાથે તમારી યાત્રા ગોઠવો.", keyDates: "પવિત્ર સ્નાન તારીખો", locations: "બે પવિત્ર તીર્થસ્થળો", nashik: "નાશિક · રામતીર્થ", nashikDesc: "પંચવટીના રામકુંડ ખાતે ગોદાવરી કિનારે પવિત્ર સ્નાન.", trimbak: "ત્ર્યંબકેશ્વર · કુશાવર્ત", trimbakDesc: "ત્ર્યંબકેશ્વર જ્યોતિર્લિંગ મંદિર નજીકનું પવિત્ર કુશાવર્ત તીર્થ.", official: "સત્તાવાર કુંભ પોર્ટલ", officialNote: "તારીખો અને વ્યવસ્થામાં ફેરફાર થઈ શકે છે. સત્તાવાર માહિતી તપાસો.", explore: "ત્ર્યંબકેશ્વર દર્શન", travel: "યાત્રાનું આયોજન", note: "કાર્યક્રમ અને યાત્રાળુ માર્ગદર્શન", pilgrimage: "શ્રદ્ધા · પરંપરા · યાત્રા", dateLabels: ["મુખ્ય મેળાની શરૂઆત", "પ્રથમ અમૃત સ્નાન", "બીજું અમૃત સ્નાન", "ત્રીજું અમૃત સ્નાન · નાશિક", "ત્રીજું અમૃત સ્નાન · ત્ર્યંબકેશ્વર"] },
  te: { back: "దర్శనానికి తిరిగి", countdown: "సింహస్థ కుంభమేళా 2027", begins: "ప్రధాన మేళా ప్రారంభానికి", days: "రోజులు", hours: "గంటలు", minutes: "నిమిషాలు", seconds: "సెకన్లు", started: "2027 మేళా కాలం ప్రారంభమైంది", what: "గోదావరి తీరాన భక్తి సంగమం", whatDesc: "నాసిక్, త్ర్యంబకేశ్వర్ వద్ద గోదావరి పవిత్ర తీరాన భక్తులు సమావేశమవుతారు. అధికారిక సూచనలతో మీ యాత్రను ప్లాన్ చేసుకోండి.", keyDates: "పవిత్ర స్నాన తేదీలు", locations: "రెండు పవిత్ర యాత్రా స్థలాలు", nashik: "నాసిక్ · రామ్‌తీర్థ్", nashikDesc: "పంచవటిలోని రామ్‌కుండ్ వద్ద గోదావరి తీరాన పవిత్ర స్నాన సంప్రదాయం.", trimbak: "త్ర్యంబకేశ్వర్ · కుశావర్త", trimbakDesc: "త్ర్యంబకేశ్వర్ జ్యోతిర్లింగ ఆలయం సమీపంలోని పవిత్ర కుశావర్త తీర్థం.", official: "అధికారిక కుంభ పోర్టల్", officialNote: "తేదీలు, ఏర్పాట్లు మారవచ్చు. అధికారిక సమాచారాన్ని పరిశీలించండి.", explore: "త్ర్యంబకేశ్వర్ దర్శనం", travel: "యాత్ర ప్రణాళిక", note: "షెడ్యూల్, యాత్రికుల మార్గదర్శకం", pilgrimage: "భక్తి · సంప్రదాయం · యాత్ర", dateLabels: ["ప్రధాన మేళా ప్రారంభం", "మొదటి అమృత స్నానం", "రెండవ అమృత స్నానం", "మూడవ అమృత స్నానం · నాసిక్", "మూడవ అమృత స్నానం · త్ర్యంబకేశ్వర్"] },
  ta: { back: "தரிசனத்திற்குத் திரும்பு", countdown: "சிம்ஹஸ்த கும்பமேளா 2027", begins: "முக்கிய விழா தொடங்க", days: "நாட்கள்", hours: "மணி", minutes: "நிமிடம்", seconds: "விநாடி", started: "2027 விழாக்காலம் தொடங்கியுள்ளது", what: "கோதாவரிக் கரையில் பக்தியின் சங்கமம்", whatDesc: "நாசிக் மற்றும் திரியம்பகேஸ்வரில் கோதாவரியின் புனிதக் கரையில் பக்தர்கள் கூடுகின்றனர். அதிகாரப்பூர்வ வழிகாட்டுதலுடன் பயணத்தைத் திட்டமிடுங்கள்.", keyDates: "புனித நீராடல் நாட்கள்", locations: "இரு புனித யாத்திரைத் தலங்கள்", nashik: "நாசிக் · ராம்தீர்த்தம்", nashikDesc: "பஞ்சவட்டியில் ராம்குண்டில் கோதாவரிக் கரையோரப் புனித நீராடல் மரபு.", trimbak: "திரியம்பகேஸ்வர் · குஷாவர்த்தம்", trimbakDesc: "திரியம்பகேஸ்வர் ஜோதிர்லிங்கக் கோயிலுக்கு அருகிலுள்ள புனித குஷாவர்த்த தீர்த்தம்.", official: "அதிகாரப்பூர்வ கும்ப இணையதளம்", officialNote: "தேதிகளும் ஏற்பாடுகளும் மாறலாம். அதிகாரப்பூர்வத் தகவலைச் சரிபார்க்கவும்.", explore: "திரியம்பகேஸ்வர் தரிசனம்", travel: "பயணத் திட்டம்", note: "நிகழ்ச்சி அட்டவணை மற்றும் பயணிகள் வழிகாட்டுதல்", pilgrimage: "பக்தி · மரபு · யாத்திரை", dateLabels: ["முக்கிய விழா தொடக்கம்", "முதல் அமிர்த நீராடல்", "இரண்டாம் அமிர்த நீராடல்", "மூன்றாம் அமிர்த நீராடல் · நாசிக்", "மூன்றாம் அமிர்த நீராடல் · திரியம்பகேஸ்வர்"] },
};

const SNAN_EVENTS = [
  { date: "2027-06-15", display: "15 JUN 2027" },
  { date: "2027-08-02", display: "02 AUG 2027" },
  { date: "2027-08-31", display: "31 AUG 2027" },
  { date: "2027-09-11", display: "11 SEP 2027" },
  { date: "2027-09-12", display: "12 SEP 2027" },
];

function useCountdown() {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, START_TIME - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return remaining;
}

export const Route = createFileRoute("/kumbh-mela-2027")({
  head: () => ({ meta: [
    { title: "Nashik–Trimbakeshwar Simhastha Kumbh Mela 2027 | 12 Jyotirlinga Darshan" },
    { name: "description", content: "Explore the Nashik–Trimbakeshwar Kumbh Mela 2027, sacred bathing dates, Trimbakeshwar Jyotirlinga and the official pilgrim schedule." },
  ] }),
  component: KumbhPage,
});

function KumbhPage() {
  const { lang, fontClass } = useLanguage();
  const t = KUMBH_TEXT[lang];
  const x = EXTRA[lang];
  const remaining = useCountdown();
  const parts = remaining === null ? null : [
    Math.floor(remaining / 86400000),
    Math.floor((remaining / 3600000) % 24),
    Math.floor((remaining / 60000) % 60),
    Math.floor((remaining / 1000) % 60),
  ];
  return (
    <main className="min-h-screen bg-background">
      <section className="relative isolate overflow-hidden border-b border-primary/25">
        <img src={heroImg} alt="Devotional aarti with glowing lamps" className="absolute inset-0 -z-20 size-full object-cover opacity-50" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background/95 via-background/80 to-background/45" />
        <div className="mx-auto max-w-6xl px-4 pb-28 pt-10 sm:pb-36 sm:pt-16">
          <Link to="/" className={cn("inline-flex min-h-11 items-center gap-2 text-sm text-foreground/80 hover:text-primary", fontClass)}><ArrowLeft className="size-4" />{x.back}</Link>
          <div className="mt-12 max-w-3xl sm:mt-16">
            <div className="mb-5 flex items-center gap-3 text-primary"><Flame className="size-7" /><span className={cn("text-sm font-semibold", fontClass)}>{x.pilgrimage}</span></div>
            <h1 className={cn("text-4xl leading-tight text-foreground drop-shadow-lg sm:text-5xl lg:text-6xl", fontClass)}>{t.title}</h1>
            <p className={cn("mt-6 max-w-2xl text-lg leading-relaxed text-foreground/90 sm:text-xl", fontClass)}>{t.description}</p>
            <a href="#snan-dates" className={cn("mt-7 inline-flex min-h-12 items-center gap-2 rounded-full border border-primary/70 bg-background/70 px-6 py-3 font-semibold text-primary backdrop-blur-sm hover:bg-primary/15", fontClass)}><CalendarDays className="size-4" />{x.keyDates}<ArrowUpRight className="size-4" /></a>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-16 max-w-5xl px-4">
        <section aria-label={x.countdown} className="rounded-2xl border border-primary/60 bg-card/95 p-5 shadow-2xl backdrop-blur-lg sm:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div><p className={cn("text-lg font-semibold text-primary", fontClass)}><Clock3 className="mr-2 inline size-5" />{x.countdown}</p><p className={cn("mt-1 text-sm text-muted-foreground", fontClass)}>{remaining === 0 ? x.started : x.begins}</p></div>
            <div className="grid grid-cols-4 gap-2 sm:gap-3" aria-live="off">
              {[x.days, x.hours, x.minutes, x.seconds].map((label, i) => (
                <div key={label} className="min-w-0 rounded-xl border border-primary/25 bg-background/70 px-2 py-3 text-center sm:min-w-20 sm:px-4">
                  <span className="block text-xl font-bold tabular-nums text-foreground sm:text-3xl">{parts ? String(parts[i]).padStart(2, "0") : "–"}</span>
                  <span className={cn("mt-1 block text-xs text-muted-foreground", fontClass)}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="mx-auto max-w-6xl space-y-20 px-4 pb-20 pt-14 sm:pt-20">
      </div>
      <KumbhExperience />
      <div className="mx-auto max-w-6xl px-4 pb-20">
        <section className="rounded-2xl border border-primary/35 bg-gradient-to-r from-card to-primary/10 p-6 sm:p-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div><p className={cn("flex items-center gap-2 text-lg font-semibold text-foreground", fontClass)}><ShieldCheck className="size-5 text-primary" />{x.note}</p><p className={cn("mt-2 text-sm text-muted-foreground", fontClass)}>{x.officialNote}</p></div>
            <a href={OFFICIAL_SITE} target="_blank" rel="noopener noreferrer" className={cn("inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90", fontClass)}>{x.official}<ArrowUpRight className="size-4" /></a>
          </div>
        </section>
      </div>
    </main>
  );
}
