import { useRef } from "react";
import { Sparkles, Compass, MapPin, ArrowUp } from "lucide-react";
import { TempleScene } from "@/components/TempleScene";
import { SacredJourneyTransition } from "@/components/SacredJourneyTransition";
import { getSacredJourneyTransition } from "@/data/transitions";
import { type Jyotirlinga, getLocalized } from "@/data/jyotirlingas";
import { toLocalDigits, displayFontClassFor, type Lang } from "@/hooks/use-language";
import { useGSAP, gsap, prefersReducedMotion } from "@/hooks/use-gsap";
import { cn } from "@/lib/utils";

interface PilgrimageJourneyProps {
  shrines: Jyotirlinga[];
  lang: Lang;
  isEn: boolean;
  fontClass: string;
  className?: string;
}

type PilgrimageLocale = {
  sacredAbodesEyebrow: string;
  journeyTitle: string;
  journeyDesc: string;
  canonicalSequence: string;
  completionEyebrow: (n: string, total: string, lastShrine: string) => string;
  completionTitle: string;
  completionDesc: string;
  returnLive: string;
  ascendTop: string;
};

const PILGRIMAGE_STRINGS: Record<Lang, PilgrimageLocale> = {
  en: {
    sacredAbodesEyebrow: "The Sacred Twelve Abodes",
    journeyTitle: "Sacred Pilgrimage Journey",
    journeyDesc:
      "Journey continuously through all twelve self-manifested Shiva temples across India in their canonical sequence — from the western shores of Somnath to the ancient heights of Grishneshwar.",
    canonicalSequence: "Canonical Sequence",
    completionEyebrow: (n, total, last) => `${n} of ${total} • ${last} Completed`,
    completionTitle: "The Dwadasha Jyotirlinga Circuit is Complete",
    completionDesc:
      "May the divine blessings of Lord Shiva bring peace, wisdom, and auspiciousness to your path as the pilgrimage continues beyond the screen.",
    returnLive: "Return to Live Darshan",
    ascendTop: "Ascend to Beginning",
  },
  mr: {
    sacredAbodesEyebrow: "द्वादश ज्योतिर्लिंग तीर्थयात्रा",
    journeyTitle: "पवित्र बारा ज्योतिर्लिंग दर्शन",
    journeyDesc:
      "भारतातील सर्व १२ स्वयंभू शिव मंदिरांच्या पवित्र क्रमाने अखंड दर्शन यात्रेचा अनुभव घ्या — सोमनाथपासून घृष्णेश्वरपर्यंत.",
    canonicalSequence: "प्राचीन क्रम",
    completionEyebrow: (n, total, last) => `${n} / ${total} • ${last} दर्शन संपन्न`,
    completionTitle: "द्वादश ज्योतिर्लिंग यात्रा संपन्न",
    completionDesc: "भगवान शंकराचा आशीर्वाद आपल्या जीवनात शांती, ज्ञान आणि सुख-समृद्धी घेऊन येवो.",
    returnLive: "थेट दर्शन पानावर परत जा",
    ascendTop: "आरंभावर जा",
  },
  hi: {
    sacredAbodesEyebrow: "द्वादश ज्योतिर्लिंग तीर्थयात्रा",
    journeyTitle: "पवित्र बारह ज्योतिर्लिंग दर्शन",
    journeyDesc:
      "भारत के सभी १२ स्वयंभू शिव मंदिरों के पवित्र क्रम में अखंड दर्शन यात्रा का अनुभव करें — सोमनाथ से घृष्णेश्वर तक।",
    canonicalSequence: "प्राचीन क्रम",
    completionEyebrow: (n, total, last) => `${n} / ${total} • ${last} दर्शन संपन्न`,
    completionTitle: "द्वादश ज्योतिर्लिंग यात्रा संपन्न",
    completionDesc: "भगवान शंकर का आशीर्वाद आपके जीवन में शांति, ज्ञान और सुख-समृद्धी लेकर आए।",
    returnLive: "लाइव दर्शन पर वापस जाएँ",
    ascendTop: "आरंभ पर जाएँ",
  },
  gu: {
    sacredAbodesEyebrow: "દ્વાદશ જ્યોતિર્લિંગ તીર્થયાત્રા",
    journeyTitle: "પવિત્ર બાર જ્યોતિર્લિંગ દર્શન",
    journeyDesc:
      "ભારતનાં તમામ ૧૨ સ્વયંભૂ શિવ મંદિરોની પવિત્ર ક્રમબદ્ધ અખંડ દર્શન યાત્રાનો અનુભવ કરો — સોમનાથથી ઘૃષ્ણેશ્વર સુધી.",
    canonicalSequence: "પ્રાચીન ક્રમ",
    completionEyebrow: (n, total, last) => `${n} / ${total} • ${last} દર્શન સંપન્ન`,
    completionTitle: "દ્વાદશ જ્યોતિર્લિંગ યાત્રા સંપન્ન",
    completionDesc: "ભગવાન શિવનાં આશીર્વાદ આપના જીવનમાં શાંતિ, જ્ઞાન અને સુખ-સમૃદ્ધિ લાવે.",
    returnLive: "જીવંત દર્શન પર પાછા જાઓ",
    ascendTop: "શરૂઆત પર જાઓ",
  },
  te: {
    sacredAbodesEyebrow: "ద్వాదశ జ్యోతిర్లింగ తీర్థయాత్ర",
    journeyTitle: "పవిత్ర పన్నెండు జ్యోతిర్లింగ దర్శనం",
    journeyDesc:
      "భారతదేశంలోని అన్ని 12 స్వయంభూ శివాలయాల పవిత్ర క్రమంలో అఖండ దర్శన యాత్రను అనుభవించండి — సోమనాథ్ నుండి ఘృష్ణేశ్వర్ వరకు.",
    canonicalSequence: "ప్రాచీన క్రమం",
    completionEyebrow: (n, total, last) => `${n} / ${total} • ${last} దర్శనం సంపూర్ణం`,
    completionTitle: "ద్వాదశ జ్యోతిర్లింగ యాత్ర సంపూర్ణం",
    completionDesc:
      "పరమశివుని దివ్య ఆశీస్సులు మీ జీవితంలో శాంతి, జ్ఞానం, సుఖసంతోషాలను ప్రసాదించుగాక.",
    returnLive: "ప్రత్యక్ష దర్శనానికి తిరిగి వెళ్ళండి",
    ascendTop: "ప్రారంభానికి వెళ్ళండి",
  },
  ta: {
    sacredAbodesEyebrow: "துவாதச ஜோதிர்லிங்க யாத்திரை",
    journeyTitle: "புனித பன்னிரண்டு ஜோதிர்லிங்க தரிசனம்",
    journeyDesc:
      "இந்தியாவில் உள்ள 12 சுயம்பு சிவ ஸ்தலங்களின் புனித வரிசையில் தொடர் தரிசன யாத்திரையை அனுபவியுங்கள் — சோமநாதர் முதல் கிருஷ்ணேஸ்வரர் வரை.",
    canonicalSequence: "புனித வரிசை",
    completionEyebrow: (n, total, last) => `${n} / ${total} • ${last} தரிசனம் நிறைவுற்றது`,
    completionTitle: "துவாதச ஜோதிர்லிங்க யாத்திரை நிறைவுற்றது",
    completionDesc:
      "சிவபெருமானின் திருவருள் உங்கள் வாழ்வில் அமைதி, ஞானம் மற்றும் சுபிட்சத்தை தரட்டும்.",
    returnLive: "நேரடி தரிசனத்திற்கு திரும்புக",
    ascendTop: "தொடக்கத்திற்கு செல்க",
  },
};

export function PilgrimageJourney({
  shrines,
  lang,
  isEn,
  fontClass,
  className,
}: PilgrimageJourneyProps) {
  const introHeaderRef = useRef<HTMLElement | null>(null);
  const completionRef = useRef<HTMLElement | null>(null);
  const ps = PILGRIMAGE_STRINGS[lang] ?? PILGRIMAGE_STRINGS.en;
  const firstShrineLoc = shrines[0] ? getLocalized(shrines[0], lang) : { name: "Somnath" };
  const lastShrineLoc = shrines[shrines.length - 1]
    ? getLocalized(shrines[shrines.length - 1], lang)
    : { name: "Grishneshwar" };

  useGSAP(
    () => {
      const intro = introHeaderRef.current;
      const completion = completionRef.current;

      if (prefersReducedMotion()) {
        if (intro) gsap.set(intro, { opacity: 1, y: 0 });
        if (completion) gsap.set(completion, { opacity: 1, y: 0 });
        return;
      }

      if (intro) {
        gsap.fromTo(
          intro,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 1.0,
            ease: "power2.out",
            scrollTrigger: {
              trigger: intro,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          },
        );
      }

      if (completion) {
        gsap.fromTo(
          completion,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: "power2.out",
            scrollTrigger: {
              trigger: completion,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          },
        );
      }
    },
    { dependencies: [lang] },
  );

  return (
    <div id="shrines" className={cn("relative w-full", className)}>
      {/* PART 4: SACRED TWELVE INTRODUCTION (Arrival into Canonical Pilgrimage) */}
      <section
        ref={introHeaderRef}
        className="relative mx-auto max-w-5xl px-4 pt-20 pb-16 text-center sm:pt-28 sm:pb-20"
        aria-label="The Sacred Twelve Pilgrimage"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/60 px-4 py-1.5 backdrop-blur-md">
          <Sparkles className="size-3.5 text-primary diya-flicker" />
          <span
            className={cn(
              "text-xs font-semibold text-accent",
              isEn ? "uppercase tracking-[0.25em]" : cn("normal-case tracking-normal", fontClass),
            )}
          >
            {ps.sacredAbodesEyebrow}
          </span>
        </div>

        <h2
          className={cn(
            "mt-6 text-3xl text-foreground sm:text-5xl lg:text-6xl overflow-visible",
            displayFontClassFor(lang),
            isEn
              ? "font-display font-bold tracking-tight leading-tight"
              : "tracking-normal leading-snug sm:leading-[1.28]",
          )}
        >
          {isEn ? (
            <>
              Sacred <span className="text-gradient-gold">Pilgrimage Journey</span>
            </>
          ) : (
            ps.journeyTitle
          )}
        </h2>

        <p
          className={cn(
            "mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base",
            fontClass,
          )}
        >
          {ps.journeyDesc}
        </p>

        {/* PART 6: MINIMAL VISUAL PROGRESS TRACKER & QUICK-JUMP ANCHORS */}
        <div className="mt-10 max-w-4xl mx-auto">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono mb-2 px-1">
            <span className="text-primary font-bold">
              {toLocalDigits("01", lang)} {firstShrineLoc.name}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
              {ps.canonicalSequence}
            </span>
            <span className="text-primary font-bold">
              {toLocalDigits("12", lang)} {lastShrineLoc.name}
            </span>
          </div>

          {/* Minimal 01 ──────────────── 12 visual track */}
          <div className="relative h-1 w-full rounded-full bg-border/40 overflow-hidden mb-6">
            <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-primary via-accent to-primary opacity-60" />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            {shrines.map((shrine, idx) => {
              const num = toLocalDigits(idx + 1, lang);
              const loc = getLocalized(shrine, lang);
              return (
                <a
                  key={shrine.slug}
                  href={`#shrine-scene-${shrine.slug}`}
                  className="group inline-flex items-center gap-1.5 rounded-lg border border-border/40 bg-card/50 px-2.5 py-1.5 text-xs text-muted-foreground transition-all duration-200 hover:border-primary/50 hover:bg-card hover:text-foreground shadow-sm"
                  title={`${loc.name} - ${loc.location}`}
                >
                  <span className="text-[10px] font-mono font-semibold text-primary">{num}</span>
                  <span
                    className={cn(
                      "text-[11px] font-medium truncate max-w-[85px] sm:max-w-none",
                      fontClass,
                    )}
                  >
                    {loc.name}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* PART 5: THE 12 CINEMATIC SHRINE SCENES WITH SACRED JOURNEY TRANSITIONS */}
      <div className="relative flex flex-col">
        {shrines.map((shrine, index) => {
          const nextShrine = shrines[index + 1];
          const transitionData = nextShrine
            ? getSacredJourneyTransition(shrine, nextShrine, lang)
            : null;

          return (
            <div key={shrine.slug} className="relative flex flex-col">
              <TempleScene
                shrine={shrine}
                index={index}
                totalShrines={shrines.length}
                lang={lang}
                isEn={isEn}
                fontClass={fontClass}
              />

              {/* Data-Driven Sacred Journey Transition between consecutive shrines */}
              {transitionData && (
                <SacredJourneyTransition
                  key={`journey-transition-${shrine.slug}-${nextShrine.slug}`}
                  transition={transitionData}
                  lang={lang}
                  isEn={isEn}
                  fontClass={fontClass}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* PART 8: END OF PILGRIMAGE — QUIET SACRED CONCLUDING MOMENT */}
      <section
        ref={completionRef}
        className="relative mx-auto max-w-4xl px-4 py-24 sm:py-32 text-center overflow-hidden"
        aria-label="Completion of Pilgrimage"
      >
        {/* Subtle breathing space & sacred Om emblem */}
        <div className="relative inline-flex size-20 items-center justify-center rounded-full bg-gradient-to-b from-primary/20 via-primary/10 to-transparent border border-primary/30 shadow-2xl mb-8">
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl animate-pulse" />
          <span className="relative text-3xl sm:text-4xl text-primary font-display font-bold select-none">
            ॐ
          </span>
        </div>

        <p
          className={cn(
            "text-xs font-semibold text-accent",
            isEn
              ? "font-display uppercase tracking-[0.3em]"
              : cn("normal-case tracking-normal", fontClass),
          )}
        >
          {ps.completionEyebrow(
            toLocalDigits("12", lang),
            toLocalDigits("12", lang),
            lastShrineLoc.name,
          )}
        </p>

        <h3
          className={cn(
            "mt-4 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl overflow-visible",
            displayFontClassFor(lang),
            isEn
              ? "font-display tracking-tight leading-tight"
              : "tracking-normal leading-snug sm:leading-[1.28]",
          )}
        >
          {ps.completionTitle}
        </h3>

        <p
          className={cn(
            "mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg",
            fontClass,
          )}
        >
          {ps.completionDesc}
        </p>

        {/* Quiet action to return to top or revisit sanctums */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#live-darshan"
            className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card px-4 py-2.5 text-xs sm:text-sm font-semibold text-foreground hover:border-primary/40 hover:bg-card/80 transition-colors shadow-sm"
          >
            <Compass className="size-4 text-primary" />
            <span>{ps.returnLive}</span>
          </a>

          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-aarti px-4 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground shadow-glow hover:brightness-105 transition-all"
          >
            <ArrowUp className="size-4" />
            <span>{ps.ascendTop}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
