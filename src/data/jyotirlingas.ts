import somnath from "@/assets/jl-somnath.jpg";
import mallikarjuna from "@/assets/jl-mallikarjuna.jpg";
import mahakaleshwar from "@/assets/jl-mahakaleshwar.jpg";
import omkareshwar from "@/assets/jl-omkareshwar.jpg";
import kedarnath from "@/assets/jl-kedarnath.jpg";
import bhimashankar from "@/assets/jl-bhimashankar.jpg";
import kashi from "@/assets/jl-kashi.jpg";
import trimbakeshwar from "@/assets/jl-trimbakeshwar.jpg";
import baidyanath from "@/assets/jl-baidyanath.jpg";
import nageshwar from "@/assets/jl-nageshwar.jpg";
import rameshwaram from "@/assets/jl-rameshwaram.jpg";
import grishneshwar from "@/assets/jl-grishneshwar.jpg";

import type { Lang } from "@/hooks/use-language";

export type TranslatableLang = Exclude<Lang, "en" | "mr">;

export interface LocalizedFields {
  name: string;
  location: string;
  state: string;
}

export interface Jyotirlinga {
  slug: string;
  number: number;
  name: string;
  nameMr: string;
  deity: string;
  location: string;
  locationMr: string;
  state: string;
  stateMr: string;
  river: string;
  description: string;
  significance: string;
  image: string;
  /** Placeholder live YouTube link — edit to your official channel/stream. */
  youtubeUrl: string;
  /** Fallback YouTube link used if the live one fails to embed/play. */
  defaultYoutubeUrl: string;
  /** Localized name/location/state for hi, gu, te, ta. */
  i18n: Record<TranslatableLang, LocalizedFields>;
}

const liveSearch = (q: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(q + " live darshan")}`;

export const jyotirlingas: Jyotirlinga[] = [
  {
    slug: "somnath",
    number: 1,
    name: "Somnath",
    nameMr: "सोमनाथ",
    deity: "Shri Somnath Mahadev",
    location: "Prabhas Patan, Veraval",
    locationMr: "प्रभास पाटण, वेरावळ",
    state: "Gujarat",
    stateMr: "गुजरात",
    river: "Arabian Sea coast",
    description:
      "The first among the twelve Jyotirlingas, standing eternal on the shore of the Arabian Sea. Rebuilt many times through history, Somnath shines as a symbol of unshakeable faith.",
    significance:
      "Worshipped by the Moon God (Soma) himself, who regained his lustre here by Lord Shiva's grace — hence the name Somnath, 'Lord of the Moon'.",
    image: somnath,
    youtubeUrl: liveSearch("Somnath Temple"),
    defaultYoutubeUrl: liveSearch("Somnath Temple"),
    i18n: {
      hi: { name: "सोमनाथ", location: "प्रभास पाटन, वेरावल", state: "गुजरात" },
      gu: { name: "સોમનાથ", location: "પ્રભાસ પાટણ, વેરાવળ", state: "ગુજરાત" },
      te: { name: "సోమనాథ్", location: "ప్రభాస్ పాటన్, వేరావల్", state: "గుజరాత్" },
      ta: { name: "சோம்நாத்", location: "பிரபாஸ் பாடண், வேராவல்", state: "குஜராத்" },
    },
  },
  {
    slug: "mallikarjuna",
    number: 2,
    name: "Mallikarjuna",
    nameMr: "मल्लिकार्जुन",
    deity: "Shri Mallikarjuna Swamy",
    location: "Srisailam",
    locationMr: "श्रीशैलम",
    state: "Andhra Pradesh",
    stateMr: "आंध्र प्रदेश",
    river: "Krishna (Patal Ganga)",
    description:
      "Perched on the Nallamala hills beside the Krishna river, Srisailam is revered as both a Jyotirlinga and a Shakti Peetha — the abode of Shiva as Mallikarjuna and Devi as Bhramaramba.",
    significance:
      "Here Lord Shiva and Goddess Parvati came to console their son Kartikeya, making it one of the most sacred Shaiva sites of the South.",
    image: mallikarjuna,
    youtubeUrl: liveSearch("Srisailam Mallikarjuna Temple"),
    defaultYoutubeUrl: liveSearch("Srisailam Mallikarjuna Temple"),
    i18n: {
      hi: { name: "मल्लिकार्जुन", location: "श्रीशैलम", state: "आंध्र प्रदेश" },
      gu: { name: "મલ્લિકાર્જુન", location: "શ્રીશૈલમ", state: "આંધ્ર પ્રદેશ" },
      te: { name: "మల్లికార్జున", location: "శ్రీశైలం", state: "ఆంధ్ర ప్రదేశ్" },
      ta: { name: "மல்லிகார்ஜுன", location: "ஸ்ரீசைலம்", state: "ஆந்திரப் பிரதேசம்" },
    },
  },
  {
    slug: "mahakaleshwar",
    number: 3,
    name: "Mahakaleshwar",
    nameMr: "महाकालेश्वर",
    deity: "Shri Mahakaleshwar",
    location: "Ujjain",
    locationMr: "उज्जैन",
    state: "Madhya Pradesh",
    stateMr: "मध्य प्रदेश",
    river: "Shipra",
    description:
      "The only south-facing Jyotirlinga, famed for its predawn Bhasma Aarti where the lingam is adorned with sacred ash. Mahakal is the timeless Lord of Ujjain.",
    significance:
      "Regarded as Swayambhu (self-manifested), Mahakal is believed to be the ruler of time and death, protecting his devotees from fear.",
    image: mahakaleshwar,
    youtubeUrl: liveSearch("Mahakaleshwar Ujjain Bhasma Aarti"),
    defaultYoutubeUrl: liveSearch("Mahakaleshwar Ujjain Bhasma Aarti"),
    i18n: {
      hi: { name: "महाकालेश्वर", location: "उज्जैन", state: "मध्य प्रदेश" },
      gu: { name: "મહાકાલેશ્વર", location: "ઉજ્જૈન", state: "મધ્ય પ્રદેશ" },
      te: { name: "మహాకాళేశ్వర్", location: "ఉజ్జయిని", state: "మధ్యప్రదేశ్" },
      ta: { name: "மகாகாலேஸ்வரர்", location: "உஜ்ஜயினி", state: "மத்தியப் பிரதேசம்" },
    },
  },
  {
    slug: "omkareshwar",
    number: 4,
    name: "Omkareshwar",
    nameMr: "ओंकारेश्वर",
    deity: "Shri Omkareshwar",
    location: "Mandhata Island",
    locationMr: "मांधाता बेट",
    state: "Madhya Pradesh",
    stateMr: "मध्य प्रदेश",
    river: "Narmada",
    description:
      "Set on a sacred island in the Narmada shaped like the holy symbol 'Om', Omkareshwar radiates serenity from every ghat and shrine.",
    significance:
      "The very form of the island, resembling Omkara, makes this one of the most spiritually charged of all Jyotirlingas.",
    image: omkareshwar,
    youtubeUrl: liveSearch("Omkareshwar Temple"),
    defaultYoutubeUrl: liveSearch("Omkareshwar Temple"),
    i18n: {
      hi: { name: "ओंकारेश्वर", location: "मांधाता द्वीप", state: "मध्य प्रदेश" },
      gu: { name: "ઓમ્કારેશ્વર", location: "માંધાતા ટાપુ", state: "મધ્ય પ્રદેશ" },
      te: { name: "ఓంకారేశ్వర్", location: "మాంధాత ద్వీపం", state: "మధ్యప్రదేశ్" },
      ta: { name: "ஓங்காரேஸ்வரர்", location: "மாந்தாதா தீவு", state: "மத்தியப் பிரதேசம்" },
    },
  },
  {
    slug: "kedarnath",
    number: 5,
    name: "Kedarnath",
    nameMr: "केदारनाथ",
    deity: "Shri Kedarnath",
    location: "Kedarnath, Rudraprayag",
    locationMr: "केदारनाथ, रुद्रप्रयाग",
    state: "Uttarakhand",
    stateMr: "उत्तराखंड",
    river: "Mandakini",
    description:
      "Cradled high in the Garhwal Himalayas, this ancient stone shrine is among the holiest pilgrimages — open only when the mountain passes thaw.",
    significance:
      "Here Shiva appeared as a bull and dived into the ground, leaving his hump worshipped as the Kedarnath lingam.",
    image: kedarnath,
    youtubeUrl: liveSearch("Kedarnath Temple"),
    defaultYoutubeUrl: liveSearch("Kedarnath Temple"),
    i18n: {
      hi: { name: "केदारनाथ", location: "केदारनाथ, रुद्रप्रयाग", state: "उत्तराखंड" },
      gu: { name: "કેદારનાથ", location: "કેદારનાથ, રુદ્રપ્રયાગ", state: "ઉત્તરાખંડ" },
      te: { name: "కేదార్‌నాథ్", location: "కేదార్‌నాథ్, రుద్రప్రయాగ్", state: "ఉత్తరాఖండ్" },
      ta: { name: "கேதார்நாத்", location: "கேதார்நாத், ருத்திரப்ரயாக்", state: "உத்தராகண்ட்" },
    },
  },
  {
    slug: "bhimashankar",
    number: 6,
    name: "Bhimashankar",
    nameMr: "भीमाशंकर",
    deity: "Shri Bhimashankar",
    location: "Bhorgiri, Pune",
    locationMr: "भोरगिरी, पुणे",
    state: "Maharashtra",
    stateMr: "महाराष्ट्र",
    river: "Bhima (origin)",
    description:
      "Nestled in the misty Sahyadri Western Ghats, Bhimashankar marks the source of the Bhima river amid dense, sacred forest.",
    significance:
      "Lord Shiva is said to have slain the demon Tripurasura here; the sweat of his battle gave rise to the Bhima river.",
    image: bhimashankar,
    youtubeUrl: liveSearch("Bhimashankar Temple"),
    defaultYoutubeUrl: liveSearch("Bhimashankar Temple"),
    i18n: {
      hi: { name: "भीमाशंकर", location: "भोरगिरी, पुणे", state: "महाराष्ट्र" },
      gu: { name: "ભીમાશંકર", location: "ભોરગિરી, પુણે", state: "મહારાષ્ટ્ર" },
      te: { name: "భీమశంకర్", location: "భోర్‌గిరి, పూణె", state: "మహారాష్ట్ర" },
      ta: { name: "பீமாசங்கர்", location: "போர்கிரி, புனே", state: "மகாராஷ்டிரா" },
    },
  },
  {
    slug: "kashi-vishwanath",
    number: 7,
    name: "Kashi Vishwanath",
    nameMr: "काशी विश्वनाथ",
    deity: "Shri Vishwanath",
    location: "Varanasi (Kashi)",
    locationMr: "वाराणसी (काशी)",
    state: "Uttar Pradesh",
    stateMr: "उत्तर प्रदेश",
    river: "Ganga",
    description:
      "The golden-spired heart of Kashi, the eternal city on the Ganga. Vishwanath, 'Lord of the Universe', presides over the most ancient living city of faith.",
    significance:
      "It is believed that Shiva himself whispers the Taraka mantra of liberation into the ear of those who depart in Kashi.",
    image: kashi,
    youtubeUrl: liveSearch("Kashi Vishwanath Ganga Aarti"),
    defaultYoutubeUrl: liveSearch("Kashi Vishwanath Ganga Aarti"),
    i18n: {
      hi: { name: "काशी विश्वनाथ", location: "वाराणसी (काशी)", state: "उत्तर प्रदेश" },
      gu: { name: "કાશી વિશ્વનાથ", location: "વારાણસી (કાશી)", state: "ઉત્તર પ્રદેશ" },
      te: { name: "కాశీ విశ్వనాథ", location: "వారాణసి (కాశి)", state: "ఉత్తరప్రదేశ్" },
      ta: { name: "காசி விசுவநாதர்", location: "வாரணாசி (காசி)", state: "உத்தரப் பிரதேசம்" },
    },
  },
  {
    slug: "trimbakeshwar",
    number: 8,
    name: "Trimbakeshwar",
    nameMr: "त्र्यंबकेश्वर",
    deity: "Shri Trimbakeshwar",
    location: "Trimbak, Nashik",
    locationMr: "त्र्यंबक, नाशिक",
    state: "Maharashtra",
    stateMr: "महाराष्ट्र",
    river: "Godavari (origin)",
    description:
      "At the foot of Brahmagiri hill rises the source of the Godavari. The lingam here bears three faces — Brahma, Vishnu and Shiva.",
    significance:
      "Uniquely, the three-faced lingam represents the holy trinity, making Trimbakeshwar a site of profound cosmic balance.",
    image: trimbakeshwar,
    youtubeUrl: liveSearch("Trimbakeshwar Temple"),
    defaultYoutubeUrl: liveSearch("Trimbakeshwar Temple"),
    i18n: {
      hi: { name: "त्र्यंबकेश्वर", location: "त्र्यंबक, नाशिक", state: "महाराष्ट्र" },
      gu: { name: "ત્ર્યંબકેશ્વર", location: "ત્ર્યંબક, નાશિક", state: "મહારાષ્ટ્ર" },
      te: { name: "త్రయంబకేశ్వర్", location: "త్రయంబక్, నాసిక్", state: "మహారాష్ట్ర" },
      ta: { name: "திரியம்பகேஸ்வரர்", location: "திரியம்பகம், நாசிக்", state: "மகாராஷ்டிரா" },
    },
  },
  {
    slug: "baidyanath",
    number: 9,
    name: "Baidyanath",
    nameMr: "बैद्यनाथ",
    deity: "Shri Baidyanath (Vaidyanath)",
    location: "Deoghar",
    locationMr: "देवघर",
    state: "Jharkhand",
    stateMr: "झारखंड",
    river: "Near the Ganga plains",
    description:
      "Known as Baba Baidyanath Dham, this temple draws rivers of saffron-clad pilgrims who carry holy water on foot during the Shravan month.",
    significance:
      "Worshipped as the 'divine physician', Baidyanath is believed to heal ailments of body and soul for the truly devoted.",
    image: baidyanath,
    youtubeUrl: liveSearch("Baidyanath Dham Deoghar"),
    defaultYoutubeUrl: liveSearch("Baidyanath Dham Deoghar"),
    i18n: {
      hi: { name: "बैद्यनाथ", location: "देवघर", state: "झारखंड" },
      gu: { name: "બૈદ્યનાથ", location: "દેવઘર", state: "ઝારખંડ" },
      te: { name: "బైద్యనాథ్", location: "దేవ్‌ఘర్", state: "జార్ఖండ్" },
      ta: { name: "பைத்யநாத்", location: "தியோகர்", state: "ஜார்க்கண்ட்" },
    },
  },
  {
    slug: "nageshwar",
    number: 10,
    name: "Nageshwar",
    nameMr: "नागेश्वर",
    deity: "Shri Nageshwar",
    location: "Near Dwarka",
    locationMr: "द्वारकेजवळ",
    state: "Gujarat",
    stateMr: "गुजरात",
    river: "Arabian Sea coast",
    description:
      "Beside the sea near Dwarka, Nageshwar is guarded by a towering image of the meditating Shiva, radiating calm to all who arrive.",
    significance:
      "Nageshwar, 'Lord of Serpents', is revered as a protector against all poison and negativity for his devotees.",
    image: nageshwar,
    youtubeUrl: liveSearch("Nageshwar Jyotirlinga Dwarka"),
    defaultYoutubeUrl: liveSearch("Nageshwar Jyotirlinga Dwarka"),
    i18n: {
      hi: { name: "नागेश्वर", location: "द्वारका के पास", state: "गुजरात" },
      gu: { name: "નાગેશ્વર", location: "દ્વારકા પાસે", state: "ગુજરાત" },
      te: { name: "నాగేశ్వర్", location: "ద్వారక సమీపంలో", state: "గుజరాత్" },
      ta: { name: "நாகேஸ்வரர்", location: "துவாரகை அருகே", state: "குஜராத்" },
    },
  },
  {
    slug: "rameshwaram",
    number: 11,
    name: "Rameshwaram",
    nameMr: "रामेश्वरम",
    deity: "Shri Ramanathaswamy",
    location: "Rameswaram Island",
    locationMr: "रामेश्वरम बेट",
    state: "Tamil Nadu",
    stateMr: "तमिळनाडू",
    river: "Bay of Bengal / Indian Ocean",
    description:
      "Famous for the longest ornate temple corridor in India, Ramanathaswamy temple shimmers with thousands of carved pillars and sacred bathing wells.",
    significance:
      "Lord Rama is said to have worshipped Shiva here to absolve himself before and after the war in Lanka.",
    image: rameshwaram,
    youtubeUrl: liveSearch("Rameshwaram Ramanathaswamy Temple"),
    defaultYoutubeUrl: liveSearch("Rameshwaram Ramanathaswamy Temple"),
    i18n: {
      hi: { name: "रामेश्वरम", location: "रामेश्वरम द्वीप", state: "तमिलनाडु" },
      gu: { name: "રામેશ્વરમ", location: "રામેશ્વરમ ટાપુ", state: "તમિલનાડુ" },
      te: { name: "రామేశ్వరం", location: "రామేశ్వరం ద్వీపం", state: "తమిళనాడు" },
      ta: { name: "ராமேஸ்வரம்", location: "ராமேஸ்வரம் தீவு", state: "தமிழ்நாடு" },
    },
  },
  {
    slug: "grishneshwar",
    number: 12,
    name: "Grishneshwar",
    nameMr: "घृष्णेश्वर",
    deity: "Shri Grishneshwar",
    location: "Verul, near Ellora",
    locationMr: "वेरूळ, एलोरा जवळ",
    state: "Maharashtra",
    stateMr: "महाराष्ट्र",
    river: "Near Ellora caves",
    description:
      "The last of the twelve Jyotirlingas, a beautifully carved red-stone temple beside the world-famous Ellora caves.",
    significance:
      "Its tale of a devotee's faith reviving her son embodies the boundless compassion of Lord Shiva.",
    image: grishneshwar,
    youtubeUrl: liveSearch("Grishneshwar Temple Ellora"),
    defaultYoutubeUrl: liveSearch("Grishneshwar Temple Ellora"),
    i18n: {
      hi: { name: "घृष्णेश्वर", location: "वेरुल, एलोरा के पास", state: "महाराष्ट्र" },
      gu: { name: "ઘૃષ્ણેશ્વર", location: "વેરુલ, ઈલોરા પાસે", state: "મહારાષ્ટ્ર" },
      te: { name: "ఘృష్ణేశ్వర్", location: "వేరుళ్, ఎల్లోరా సమీపంలో", state: "మహారాష్ట్ర" },
      ta: { name: "க்ருஷ்ணேஸ்வரர்", location: "வேருல், எல்லோரா அருகே", state: "மகாராஷ்டிரா" },
    },
  },
];

export const getJyotirlinga = (slug: string) => jyotirlingas.find((j) => j.slug === slug);

/** Returns localized name/location/state for the active language. */
export function getLocalized(j: Jyotirlinga, lang: Lang): LocalizedFields {
  if (lang === "en") return { name: j.name, location: j.location, state: j.state };
  if (lang === "mr") return { name: j.nameMr, location: j.locationMr, state: j.stateMr };
  return j.i18n[lang];
}
