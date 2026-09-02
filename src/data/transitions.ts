import type { Jyotirlinga, LocalizedFields } from "@/data/jyotirlingas";
import { getLocalized } from "@/data/jyotirlingas";
import type { Lang } from "@/hooks/use-language";

export interface TransitionLocalizedText {
  label: string;
  subtitle: string;
  spiritualEssence: string;
}

export interface SacredJourneyTransitionMeta {
  fromSlug: string;
  toSlug: string;
  /** Canonical English narrative copy */
  label: string;
  subtitle: string;
  spiritualEssence: string;
  /** Regional / multilingual translations */
  i18n?: Partial<Record<Lang, TransitionLocalizedText>>;
}

export interface SacredJourneyTransitionData {
  fromSlug: string;
  toSlug: string;
  fromIndex: number;
  toIndex: number;
  fromName: string;
  toName: string;
  fromLocation: string;
  toLocation: string;
  fromState: string;
  toState: string;
  fromImage: string;
  toImage: string;
  label: string;
  subtitle: string;
  spiritualEssence: string;
}

export const sacredJourneyTransitions: SacredJourneyTransitionMeta[] = [
  // 1 -> 2: Somnath -> Mallikarjuna
  {
    fromSlug: "somnath",
    toSlug: "mallikarjuna",
    label: "Sacred Pathway I • Western Sea to Srisailam",
    subtitle: "From the Arabian Sea shores of Prabhas to the sacred peaks of Nallamala",
    spiritualEssence: "Passing Through Sacred Grace",
    i18n: {
      hi: {
        label: "पवित्र मार्ग १ • पश्चिमी सागर से श्रीशैलम",
        subtitle: "अरब सागर के तट से नल्लामलाई की पावन पहाड़ियों तक",
        spiritualEssence: "परम कृपा का पावन प्रवाह",
      },
      gu: {
        label: "પવિત્ર પથ ૧ • સોમનાથ થી શ્રીશૈલમ",
        subtitle: "અરબી સમુદ્રના તટથી શ્રીશૈલમના પવિત્ર શિખરો તરફ",
        spiritualEssence: "દિવ્ય કૃપા સંક્રમણ",
      },
      te: {
        label: "పవిత్ర మార్గం 1 • సోమనాథ్ నుండి శ్రీశైలం",
        subtitle: "పశ్చిమ తీరం నుండి నల్లమల కొండల పవిత్ర శిఖరాల వైపు",
        spiritualEssence: "దివ్య కృపా ప్రవాహం",
      },
      ta: {
        label: "புனிதப் பாதை 1 • சோம்நாத் முதல் ஸ்ரீசைலம்",
        subtitle: "அரபிக்கடல் கரையிலிருந்து ஸ்ரீசைலத்தின் புனித சிகரங்கள் வரை",
        spiritualEssence: "தெய்வீக அருளின் பரிமாணம்",
      },
    },
  },
  // 2 -> 3: Mallikarjuna -> Mahakaleshwar
  {
    fromSlug: "mallikarjuna",
    toSlug: "mahakaleshwar",
    label: "Sacred Pathway II • Srisailam to Avanti",
    subtitle: "From the Krishna river valley to the eternal sanctum of Mahakal on the Shipra",
    spiritualEssence: "Crossing the Cosmic Meridian of Time",
    i18n: {
      hi: {
        label: "पवित्र मार्ग २ • श्रीशैलम से अवंतिका",
        subtitle: "कृष्णा घाटी से शिप्रा तट पर स्थित काल के स्वामी महाकाल तक",
        spiritualEssence: "काल के अधिपति का पावन सान्निध्य",
      },
      gu: {
        label: "પવિત્ર પથ ૨ • શ્રીશૈલમ થી ઉજ્જૈન",
        subtitle: "કૃષ્ણા નદીના ખીણ પ્રદેશથી ક્ષિપ્રા તટ પર મહાકાલ સુધી",
        spiritualEssence: "કાળના અધિપતિ તરફ પ્રયાણ",
      },
      te: {
        label: "పవిత్ర మార్గం 2 • శ్రీశైలం నుండి ఉజ్జయిని",
        subtitle: "కృష్ణా లోయ నుండి క్షిప్రా తీరంలో ఉన్న మహాకాలుని నగరం వరకు",
        spiritualEssence: "కాలాతీత దివ్య ప్రయాణం",
      },
      ta: {
        label: "புனிதப் பாதை 2 • ஸ்ரீசைலம் முதல் உஜ்ஜயினி",
        subtitle: "கிருஷ்ணா நதியிலிருந்து ஷிப்ரா நதிக்கரை மகாகாலேஸ்வரர் வரை",
        spiritualEssence: "காலத்தின் இறைவனின் தரிசனம்",
      },
    },
  },
  // 3 -> 4: Mahakaleshwar -> Omkareshwar
  {
    fromSlug: "mahakaleshwar",
    toSlug: "omkareshwar",
    label: "Sacred Pathway III • Ujjain to Narmada Island",
    subtitle:
      "Across the Malwa plateau to Mandhata Island sculpted by the Narmada in the shape of Om",
    spiritualEssence: "Resonating in the Primordial Syllable Om",
    i18n: {
      hi: {
        label: "पवित्र मार्ग ३ • उज्जैन से ओंकारेश्वर",
        subtitle: "मालवा पठार से पवित्र नर्मदा के ओंकार स्वरूप मांधाता द्वीप तक",
        spiritualEssence: "प्रणव नाद ॐ की दिव्य अनुभूति",
      },
      gu: {
        label: "પવિત્ર પથ ૩ • ઉજ્જૈન થી ઓમકારેશ્વર",
        subtitle: "માળવાના પઠારથી નર્મદા તટ પર ૐકાર સ્વરૂપ ટાપુ સુધી",
        spiritualEssence: "ઓમકાર નાદની પાવન અનુભૂતિ",
      },
      te: {
        label: "పవిత్ర మార్గం 3 • ఉజ్జయిని నుండి ఓంకారేశ్వర్",
        subtitle: "మాల్వా పీఠభూమి నుండి నర్మదా నదిలోని ఓంకార ద్వీపం వరకు",
        spiritualEssence: "ఓంకార నాద దివ్య సంస్పర్శ",
      },
      ta: {
        label: "புனிதப் பாதை 3 • உஜ்ஜயினி முதல் ஓங்காரேஸ்வரர்",
        subtitle: "மால்வா சமவெளியிலிருந்து நர்மதை நதியின் ஓம் வடிவ தீவு வரை",
        spiritualEssence: "பிரணவ ஓங்கார அருள்",
      },
    },
  },
  // 4 -> 5: Omkareshwar -> Kedarnath
  {
    fromSlug: "omkareshwar",
    toSlug: "kedarnath",
    label: "Sacred Pathway IV • Narmada Basin to High Himalayas",
    subtitle:
      "Ascending from central river valleys to the snowbound heights of the Garhwal Himalayas",
    spiritualEssence: "Ascending to the Glacial Sanctum of Shiva",
    i18n: {
      hi: {
        label: "पवित्र मार्ग ४ • नर्मदा तट से हिमालय की ऊँचाइयों तक",
        subtitle: "नर्मदा की घाटी से गढ़वाल हिमालय के हिमाच्छादित पावन धाम तक",
        spiritualEssence: "हिम-शिखरों में शिव की दिव्य उपस्थिति",
      },
      gu: {
        label: "પવિત્ર પથ ૪ • નર્મદા તટ થી કેદારનાથ હિમાલય",
        subtitle: "નર્મદા ખીણથી ગઢવાલ હિમાલયના બર્ફીલા શિખરો તરફ",
        spiritualEssence: "હિમ શિખરોમાં શિવની ઉપસ્થિતિ",
      },
      te: {
        label: "పవిత్ర మార్గం 4 • నర్మద నుండి కేదార్‌నాథ్",
        subtitle: "నర్మదా లోయ నుండి హిమాలయ మంచు శిఖరాల వైపు ప్రయాణం",
        spiritualEssence: "హిమ శిఖరాలలో శివ సాక్షాత్కారం",
      },
      ta: {
        label: "புனிதப் பாதை 4 • நர்மதை முதல் கேதார்நாத்",
        subtitle: "நர்மதை நதிக்கரையிலிருந்து இமயமலையின் பனிச் சிகரங்கள் வரை",
        spiritualEssence: "இமயத்தின் பனிச் சிகரங்களில் சிவனருள்",
      },
    },
  },
  // 5 -> 6: Kedarnath -> Bhimashankar
  {
    fromSlug: "kedarnath",
    toSlug: "bhimashankar",
    label: "Sacred Pathway V • Himalayan Heights to Sahyadri Ridges",
    subtitle:
      "Descending from glacial sanctuaries to the mist-clad biodiversity of the Western Ghats",
    spiritualEssence: "Entering the Sacred Wilderness of Bhima's Source",
    i18n: {
      hi: {
        label: "पवित्र मार्ग ५ • केदारनाथ से सह्याद्रि",
        subtitle: "हिमालय की चोटियों से सह्याद्रि के सघन वनों और भीमा के उद्गम तक",
        spiritualEssence: "सघन वनों में त्रिपुरारि की कृपा",
      },
      gu: {
        label: "પવિત્ર પથ ૫ • કેદારનાથ થી ભીમાશંકર",
        subtitle: "હિમાલયથી પશ્ચિમી ઘાટના ગહન જંગલો અને ભીમા નદીના ઉદ્ગમ સુધી",
        spiritualEssence: "સહ્યાદ્રિના પાવન વનમાં પ્રવેશે",
      },
      te: {
        label: "పవిత్ర మార్గం 5 • కేదార్‌నాథ్ నుండి భీమశంకర్",
        subtitle: "హిమాలయాల నుండి పశ్చిమ కనుమల పచ్చని అడవుల వైపు",
        spiritualEssence: "భీమా నది పుట్టిన పవిత్ర వనం",
      },
      ta: {
        label: "புனிதப் பாதை 5 • கேதார்நாத் முதல் பீமாசங்கர்",
        subtitle: "இமயமலையிலிருந்து மேற்குத் தொடர்ச்சி மலையின் பசுமை காடுகள் வரை",
        spiritualEssence: "பீமா நதி பிறக்கும் புனித வனம்",
      },
    },
  },
  // 6 -> 7: Bhimashankar -> Kashi Vishwanath
  {
    fromSlug: "bhimashankar",
    toSlug: "kashi-vishwanath",
    label: "Sacred Pathway VI • Sahyadri Forests to Eternal Kashi",
    subtitle: "From the crest of the Western Ghats to the eternal ghats of Mother Ganga",
    spiritualEssence: "Awakening in the City of Timeless Light",
    i18n: {
      hi: {
        label: "पवित्र मार्ग ६ • सह्याद्रि से मोक्षनगरी काशी",
        subtitle: "सह्याद्रि की चोटियों से गंगा किनारे बसी सनातन नगरी काशी तक",
        spiritualEssence: "तारक मंत्र और मुक्ति का पावन प्रकाश",
      },
      gu: {
        label: "પવિત્ર પથ ૬ • ભીમાશંકર થી કાશી વિશ્વનાથ",
        subtitle: "સહ્યાદ્રિ પર્વતોથી મોક્ષદાયિની ગંગાના ઘાટો સુધી",
        spiritualEssence: "અવિનાશી કાશી નગરીમાં પ્રવેશ",
      },
      te: {
        label: "పవిత్ర మార్గం 6 • భీమశంకర్ నుండి కాశీ విశ్వనాథ్",
        subtitle: "సహ్యాద్రి పర్వతాల నుండి గంగా నది ఒడ్డున గల మోక్షపురి కాశీ వరకు",
        spiritualEssence: "నిత్య ముక్తి నగరం కాశీ దర్శనం",
      },
      ta: {
        label: "புனிதப் பாதை 6 • பீமாசங்கர் முதல் காசி விசுவநாதர்",
        subtitle: "மேற்குத் தொடர்ச்சி மலையிலிருந்து புனித கங்கை நதிக்கரை காசி வரை",
        spiritualEssence: "முக்தி தரும் காசி மாநகரின் அருள்",
      },
    },
  },
  // 7 -> 8: Kashi Vishwanath -> Trimbakeshwar
  {
    fromSlug: "kashi-vishwanath",
    toSlug: "trimbakeshwar",
    label: "Sacred Pathway VII • Ganga Shore to Godavari Source",
    subtitle:
      "From the ancient plains of Varanasi to the foot of Brahmagiri where Godavari takes birth",
    spiritualEssence: "Harmonizing the Cosmic Trinity: Brahma, Vishnu & Shiva",
    i18n: {
      hi: {
        label: "पवित्र मार्ग ७ • काशी से त्र्यंबकेश्वर",
        subtitle: "गंगा तट से ब्रह्मगिरि पर्वत की तलहटी में गोदावरी के उद्गम तक",
        spiritualEssence: "ब्रह्मा, विष्णु और महेश का त्रिमूर्ति स्वरूप",
      },
      gu: {
        label: "પવિત્ર પથ ૭ • કાશી થી ત્ર્યંબકેશ્વર",
        subtitle: "ગંગા તટથી બ્રહ્મગિરિની તળેટીમાં ગોદાવરીના ઉદ્ગમ સુધી",
        spiritualEssence: "ત્રિદેવ સ્વરૂપી લિંગ દર્શન",
      },
      te: {
        label: "పవిత్ర మార్గం 7 • కాశీ నుండి త్రయంబకేశ్వర్",
        subtitle: "గంగా తీరం నుండి గోదావరి జన్మస్థానమైన బ్రహ్మగిరి వరకు",
        spiritualEssence: "బ్రహ్మ విష్ణు మహేశ్వరుల త్రిమూర్తి వైభవం",
      },
      ta: {
        label: "புனிதப் பாதை 7 • காசி முதல் திரியம்பகேஸ்வரர்",
        subtitle: "கங்கை கரையிலிருந்து கோதாவரி நதி பிறக்கும் பிரம்மகிரி வரை",
        spiritualEssence: "மும்மூர்த்திகளின் அருட்கொடை",
      },
    },
  },
  // 8 -> 9: Trimbakeshwar -> Baidyanath
  {
    fromSlug: "trimbakeshwar",
    toSlug: "baidyanath",
    label: "Sacred Pathway VIII • Western Ridges to Santhal Abode",
    subtitle: "Across the subcontinent to the eastern pilgrimage dham of the Divine Healer",
    spiritualEssence: "Embracing the Healing Grace of the Supreme Physician",
    i18n: {
      hi: {
        label: "पवित्र मार्ग ८ • त्र्यंबक से बाबा बैद्यनाथ धाम",
        subtitle: "पश्चिमी घाट से पूर्व के देवघर धाम में परम वैद्यनाथ के दरबार तक",
        spiritualEssence: "सर्व व्याधि हरने वाले वैद्यनाथ की शरण",
      },
      gu: {
        label: "પવિત્ર પથ ૮ • ત્ર્યંબકેશ્વર થી બૈદ્યનાથ",
        subtitle: "નાશિકથી પૂર્વ ભારતના દેવઘર સ્થિત પરમ વૈદ્યનાથ સુધી",
        spiritualEssence: "આરોગ્ય આપનાર વૈદ્યનાથની કૃપા",
      },
      te: {
        label: "పవిత్ర మార్గం 8 • త్రయంబకేశ్వర్ నుండి బైద్యనాథ్",
        subtitle: "నాసిక్ నుండి తూర్పు భారతదేశంలోని పవిత్ర దేవ్‌ఘర్ వరకు",
        spiritualEssence: "ఆరోగ్య ప్రదాత వైద్యనాథుని కృప",
      },
      ta: {
        label: "புனிதப் பாதை 8 • திரியம்பகேஸ்வரர் முதல் பைத்யநாத்",
        subtitle: "நாசிக்கிலிருந்து கிழக்கு இந்தியாவின் தியோகர் திருத்தலம் வரை",
        spiritualEssence: "நோய் தீர்க்கும் வைத்தியநாதனின் கருணை",
      },
    },
  },
  // 9 -> 10: Baidyanath -> Nageshwar
  {
    fromSlug: "baidyanath",
    toSlug: "nageshwar",
    label: "Sacred Pathway IX • Eastern Plains to Western Coast",
    subtitle: "Traversing from the forests of Deoghar to the sacred Darukavana coast near Dwarka",
    spiritualEssence: "Protected by the Supreme Lord of Serpents",
    i18n: {
      hi: {
        label: "पवित्र मार्ग ९ • देवघर से दारुकावन द्वारका",
        subtitle: "झारखंड के पावन धाम से पश्चिमी समुद्र तट पर दारुकावन तक",
        spiritualEssence: "विष और भय से मुक्त करने वाले नागेश्वर",
      },
      gu: {
        label: "પવિત્ર પથ ૯ • બૈદ્યનાથ થી નાગેશ્વર",
        subtitle: "દેવઘરથી દ્વારકા પાસેના પવિત્ર દારુકા વન સુધી",
        spiritualEssence: "સર્વ ભય મુક્ત કરનાર નાગેશ્વર દર્શન",
      },
      te: {
        label: "పవిత్ర మార్గం 9 • బైద్యనాథ్ నుండి నాగేశ్వర్",
        subtitle: "దేవ్‌ఘర్ నుండి ద్వారక సమీపంలోని దారుకావనం వరకు",
        spiritualEssence: "భయనాశకుడైన నాగేశ్వరుని సంరక్షణ",
      },
      ta: {
        label: "புனிதப் பாதை 9 • பைத்யநாத் முதல் நாகேஸ்வரர்",
        subtitle: "தியோகரிலிருந்து துவாரகை அருகே உள்ள தாருகாவனம் வரை",
        spiritualEssence: "அச்சம் போக்கும் நாகேஸ்வரரின் அருள்",
      },
    },
  },
  // 10 -> 11: Nageshwar -> Rameshwaram
  {
    fromSlug: "nageshwar",
    toSlug: "rameshwaram",
    label: "Sacred Pathway X • Western Gulf to Southern Ocean",
    subtitle:
      "Journeying the full length of the peninsula to the island sanctuary consecrated by Lord Rama",
    spiritualEssence: "Uniting at the Consecrated Ocean Causeway",
    i18n: {
      hi: {
        label: "पवित्र मार्ग १० • द्वारका से दक्षिण सागर सेतु",
        subtitle: "गुजरात के तट से श्रीराम द्वारा स्थापित पावन सेतु रामेश्वरम तक",
        spiritualEssence: "श्रीराम की भक्ति और शिव की अनुकंपा",
      },
      gu: {
        label: "પવિત્ર પથ ૧૦ • નાગેશ્વર થી રામેશ્વરમ",
        subtitle: "ગુજરાત તટથી પ્રભુ શ્રીરામે સ્થાપેલા રામેશ્વરમ ટાપુ સુધી",
        spiritualEssence: "ભક્તિ અને મુક્તિનો પાવન સંગમ",
      },
      te: {
        label: "పవిత్ర మార్గం 10 • నాగేశ్వర్ నుండి రామేశ్వరం",
        subtitle: "గుజరాత్ తీరం నుండి శ్రీరాముడు ప్రతిష్టించిన రామేశ్వర ద్వీపం వరకు",
        spiritualEssence: "భక్తి ముక్తుల దివ్య సంగమం",
      },
      ta: {
        label: "புனிதப் பாதை 10 • நாகேஸ்வரர் முதல் ராமேஸ்வரம்",
        subtitle: "குஜராத் கரையிலிருந்து ஸ்ரீராமர் வழிபட்ட ராமேஸ்வர தீவு வரை",
        spiritualEssence: "பக்தியும் முக்தியும் இணையும் புனித சங்கமம்",
      },
    },
  },
  // 11 -> 12: Rameshwaram -> Grishneshwar
  {
    fromSlug: "rameshwaram",
    toSlug: "grishneshwar",
    label: "Sacred Pathway XI • Ocean Isle to Ellora Sanctum",
    subtitle: "From the southern waters to the ancient red-stone temple of the final Jyotirlinga",
    spiritualEssence: "Culminating the Pilgrimage in Boundless Compassion",
    i18n: {
      hi: {
        label: "पवित्र मार्ग ११ • दक्षिण सागर से घृष्णेश्वर वेरूल",
        subtitle: "दक्षिण भारत के छोर से एलोरा की पावन गुफाओं के निकट घृष्णेश्वर तक",
        spiritualEssence: "द्वादश ज्योतिर्लिंग यात्रा की पावन पूर्णता",
      },
      gu: {
        label: "પવિત્ર પથ ૧૧ • રામેશ્વરમ થી ઘૃષ્ણેશ્વર",
        subtitle: "દક્ષિણ સમુદ્રથી એલોરા પાસેના અંતિમ જ્યોતિર્લિંગ ઘૃષ્ણેશ્વર સુધી",
        spiritualEssence: "જ્યોતિર્લિંગ યાત્રાની પાવન પૂર્ણતા",
      },
      te: {
        label: "పవిత్ర మార్గం 11 • రామేశ్వరం నుండి ఘృష్ణేశ్వర్",
        subtitle: "దక్షిణ సముద్రం నుండి ఎల్లోరా సమీపంలోని అంతిమ జ్యోతిర్లింగం వరకు",
        spiritualEssence: "ద్వాదశ జ్యోతిర్లింగ యాత్రా పరిపూర్ణత",
      },
      ta: {
        label: "புனிதப் பாதை 11 • ராமேஸ்வரம் முதல் க்ருஷ்ணேஸ்வரர்",
        subtitle: "தென் கடலிலிருந்து எல்லோராவின் புனித க்ருஷ்ணேஸ்வரர் வரை",
        spiritualEssence: "பன்னிரு ஜோதிர்லிங்க யாத்திரையின் நிறைவு",
      },
    },
  },
];

/**
 * Returns full populated transition data between any two consecutive shrines
 */
export function getSacredJourneyTransition(
  fromShrine: Jyotirlinga,
  toShrine: Jyotirlinga,
  lang: Lang = "en",
): SacredJourneyTransitionData {
  const fromLoc: LocalizedFields = getLocalized(fromShrine, lang);
  const toLoc: LocalizedFields = getLocalized(toShrine, lang);

  const match = sacredJourneyTransitions.find(
    (t) => t.fromSlug === fromShrine.slug && t.toSlug === toShrine.slug,
  );

  let label = match?.label ?? `Sacred Pathway • ${fromShrine.name} to ${toShrine.name}`;
  let subtitle =
    match?.subtitle ??
    `From ${fromLoc.name} (${fromLoc.location}) to ${toLoc.name} (${toLoc.location})`;
  let spiritualEssence = match?.spiritualEssence ?? "Passing Through Sacred Grace";

  if (match?.i18n && lang !== "en") {
    const locMeta = match.i18n[lang];
    if (locMeta) {
      label = locMeta.label;
      subtitle = locMeta.subtitle;
      spiritualEssence = locMeta.spiritualEssence;
    }
  }

  return {
    fromSlug: fromShrine.slug,
    toSlug: toShrine.slug,
    fromIndex: fromShrine.number,
    toIndex: toShrine.number,
    fromName: fromLoc.name,
    toName: toLoc.name,
    fromLocation: fromLoc.location,
    toLocation: toLoc.location,
    fromState: fromLoc.state,
    toState: toLoc.state,
    fromImage: fromShrine.image,
    toImage: toShrine.image,
    label,
    subtitle,
    spiritualEssence,
  };
}
