import { Flame } from "lucide-react";
import { useLanguage, type Lang } from "@/hooks/use-language";
import { cn } from "@/lib/utils";

const FOOTER_TEXT: Record<Lang, { om: string; desc: string; copyright: string }> = {
  en: {
    om: "ॐ नमः शिवाय",
    desc: "A devotional space to behold all twelve Jyotirlingas, watch live darshan, and share the feelings of your pilgrimage. Har Har Mahadev.",
    copyright: "12 Jyotirlinga Darshan",
  },
  mr: {
    om: "ॐ नमः शिवाय",
    desc: "सर्व बारा ज्योतिर्लिंगांचे दर्शन, थेट आरती आणि तीर्थयात्रेचा पावन आध्यात्मिक अनुभव. हर हर महादेव।",
    copyright: "१२ ज्योतिर्लिंग दर्शन",
  },
  hi: {
    om: "ॐ नमः शिवाय",
    desc: "सभी बारह ज्योतिर्लिंगों के दर्शन, सजीव आरती और तीर्थयात्रा की पावन अनुभूति का भक्तिमय अनुभव। हर हर महादेव।",
    copyright: "१२ ज्योतिर्लिंग दर्शन",
  },
  gu: {
    om: "ૐ નમઃ શિવાય",
    desc: "બાર જ્યોતિર્લિંગ દર્શન, લાઈવ આરતી અને પવિત્ર યાત્રાનો આધ્યાત્મિક અનુભવ. હર હર મહાદેવ.",
    copyright: "૧૨ જ્યોતિર્લિંગ દર્શન",
  },
  te: {
    om: "ఓం నమః శివాయ",
    desc: "ద్వాదశ జ్యోతిర్లింగ దర్శనం, ప్రత్యక్ష ఆరతి మరియు పవిత్ర తీర్థయాత్ర ఆధ్యాత్మిక అనుభవం. హర హర మహాదేవ్.",
    copyright: "౧౨ జ్యోతిర్లింగ దర్శనం",
  },
  ta: {
    om: "ஓம் நம சிவாய",
    desc: "பன்னிரண்டு ஜோதிர்லிங்க தரிசனம், நேரடி ஆரத்தி மற்றும் புனித யாத்திரை ஆன்மீக அனுபவம். ஹர ஹர மஹாதேவ்.",
    copyright: "௧௨ ஜோதிர்லிங்க தரிசனம்",
  },
};

export function SiteFooter() {
  const { lang, fontClass } = useLanguage();
  const t = FOOTER_TEXT[lang] ?? FOOTER_TEXT.en;

  return (
    <footer className="border-t border-border/60 bg-background/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center">
        <Flame className="size-5 text-primary diya-flicker" />
        <p className="font-display text-sm text-foreground">{t.om}</p>
        <p className={cn("max-w-md text-xs text-muted-foreground", fontClass)}>{t.desc}</p>
        <p className="text-xs text-muted-foreground/70">
          © {new Date().getFullYear()} {t.copyright}
        </p>
      </div>
    </footer>
  );
}
