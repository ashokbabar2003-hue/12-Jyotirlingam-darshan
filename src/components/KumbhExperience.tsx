import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Flame, MapPin, Mountain, Play, Waves } from "lucide-react";
import { useLanguage, toLocalDigits } from "@/hooks/use-language";
import { cn } from "@/lib/utils";
import templeImg from "@/assets/jl-trimbakeshwar.jpg";
import fallbackImg from "@/assets/hero-aarti.jpg";
import "./kumbh-experience.css";
import { SacredJourneyTransition } from "@/components/SacredJourneyTransition";
import type { SacredJourneyTransitionData } from "@/data/transitions";

// Each event uses a distinct archival Commons photograph. These images are illustrative,
// not documentation of the future 2027/2028 ceremonies.
const commonsPhoto = (name: string) =>
  "https://commons.wikimedia.org/wiki/Special:Redirect/file/" + encodeURIComponent(name) + "?width=1200";
const commonsPage = (name: string) =>
  "https://commons.wikimedia.org/wiki/File:" + encodeURIComponent(name.replaceAll(" ", "_"));
const MEDIA_FILES = [
  "Kumbhmela Nashik 2015 - the copper flag in Kushavarta, Trimbakeshwar.JPG",
  "Kumbh @ Nashik 2015 (21752545956).jpg",
  "Sadhu of Kumbhmela 2015.jpg",
  "Kumbhmela Nashik - holy dip.JPG",
  "Sihastha snan nashik.jpg",
  "Sihastha parvani nashik goda ghat.jpg",
  "Sihasta kumbhamela kushavart.jpg",
  "Kumbhmela Nashik 2015 - spire of Kushavarta, Trimbakeshwar.JPG"
];
const MEDIA_CREDITS = [
  "Prabirghose · CC BY-SA 4.0",
  "BOMBMAN · CC BY 2.0",
  "Wikimedia Commons · licence on source",
  "Prabirghose · CC BY-SA 4.0",
  "Prashant Kharote · CC BY-SA 4.0",
  "Prashant Kharote · CC BY-SA 4.0",
  "Prashant Kharote · CC BY-SA 4.0",
  "Prabirghose · CC BY-SA 4.0"
];
const MEDIA = {
  flag: commonsPhoto(MEDIA_FILES[0]),
  mela: commonsPhoto(MEDIA_FILES[1]),
  procession: commonsPhoto(MEDIA_FILES[2]),
  firstSnan: commonsPhoto(MEDIA_FILES[3]),
  secondSnan: commonsPhoto(MEDIA_FILES[4]),
  nashikSnan: commonsPhoto(MEDIA_FILES[5]),
  kushavarta: commonsPhoto(MEDIA_FILES[6]),
  closing: commonsPhoto(MEDIA_FILES[7]),
};
const PHOTO_CREDITS = "Historical photographs from Wikimedia Commons; each image links to its source and licensing information. Photos are illustrative and do not depict the specific 2027–28 ceremonies.";
const EVENTS = [
  { date: "2026-10-31", dateText: "31 OCT 2026", time: "12:02 PM", img: MEDIA.flag, location: "Nashik–Trimbakeshwar", label: ["Dhwajarohan (Flag Hoisting)","ध्वजारोहण (ध्वजवंदन)","ध्वजारोहण (ध्वज फहराना)"], description: "Dhwaj Parv, Jupiter’s entry into Leo, and commencement of Simhastha Mahakumbh." },
  { date: "2027-06-15", dateText: "15 JUN 2027", time: "All Day", img: MEDIA.mela, location: "Nashik–Trimbakeshwar", label: ["Major Mela Period Begins","मुख्य मेळा कालावधी सुरू","मुख्य मेला अवधि शुरू"], description: "The official major Mela period begins." },
  { date: "2027-07-29", dateText: "29 JUL 2027", time: "To be notified", img: MEDIA.procession, location: "Nashik", label: ["Nagar Pradakshina","नगर प्रदक्षिणा","नगर प्रदक्षिणा"], description: "The traditional procession around Nashik before the Amrut Snans." },
  { date: "2027-08-02", dateText: "02 AUG 2027", time: "All Day", img: MEDIA.firstSnan, location: "Nashik–Trimbakeshwar", label: ["First Amrut Snan","पहिले अमृत स्नान","पहला अमृत स्नान"], description: "The first sacred bathing day of Simhastha Mahakumbh." },
  { date: "2027-08-31", dateText: "31 AUG 2027", time: "All Day", img: MEDIA.secondSnan, location: "Nashik–Trimbakeshwar", label: ["Second Amrut Snan","दुसरे अमृत स्नान","दूसरा अमृत स्नान"], description: "The second sacred bathing day of Simhastha Mahakumbh." },
  { date: "2027-09-11", dateText: "11 SEP 2027", time: "All Day", img: MEDIA.nashikSnan, location: "Ramtirth, Nashik", label: ["Third Amrut Snan","तिसरे अमृत स्नान","तीसरा अमृत स्नान"], description: "The third sacred bathing day of Simhastha Mahakumbh at Ramtirth, Nashik." },
  { date: "2027-09-12", dateText: "12 SEP 2027", time: "All Day", img: MEDIA.kushavarta, location: "Kushavarta Tirth, Trimbakeshwar", label: ["Third Amrut Snan","तिसरे अमृत स्नान","तीसरा अमृत स्नान"], description: "The third sacred bathing day of Simhastha Mahakumbh at Kushavarta Tirth, Trimbakeshwar." },
  { date: "2028-07-24", dateText: "24 JUL 2028", time: "3:36 PM", img: MEDIA.closing, location: "Nashik–Trimbakeshwar", label: ["Dhwajavatarana (Flag Lowering)","ध्वजावतरण (ध्वज उतरवणे)","ध्वजावतरण (ध्वज उतारना)"], description: "Lowering of the flag, marking the conclusion of Simhastha Mahakumbh." },
];
const COPY = {
  en: { what: "What is the Kumbh Mela?", watch: "Explore the story", journey: "A journey of faith", steps: ["A sacred gathering","The holy rivers","A living tradition"], details: ["Pilgrims come together in a shared celebration of faith and spiritual renewal.","Ritual bathing in sacred waters is a central part of the pilgrimage.","At Nashik and Trimbakeshwar, Simhastha connects the Godavari with generations of devotion."], calendar: "The sacred Snan journey", locations: "Two sacred destinations", nashik: "Nashik · Ramkund", nashikDesc: "The Godavari ghats in Panchavati are a gathering place for pilgrims.", trimbak: "Trimbakeshwar · Kushavarta", trimbakDesc: "The sacred tank near Trimbakeshwar Jyotirlinga is another important bathing site.", temple: "Explore Trimbakeshwar", official: "Verify the official schedule", warning: "Historical images are illustrative; dates and arrangements may change." },
  mr: { what: "कुंभमेळा म्हणजे काय?", watch: "ही कथा अनुभवा", journey: "श्रद्धेची यात्रा", steps: ["श्रद्धेचा महासंगम","पवित्र नद्यांचे महत्त्व","जिवंत परंपरा"], details: ["आध्यात्मिक शुद्धी आणि श्रद्धेसाठी भाविक एकत्र येतात.","पवित्र जलात स्नान करणे हा या तीर्थयात्रेचा महत्त्वाचा भाग आहे.","नाशिक–त्र्यंबकेश्वर येथे सिंहस्थ गोदावरीला भक्तीच्या परंपरेशी जोडतो."], calendar: "पवित्र स्नानयात्रा", locations: "दोन पवित्र तीर्थक्षेत्रे", nashik: "नाशिक · रामकुंड", nashikDesc: "पंचवटीतील गोदावरी घाट भाविकांचे महत्त्वाचे तीर्थस्थान आहे.", trimbak: "त्र्यंबकेश्वर · कुशावर्त", trimbakDesc: "त्र्यंबकेश्वर ज्योतिर्लिंगाजवळील पवित्र कुंड हे आणखी एक स्नानस्थळ आहे.", temple: "त्र्यंबकेश्वर दर्शन", official: "अधिकृत कार्यक्रम तपासा", warning: "छायाचित्रे मागील वर्षांतील आहेत; तारखा आणि व्यवस्था बदलू शकतात." },
  hi: { what: "कुंभ मेला क्या है?", watch: "कहानी देखें", journey: "आस्था की यात्रा", steps: ["आस्था का महासंगम","पवित्र नदियाँ","जीवंत परंपरा"], details: ["श्रद्धालु आध्यात्मिक शुद्धि और आस्था के लिए एकत्र होते हैं।","पवित्र जल में स्नान इस तीर्थयात्रा का महत्वपूर्ण अंग है।","नाशिक–त्र्यंबकेश्वर में सिंहस्थ गोदावरी को भक्ति की परंपरा से जोड़ता है।"], calendar: "पवित्र स्नान यात्रा", locations: "दो पवित्र तीर्थस्थल", nashik: "नाशिक · रामकुंड", nashikDesc: "पंचवटी के गोदावरी घाट श्रद्धालुओं के लिए प्रमुख तीर्थस्थल हैं।", trimbak: "त्र्यंबकेश्वर · कुशावर्त", trimbakDesc: "त्र्यंबकेश्वर ज्योतिर्लिंग के पास स्थित पवित्र कुंड एक महत्वपूर्ण स्नान स्थल है।", temple: "त्र्यंबकेश्वर दर्शन", official: "आधिकारिक कार्यक्रम देखें", warning: "तस्वीरें पिछले वर्षों की हैं; तिथियाँ और व्यवस्थाएँ बदल सकती हैं।" },
  gu: { what: "કુંભ મેળો શું છે?", watch: "કથા જાણો", journey: "શ્રદ્ધાની યાત્રા", steps: ["શ્રદ્ધાનો પવિત્ર સંગમ", "પવિત્ર નદીઓ", "જીવંત પરંપરા"], details: ["શ્રદ્ધાળુઓ આસ્થા અને આધ્યાત્મિક શુદ્ધિ માટે ભેગા થાય છે.", "પવિત્ર જળમાં સ્નાન આ યાત્રાની મહત્વપૂર્ણ પરંપરા છે.", "નાશિક અને ત્ર્યંબકેશ્વરમાં સિંહસ્થ ગોદાવરીને ભક્તિની પરંપરા સાથે જોડે છે."], calendar: "પવિત્ર સ્નાન યાત્રા", locations: "બે પવિત્ર સ્થળો", nashik: "નાશિક · રામકુંડ", nashikDesc: "પંચવટીમાં ગોદાવરીના ઘાટ યાત્રાળુઓ માટે મહત્વના છે.", trimbak: "ત્ર્યંબકેશ્વર · કુશાવર્ત", trimbakDesc: "ત્ર્યંબકેશ્વર જ્યોતિર્લિંગ પાસેનું પવિત્ર કુંડ.", temple: "ત્ર્યંબકેશ્વર દર્શન", official: "સત્તાવાર સમયપત્રક તપાસો", warning: "ઐતિહાસિક તસવીરો ઉદાહરણરૂપ છે; તારીખો અને વ્યવસ્થા બદલાઈ શકે છે." },
  te: { what: "కుంభమేళా అంటే ఏమిటి?", watch: "కథను చూడండి", journey: "భక్తి యాత్ర", steps: ["పవిత్ర భక్తి సంగమం", "పవిత్ర నదులు", "సజీవ సంప్రదాయం"], details: ["భక్తులు విశ్వాసం, ఆధ్యాత్మిక శుద్ధి కోసం కలుస్తారు.", "పవిత్ర జలాల్లో స్నానం ఈ యాత్రలో ముఖ్యమైన సంప్రదాయం.", "నాసిక్, త్ర్యంబకేశ్వర్‌లో సింహస్థ గోదావరిని భక్తి సంప్రదాయంతో కలుపుతుంది."], calendar: "పవిత్ర స్నాన యాత్ర", locations: "రెండు పవిత్ర క్షేత్రాలు", nashik: "నాసిక్ · రామకుండ్", nashikDesc: "పంచవటిలోని గోదావరి ఘాట్లు యాత్రికులకు ముఖ్యమైనవి.", trimbak: "త్ర్యంబకేశ్వర్ · కుశావర్త", trimbakDesc: "త్ర్యంబకేశ్వర్ జ్యోతిర్లింగం సమీపంలోని పవిత్ర తీర్థం.", temple: "త్ర్యంబకేశ్వర్ దర్శనం", official: "అధికారిక తేదీలను పరిశీలించండి", warning: "చారిత్రక చిత్రాలు సూచన కోసం మాత్రమే; తేదీలు, ఏర్పాట్లు మారవచ్చు." },
  ta: { what: "கும்பமேளா என்றால் என்ன?", watch: "கதையை அறிக", journey: "பக்திப் பயணம்", steps: ["புனித பக்தர்கள் சங்கமம்", "புனித நதிகள்", "வாழும் மரபு"], details: ["பக்தர்கள் ஆன்மிகத் தூய்மைக்கும் நம்பிக்கைக்கும் ஒன்றுகூடுகின்றனர்.", "புனித நீரில் நீராடுதல் இந்த யாத்திரையின் முக்கிய மரபாகும்.", "நாசிக் மற்றும் திரிம்பகேஷ்வரில் சிம்ஹஸ்தம் கோதாவரியையும் பக்தி மரபையும் இணைக்கிறது."], calendar: "புனித நீராடல் பயணம்", locations: "இரண்டு புனிதத் தலங்கள்", nashik: "நாசிக் · ராம்குண்ட்", nashikDesc: "பஞ்சவட்டியில் உள்ள கோதாவரி படித்துறைகள் யாத்திரிகர்களுக்கு முக்கியமானவை.", trimbak: "திரிம்பகேஷ்வர் · குஷாவர்த்தம்", trimbakDesc: "திரிம்பகேஷ்வர் ஜோதிர்லிங்கத்திற்கு அருகிலுள்ள புனிதத் தீர்த்தம்.", temple: "திரிம்பகேஷ்வர் தரிசனம்", official: "அதிகாரப்பூர்வ அட்டவணையைச் சரிபார்க்கவும்", warning: "வரலாற்றுப் படங்கள் எடுத்துக்காட்டுகள்; தேதிகளும் ஏற்பாடுகளும் மாறலாம்." },
};

const KUMBH_UI = {
  en: { pause: "Pause", previous: "Previous scene", next: "Next scene", historic: "Historical pilgrimage photograph", state: "Maharashtra", journey: "Sacred Simhastha Journey", source: "Official event photo gallery", photoNote: "Historical photographs are illustrative and may not show the named ceremony." },
  mr: { pause: "थांबवा", previous: "मागील दृश्य", next: "पुढील दृश्य", historic: "तीर्थयात्रेचे ऐतिहासिक छायाचित्र", state: "महाराष्ट्र", journey: "सिंहस्थ स्नानयात्रा", source: "अधिकृत छायाचित्र दालन", photoNote: "ऐतिहासिक छायाचित्रे प्रातिनिधिक आहेत; ती संबंधित सोहळ्याची असतीलच असे नाही." },
  hi: { pause: "रोकें", previous: "पिछला दृश्य", next: "अगला दृश्य", historic: "तीर्थयात्रा का ऐतिहासिक चित्र", state: "महाराष्ट्र", journey: "सिंहस्थ स्नान यात्रा", source: "आधिकारिक चित्र दीर्घा", photoNote: "ऐतिहासिक चित्र उदाहरण के लिए हैं; वे संबंधित समारोह के नहीं भी हो सकते हैं।" },
  gu: { pause: "થોભાવો", previous: "પાછલું દૃશ્ય", next: "આગળનું દૃશ્ય", historic: "યાત્રાનું ઐતિહાસિક ચિત્ર", state: "મહારાષ્ટ્ર", journey: "પવિત્ર સિંહસ્થ યાત્રા", source: "સત્તાવાર ચિત્ર ગેલેરી", photoNote: "ઐતિહાસિક તસવીરો ઉદાહરણરૂપ છે; તે દર્શાવેલી વિધિની જ હોય તે જરૂરી નથી." },
  te: { pause: "ఆపండి", previous: "మునుపటి దృశ్యం", next: "తదుపరి దృశ్యం", historic: "యాత్ర చారిత్రక చిత్రం", state: "మహారాష్ట్ర", journey: "పవిత్ర సింహస్థ యాత్ర", source: "అధికారిక చిత్ర గ్యాలరీ", photoNote: "చారిత్రక చిత్రాలు సూచన కోసం మాత్రమే; అవి పేర్కొన్న వేడుకకు చెందినవి కాకపోవచ్చు." },
  ta: { pause: "நிறுத்து", previous: "முந்தைய காட்சி", next: "அடுத்த காட்சி", historic: "யாத்திரையின் வரலாற்றுப் படம்", state: "மகாராஷ்டிரா", journey: "புனித சிம்ஹஸ்த பயணம்", source: "அதிகாரப்பூர்வ படத் தொகுப்பு", photoNote: "வரலாற்றுப் படங்கள் எடுத்துக்காட்டுகளே; அவை குறிப்பிட்ட நிகழ்வைச் சேர்ந்ததாக இருக்க வேண்டியதில்லை." },
} as const;
const SELECTED_EVENT_LABELS = {
  en: "Selected event",
  mr: "निवडलेला कार्यक्रम",
  hi: "चयनित कार्यक्रम",
  gu: "પસંદ કરેલો કાર્યક્રમ",
  te: "ఎంచుకున్న కార్యక్రమం",
  ta: "தேர்ந்தெடுத்த நிகழ்வு",
} as const;
const BACK_TO_EVENTS_LABELS = {
  en: "Back to event selection",
  mr: "कार्यक्रम निवडीकडे परत जा",
  hi: "कार्यक्रम चयन पर वापस जाएँ",
  gu: "કાર્યક્રમ પસંદગી પર પાછા જાઓ",
  te: "కార్యక్రమ ఎంపికకు తిరిగి వెళ్ళండి",
  ta: "நிகழ்வு தேர்வுக்குத் திரும்பு",
} as const;
const EVENT_STATUS_LABELS = {
  en: { past: "Date passed", today: "Scheduled today", upcoming: "Upcoming" },
  mr: { past: "तारीख उलटली", today: "आज नियोजित", upcoming: "आगामी" },
  hi: { past: "तारीख बीत गई", today: "आज निर्धारित", upcoming: "आगामी" },
  gu: { past: "તારીખ વીતી ગઈ", today: "આજે નિર્ધારિત", upcoming: "આગામી" },
  te: { past: "తేదీ ముగిసింది", today: "ఈరోజు షెడ్యూల్", upcoming: "రాబోయేది" },
  ta: { past: "தேதி கடந்தது", today: "இன்று திட்டமிடப்பட்டது", upcoming: "வரவிருப்பது" },
} as const;
// Compare calendar dates in the event's India timezone, never the viewer's timezone.
// "Date passed" does not assert that the ceremony actually took place.
function indiaTodayISO() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find(p => p.type === type)?.value ?? "";
  return part("year") + "-" + part("month") + "-" + part("day");
}
function eventDateStatus(date: string, today: string): "past" | "today" | "upcoming" {
  return date < today ? "past" : date === today ? "today" : "upcoming";
}
const KUMBH_PLACES = {
  en: ["Nashik–Trimbakeshwar", "Nashik", "Ramtirth, Nashik", "Kushavarta Tirth, Trimbakeshwar"],
  mr: ["नाशिक–त्र्यंबकेश्वर", "नाशिक", "रामतीर्थ, नाशिक", "कुशावर्त तीर्थ, त्र्यंबकेश्वर"],
  hi: ["नाशिक–त्र्यंबकेश्वर", "नाशिक", "रामतीर्थ, नाशिक", "कुशावर्त तीर्थ, त्र्यंबकेश्वर"],
  gu: ["નાશિક–ત્ર્યંબકેશ્વર", "નાશિક", "રામતીર્થ, નાશિક", "કુશાવર્ત તીર્થ, ત્ર્યંબકેશ્વર"],
  te: ["నాసిక్–త్ర్యంబకేశ్వర్", "నాసిక్", "రామతీర్థం, నాసిక్", "కుశావర్త తీర్థం, త్ర్యంబకేశ్వర్"],
  ta: ["நாசிக்–திரிம்பகேஷ்வர்", "நாசிக்", "ராமதீர்த்தம், நாசிக்", "குஷாவர்த்த தீர்த்தம், திரிம்பகேஷ்வர்"],
} as const;
const KUMBH_DESCRIPTIONS = {
  en: ["Flag hoisting marks the beginning of Simhastha Mahakumbh.", "The major Mela period begins.", "The traditional city circumambulation precedes the Amrut Snan.", "The first sacred bathing day.", "The second sacred bathing day.", "The third sacred bathing day at Ramtirth, Nashik.", "The third sacred bathing day at Kushavarta Tirth, Trimbakeshwar.", "Flag lowering marks the conclusion of Simhastha Mahakumbh."],
  mr: ["ध्वजारोहणाने सिंहस्थ महाकुंभाची सुरुवात होते.", "मुख्य मेळा कालावधी सुरू होतो.", "अमृत स्नानापूर्वी पारंपरिक नगर प्रदक्षिणा होते.", "पहिला पवित्र अमृत स्नान दिवस.", "दुसरा पवित्र अमृत स्नान दिवस.", "रामतीर्थ, नाशिक येथे तिसरा अमृत स्नान दिवस.", "कुशावर्त तीर्थ, त्र्यंबकेश्वर येथे तिसरा अमृत स्नान दिवस.", "ध्वजावतरणाने सिंहस्थ महाकुंभाची सांगता होते."],
  hi: ["ध्वजारोहण से सिंहस्थ महाकुंभ का आरंभ होता है।", "मुख्य मेला अवधि आरंभ होती है।", "अमृत स्नान से पहले पारंपरिक नगर प्रदक्षिणा होती है।", "पहला पवित्र अमृत स्नान दिवस।", "दूसरा पवित्र अमृत स्नान दिवस।", "रामतीर्थ, नाशिक में तीसरा अमृत स्नान दिवस।", "कुशावर्त तीर्थ, त्र्यंबकेश्वर में तीसरा अमृत स्नान दिवस।", "ध्वजावतरण के साथ सिंहस्थ महाकुंभ का समापन होता है।"],
  gu: ["ધ્વજારોહણથી સિંહસ્થ મહાકુંભનો પ્રારંભ થાય છે.", "મુખ્ય મેળાનો સમય શરૂ થાય છે.", "અમૃત સ્નાન પહેલાં પરંપરાગત નગર પ્રદક્ષિણા થાય છે.", "પ્રથમ પવિત્ર અમૃત સ્નાન દિવસ.", "બીજો પવિત્ર અમૃત સ્નાન દિવસ.", "રામતીર્થ, નાશિક ખાતે ત્રીજો અમૃત સ્નાન દિવસ.", "કુશાવર્ત તીર્થ, ત્ર્યંબકેશ્વર ખાતે ત્રીજો અમૃત સ્નાન દિવસ.", "ધ્વજ ઉતારવાથી સિંહસ્થ મહાકુંભનું સમાપન થાય છે."],
  te: ["ధ్వజారోహణంతో సింహస్థ మహాకుంభం ప్రారంభమవుతుంది.", "ప్రధాన మేళా కాలం ప్రారంభమవుతుంది.", "అమృత స్నానానికి ముందు సంప్రదాయ నగర ప్రదక్షిణ జరుగుతుంది.", "మొదటి పవిత్ర అమృత స్నాన దినం.", "రెండవ పవిత్ర అమృత స్నాన దినం.", "నాసిక్ రామతీర్థంలో మూడవ అమృత స్నాన దినం.", "త్ర్యంబకేశ్వర్ కుశావర్త తీర్థంలో మూడవ అమృత స్నాన దినం.", "ధ్వజావతరణంతో సింహస్థ మహాకుంభం ముగుస్తుంది."],
  ta: ["கொடியேற்றத்துடன் சிம்ஹஸ்த மகாகும்பம் தொடங்குகிறது.", "முக்கிய விழாக்காலம் தொடங்குகிறது.", "அமிர்த நீராடலுக்கு முன் பாரம்பரிய நகர வலம் நடைபெறும்.", "முதல் புனித அமிர்த நீராடல் நாள்.", "இரண்டாம் புனித அமிர்த நீராடல் நாள்.", "நாசிக் ராமதீர்த்தத்தில் மூன்றாம் அமிர்த நீராடல் நாள்.", "திரிம்பகேஷ்வர் குஷாவர்த்த தீர்த்தத்தில் மூன்றாம் அமிர்த நீராடல் நாள்.", "கொடியிறக்கத்துடன் சிம்ஹஸ்த மகாகும்பம் நிறைவடைகிறது."],
} as const;
function eventPlace(location: string, lang: keyof typeof KUMBH_PLACES) {
  const index = KUMBH_PLACES.en.indexOf(location as typeof KUMBH_PLACES.en[number]);
  return index < 0 ? location : KUMBH_PLACES[lang][index];
}
function essence(index: number, lang: keyof typeof KUMBH_DESCRIPTIONS) { return KUMBH_DESCRIPTIONS[lang][index + 1]; }
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
  return toLocalDigits(new Intl.DateTimeFormat(DATE_LOCALES[lang], { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, day))), lang);
}
function localDateParts(iso: string, lang: keyof typeof DATE_LOCALES) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const locale = DATE_LOCALES[lang];
  const number = new Intl.NumberFormat(locale, { useGrouping: false });
  return {
    weekday: new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(date),
    day: toLocalDigits(number.format(day), lang),
    monthYear: toLocalDigits(new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(date), lang),
  };
}
function localEventTime(time: string, lang: keyof typeof TIME_TRANSLATIONS) {
  const t = TIME_TRANSLATIONS[lang];
  if (time === "All Day") return t.all;
  if (time === "To be notified") return t.pending;
  const [hour, minute] = time.split(":");
  const localized = new Intl.NumberFormat(DATE_LOCALES[lang], { minimumIntegerDigits: 2, useGrouping: false });
  const mins = Number(minute.slice(0, 2));
  return lang === "en" ? time : t.afternoon + " " + toLocalDigits(localized.format(Number(hour)) + ":" + localized.format(mins), lang);
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
  const t = COPY[lang];
  const ui = KUMBH_UI[lang];
  const langIndex = lang === "mr" ? 1 : lang === "hi" ? 2 : 0;
  const [scene, setScene] = useState(0);
  const [todayISO] = useState(indiaTodayISO);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const match = /^#kumbh-event-(\d+)$/.exec(window.location.hash);
    const index = match ? Number(match[1]) : -1;
    return index >= 0 && index < EVENTS.length ? index : null;
  });
  useEffect(() => {
    const syncSelectedEvent = () => {
      const match = /^#kumbh-event-(\d+)$/.exec(window.location.hash);
      const index = match ? Number(match[1]) : -1;
      if (index >= 0 && index < EVENTS.length) setSelectedEvent(index);
    };
    window.addEventListener("hashchange", syncSelectedEvent);
    syncSelectedEvent();
    return () => window.removeEventListener("hashchange", syncSelectedEvent);
  }, []);
  const returnToEventSelection = () => {
    const grid = document.getElementById("kumbh-event-selection");
    if (!grid) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    grid.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "start" });
  };
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
  const storyImages = [MEDIA.secondSnan, MEDIA.firstSnan, MEDIA.kushavarta];
  return <div ref={root} className="mx-auto max-w-6xl space-y-20 px-4 pb-20 pt-14 sm:space-y-28 sm:pt-20">
    <section aria-labelledby="kumbh-story-title" className="kumbh-reveal overflow-hidden rounded-3xl border border-primary/30 bg-card shadow-2xl">
      <div className="grid lg:grid-cols-[1.2fr_1fr]">
        <div className="relative min-h-[320px] overflow-hidden sm:min-h-[420px]">
          <Photo key={scene} src={storyImages[scene]} alt="Historic photograph of the Nashik Kumbh pilgrimage" className="kumbh-story-photo absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-background/10" />
          <div className="absolute bottom-5 left-5 flex items-center gap-3">
            <button type="button" onClick={() => setPlaying(p => !p)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/60 bg-background/80 px-4 text-sm font-semibold text-foreground backdrop-blur-md"><Play className="size-4 text-primary" />{playing ? ui.pause : t.watch}</button>
            <span className="text-xs text-foreground/80">{toLocalDigits(scene + 1, lang)} / {toLocalDigits(3, lang)}</span>
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
            <button type="button" aria-label={ui.previous} onClick={() => setScene(s => (s + 2) % 3)} className="grid size-11 place-items-center rounded-full border border-primary/40 hover:bg-primary/10"><ChevronLeft className="size-5" /></button>
            {t.steps.map((step, i) => <button key={step} type="button" aria-label={step} aria-current={scene === i ? "step" : undefined} onClick={() => setScene(i)} className={cn("h-2 rounded-full transition-all duration-500", scene === i ? "w-12 bg-primary" : "w-5 bg-primary/25")} />)}
            <button type="button" aria-label={ui.next} onClick={() => setScene(s => (s + 1) % 3)} className="grid size-11 place-items-center rounded-full border border-primary/40 hover:bg-primary/10"><ChevronRight className="size-5" /></button>
          </div>
        </div>
      </div>
    </section>
    <section id="snan-dates" aria-labelledby="kumbh-dates-title" className="scroll-mt-28">
      <div className="kumbh-reveal text-center"><Flame className="mx-auto mb-3 size-8 text-primary" /><h2 id="kumbh-dates-title" className={cn("text-3xl sm:text-4xl", fontClass)}>{t.calendar}</h2></div>
      <nav id="kumbh-event-selection" aria-label={t.calendar} className="kumbh-reveal mx-auto mt-8 grid max-w-5xl scroll-mt-28 grid-cols-2 gap-2 sm:grid-cols-4">
        {EVENTS.map((event, i) => (
          <a key={event.date} href={"#kumbh-event-" + i} onClick={() => setSelectedEvent(i)}
            aria-current={selectedEvent === i ? "location" : undefined}
            className={cn("flex min-h-14 flex-col justify-center rounded-xl border px-3 py-2 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              selectedEvent === i
                ? "border-amber-400 bg-amber-500/15 shadow-[0_0_0_1px_rgba(251,191,36,0.5),0_0_22px_rgba(251,191,36,0.15)]"
                : "border-primary/30 bg-card hover:border-primary hover:bg-primary/10"
            )}>
            <span className="flex items-center justify-between gap-2 text-xs font-semibold text-primary">
              {localDate(event.date, lang)}
              {selectedEvent === i && <span aria-hidden="true" className="text-amber-300">✓</span>}
            </span>
            <span className={cn("mt-1 text-sm leading-snug text-foreground", fontClass)}>{localEventLabel(event, i, lang)}</span>
            {selectedEvent === i && <span className={cn("mt-1 text-xs font-semibold text-amber-300", fontClass)}>{SELECTED_EVENT_LABELS[lang]}</span>}
            <span className={cn("mt-2 w-fit rounded-full px-2 py-0.5 text-xs font-medium",
              eventDateStatus(event.date, todayISO) === "today" ? "bg-primary text-primary-foreground" :
              eventDateStatus(event.date, todayISO) === "past" ? "bg-muted text-muted-foreground" :
              "border border-primary/40 text-primary"
            )}>{EVENT_STATUS_LABELS[lang][eventDateStatus(event.date, todayISO)]}</span>
          </a>
        ))}
      </nav>
      <div className="relative left-1/2 mt-10 w-screen -translate-x-1/2">
        {EVENTS.map((event, i) => {
          const transition: SacredJourneyTransitionData | null = i < EVENTS.length - 1 ? {
            fromSlug: "kumbh-" + event.date,
            toSlug: "kumbh-" + EVENTS[i + 1].date,
            fromIndex: i + 1,
            toIndex: i + 2,
            fromName: localEventLabel(event, i, lang),
            toName: localEventLabel(EVENTS[i + 1], i + 1, lang),
            fromLocation: eventPlace(event.location, lang),
            toLocation: eventPlace(EVENTS[i + 1].location, lang),
            fromState: ui.state,
            toState: ui.state,
            fromImage: event.img,
            toImage: EVENTS[i + 1].img,
            label: ui.journey,
            subtitle: localDate(event.date, lang) + " → " + localDate(EVENTS[i + 1].date, lang),
            spiritualEssence: essence(i, lang),
          } : null;
          return <div key={event.date} className="relative">

            <section id={"kumbh-event-" + i} className="kumbh-calendar-event relative mx-auto max-w-6xl scroll-mt-28 px-4 py-10 sm:py-16" aria-label={localEventLabel(event, i, lang)}>
              <div className="grid overflow-hidden rounded-3xl border border-primary/35 bg-card/95 shadow-2xl md:grid-cols-[minmax(220px,0.85fr)_minmax(280px,1.3fr)_minmax(260px,1.3fr)]">
                <div className="flex flex-col items-center justify-center border-b border-primary/30 bg-gradient-to-br from-primary/20 via-card to-card p-7 text-center md:border-b-0 md:border-r md:border-primary/30">
                  <span className="text-sm font-semibold tracking-wider text-primary">{toLocalDigits(new Intl.NumberFormat(DATE_LOCALES[lang], { minimumIntegerDigits: 2 }).format(i + 1), lang)} / {toLocalDigits(new Intl.NumberFormat(DATE_LOCALES[lang], { minimumIntegerDigits: 2 }).format(EVENTS.length), lang)}</span>
                  <time dateTime={event.date} className={cn("mt-4 flex flex-col items-center text-primary", fontClass)}>
                    <span className="text-lg font-semibold">{localDateParts(event.date, lang).weekday}</span>
                    <span className="my-2 text-7xl font-bold leading-none tabular-nums sm:text-8xl lg:text-9xl">{localDateParts(event.date, lang).day}</span>
                    <span className="text-xl font-semibold leading-relaxed sm:text-2xl">{localDateParts(event.date, lang).monthYear}</span>
                  </time>
                </div>
                <div className="flex flex-col justify-center p-6 sm:p-9">
                  <h3 className={cn("text-2xl leading-relaxed text-foreground sm:text-3xl", fontClass)}>{localEventLabel(event, i, lang)}</h3>
                  <span className={cn("mt-3 inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold",
                    eventDateStatus(event.date, todayISO) === "today" ? "bg-primary text-primary-foreground" :
                    eventDateStatus(event.date, todayISO) === "past" ? "bg-muted text-muted-foreground" :
                    "border border-primary/40 text-primary"
                  )}>{EVENT_STATUS_LABELS[lang][eventDateStatus(event.date, todayISO)]}</span>
                  <p className={cn("mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-primary/40 px-4 py-2 text-sm font-semibold text-primary", fontClass)}><CalendarDays className="size-4 shrink-0" />{localEventTime(event.time, lang)}</p>
                  <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{KUMBH_DESCRIPTIONS[lang][i]}</p>
                  <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="size-4 shrink-0 text-primary" />{eventPlace(event.location, lang)}</p>
                  <button type="button" onClick={returnToEventSelection}
                    className={cn("mt-6 inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-primary/45 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary", fontClass)}>
                    <ChevronLeft className="size-4 rotate-90" aria-hidden="true" />
                    {BACK_TO_EVENTS_LABELS[lang]}
                  </button>
                </div>
                <div className="relative min-h-60 overflow-hidden md:min-h-80">
                  <Photo src={event.img} alt={ui.historic + ": " + eventPlace(event.location, lang)} className="absolute inset-0 transition-transform duration-700 hover:scale-105" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/45 to-transparent" />
                  <a href={commonsPage(MEDIA_FILES[i])} target="_blank" rel="noopener noreferrer" className="absolute bottom-3 right-3 z-10 rounded-md bg-background/85 px-2 py-1 text-[11px] text-foreground underline underline-offset-2 backdrop-blur-sm">{MEDIA_CREDITS[i]}</a>
                </div>
              </div>
            </section>
            {transition && <SacredJourneyTransition transition={transition} lang={lang} isEn={lang === "en"} fontClass={fontClass} ritual={i === 0 ? "flag" : i === 1 ? "procession" : i >= 3 && i <= 5 ? "river" : i === 6 ? "closing" : "temple"} />}
          </div>;
        })}
      </div>
      <p className={cn("mx-auto max-w-3xl text-center text-sm text-muted-foreground", fontClass)}>{t.warning}</p>
      <div className="mt-5 text-center"><a href="https://simhasthamahakumbh.maharashtra.gov.in/#snan" target="_blank" rel="noopener noreferrer" className={cn("inline-flex min-h-11 items-center gap-2 font-semibold text-primary hover:underline", fontClass)}>{t.official}<ArrowUpRight className="size-4" /></a></div>
    </section>
    <section aria-labelledby="kumbh-places-title">
      <h2 id="kumbh-places-title" className={cn("kumbh-reveal mb-9 text-center text-3xl sm:text-4xl", fontClass)}>{t.locations}</h2>
      <div className="grid gap-6 md:grid-cols-2">
        <article className="kumbh-reveal group overflow-hidden rounded-2xl border border-primary/25 bg-card"><div className="h-56 overflow-hidden"><Photo src={MEDIA.mela} alt="Ramkund on the Godavari in Nashik" className="transition-transform duration-700 group-hover:scale-105" /></div><div className="p-6"><Waves className="mb-3 size-6 text-primary" /><h3 className={cn("text-2xl", fontClass)}>{t.nashik}</h3><p className={cn("mt-3 leading-relaxed text-muted-foreground", fontClass)}>{t.nashikDesc}</p></div></article>
        <article className="kumbh-reveal group overflow-hidden rounded-2xl border border-primary/25 bg-card"><div className="h-56 overflow-hidden"><img src={templeImg} alt="Trimbakeshwar Jyotirlinga temple" loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" /></div><div className="p-6"><Mountain className="mb-3 size-6 text-primary" /><h3 className={cn("text-2xl", fontClass)}>{t.trimbak}</h3><p className={cn("mt-3 leading-relaxed text-muted-foreground", fontClass)}>{t.trimbakDesc}</p><Link to="/$slug" params={{slug:"trimbakeshwar"}} className={cn("mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-primary",fontClass)}>{t.temple}<ArrowUpRight className="size-4" /></Link></div></article>
      </div>
    </section>
    <p className="text-center text-xs text-muted-foreground">{PHOTO_CREDITS} <a href="https://commons.wikimedia.org/" target="_blank" rel="noopener noreferrer" className="underline">Wikimedia Commons</a></p>
  </div>;
}
