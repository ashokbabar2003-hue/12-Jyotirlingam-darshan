import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Flame, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { useLanguage, type Lang } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — 12 Jyotirlinga Darshan" },
      {
        name: "description",
        content: "Sign in to share your darshan photos and devotional stories.",
      },
    ],
  }),
  component: AuthPage,
});

const PROD_AUTH_ORIGIN = "https://12jyotirlingadarshan.online";

function getAuthRedirectOrigin(): string {
  if (typeof window === "undefined") return PROD_AUTH_ORIGIN;
  const origin = window.location.origin;
  // If running on custom domain or local development, use current origin; default to canonical production domain
  if (origin.includes("12jyotirlingadarshan.online") || origin.includes("localhost") || origin.includes("127.0.0.1")) {
    return origin;
  }
  return PROD_AUTH_ORIGIN;
}

const AUTH_I18N: Record<
  Lang,
  {
    welcomeBack: string;
    joinDarshan: string;
    subtitleSignIn: string;
    subtitleSignUp: string;
    continueWithGoogle: string;
    orDivider: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    showPassword: string;
    hidePassword: string;
    signInBtn: string;
    signUpBtn: string;
    pleaseWait: string;
    newHere: string;
    alreadyHaveAccount: string;
    createAccountLink: string;
    signInLink: string;
    backToDarshan: string;
    checkEmailMsg: string;
    welcomeMsg: string;
    harHarMahadev: string;
    authFailed: string;
    googleFailed: string;
    authOfflineNotice: string;
  }
> = {
  en: {
    welcomeBack: "Welcome back",
    joinDarshan: "Join the darshan",
    subtitleSignIn: "Sign in to share your photos, prayers, and pilgrimage stories.",
    subtitleSignUp: "Create an account to join the sacred community and share darshans.",
    continueWithGoogle: "Continue with Google",
    orDivider: "or continue with email",
    nameLabel: "Display name",
    namePlaceholder: "Your name as shown on posts",
    emailLabel: "Email address",
    emailPlaceholder: "devotee@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password (min 6 characters)",
    showPassword: "Show password",
    hidePassword: "Hide password",
    signInBtn: "Sign in",
    signUpBtn: "Create account",
    pleaseWait: "Please wait…",
    newHere: "New to Darshan? ",
    alreadyHaveAccount: "Already have an account? ",
    createAccountLink: "Create an account",
    signInLink: "Sign in",
    backToDarshan: "Back to darshan",
    checkEmailMsg: "Almost there! Check your email to confirm your account, then sign in.",
    welcomeMsg: "Welcome! You are signed in.",
    harHarMahadev: "Har Har Mahadev! You are signed in.",
    authFailed: "Authentication failed.",
    googleFailed: "Google sign-in failed. Please try again.",
    authOfflineNotice: "Devotee sign-in is currently unavailable in offline mode.",
  },
  mr: {
    welcomeBack: "पुन्हा आपले स्वागत आहे",
    joinDarshan: "दर्शनामध्ये सहभागी व्हा",
    subtitleSignIn:
      "आपले दर्शन फोटो, प्रार्थना आणि तीर्थयात्रेच्या कथा शेअर करण्यासाठी साइन इन करा.",
    subtitleSignUp: "पवित्र समुदायात सामील होण्यासाठी आणि दर्शन शेअर करण्यासाठी खाते तयार करा.",
    continueWithGoogle: "Google द्वारे पुढे जा",
    orDivider: "किंवा ईमेलने सुरू ठेवा",
    nameLabel: "प्रदर्शित नाव",
    namePlaceholder: "पोस्टवर दिसणारे आपले नाव",
    emailLabel: "ईमेल पत्ता",
    emailPlaceholder: "devotee@example.com",
    passwordLabel: "पासवर्ड",
    passwordPlaceholder: "आपला पासवर्ड प्रविष्ट करा (किमान ६ अक्षरे)",
    showPassword: "पासवर्ड दाखवा",
    hidePassword: "पासवर्ड लपवा",
    signInBtn: "साइन इन करा",
    signUpBtn: "नवीन खाते तयार करा",
    pleaseWait: "कृपया प्रतीक्षा करा…",
    newHere: "दर्शनासाठी नवीन आहात? ",
    alreadyHaveAccount: "आधीच खाते आहे? ",
    createAccountLink: "नवीन खाते तयार करा",
    signInLink: "साइन इन करा",
    backToDarshan: "दर्शनाकडे परत जा",
    checkEmailMsg: "जवळपास पूर्ण! खात्याची पुष्टी करण्यासाठी आपला ईमेल तपासा, नंतर साइन इन करा.",
    welcomeMsg: "स्वागत आहे! आपण साइन इन झाले आहात.",
    harHarMahadev: "हर हर महादेव! आपण साइन इन झाले आहात.",
    authFailed: "प्रमाणीकरण अयशस्वी झाले.",
    googleFailed: "Google साइन-इन अयशस्वी. कृपया पुन्हा प्रयत्न करा.",
    authOfflineNotice: "ऑफलाइन मोडमध्ये भाविक साइन-इन सध्या उपलब्ध नाही.",
  },
  hi: {
    welcomeBack: "पुनः आपका स्वागत है",
    joinDarshan: "दर्शन में सम्मिलित हों",
    subtitleSignIn: "अपने दर्शन फोटो, प्रार्थनाएँ और तीर्थकथाएँ साझा करने के लिए साइन इन करें।",
    subtitleSignUp: "पवित्र समुदाय से जुड़ने और दर्शन साझा करने के लिए नया खाता बनाएँ।",
    continueWithGoogle: "Google से आगे बढ़ें",
    orDivider: "या ईमेल से जारी रखें",
    nameLabel: "प्रदर्शित नाम",
    namePlaceholder: "पोस्ट पर दिखने वाला आपका नाम",
    emailLabel: "ईमेल पता",
    emailPlaceholder: "devotee@example.com",
    passwordLabel: "पासवर्ड",
    passwordPlaceholder: "अपना पासवर्ड दर्ज करें (न्यूनतम ६ वर्ण)",
    showPassword: "पासवर्ड दिखाएँ",
    hidePassword: "पासवर्ड छुपाएँ",
    signInBtn: "साइन इन करें",
    signUpBtn: "खाता बनाएँ",
    pleaseWait: "कृपया प्रतीक्षा करें…",
    newHere: "दर्शन पर नए हैं? ",
    alreadyHaveAccount: "पहले से खाता है? ",
    createAccountLink: "नया खाता बनाएँ",
    signInLink: "साइन इन करें",
    backToDarshan: "दर्शन पर वापस जाएँ",
    checkEmailMsg: "बस थोड़ा और! खाते की पुष्टि के लिए अपना ईमेल देखें, फिर साइन इन करें।",
    welcomeMsg: "स्वागत है! आप साइन इन हो चुके हैं।",
    harHarMahadev: "हर हर महादेव! आप साइन इन हो चुके हैं।",
    authFailed: "प्रमाणीकरण विफल रहा।",
    googleFailed: "Google साइन-इन विफल। कृपया पुनः प्रयास करें।",
    authOfflineNotice: "ऑफ़लाइन मोड में भक्त साइन-इन वर्तमान में उपलब्ध नहीं है।",
  },
  gu: {
    welcomeBack: "આપનું પુનઃ સ્વાગત છે",
    joinDarshan: "દર્શનમાં જોડાઓ",
    subtitleSignIn: "તમારા દર્શન ફોટા, પ્રાર્થનાઓ અને યાત્રા સંસ્મરણો શેર કરવા માટે સાઇન ઇન કરો.",
    subtitleSignUp: "પવિત્ર સમુદાય સાથે જોડાવા અને દર્શન શેર કરવા ખાતું બનાવો.",
    continueWithGoogle: "Google સાથે આગળ વધો",
    orDivider: "અથવા ઈમેલ વડે આગળ વધો",
    nameLabel: "પ્રદર્શિત નામ",
    namePlaceholder: "પોસ્ટ પર દેખાતું આપનું નામ",
    emailLabel: "ઈમેલ સરનામું",
    emailPlaceholder: "devotee@example.com",
    passwordLabel: "પાસવર્ડ",
    passwordPlaceholder: "તમારો પાસવર્ડ દાખલ કરો (ઓછામાં ઓછા ૬ અક્ષર)",
    showPassword: "પાસવર્ડ બતાવો",
    hidePassword: "પાસવર્ડ છુપાવો",
    signInBtn: "સાઇન ઇન કરો",
    signUpBtn: "ખાતું બનાવો",
    pleaseWait: "કૃપા કરીને રાહ જુઓ…",
    newHere: "દર્શન માટે નવા છો? ",
    alreadyHaveAccount: "પહેલેથી જ ખાતું છે? ",
    createAccountLink: "નવું ખાતું બનાવો",
    signInLink: "સાઇન ઇન કરો",
    backToDarshan: "દર્શન પર પાછા જાઓ",
    checkEmailMsg: "લગભગ પૂર્ણ! ખાતાની પુષ્ટિ કરવા માટે તમારો ઇમેઇલ તપાસો, પછી સાઇન ઇન કરો.",
    welcomeMsg: "સ્વાગત છે! તમે સાઇન ઇન કર્યું છે.",
    harHarMahadev: "હર હર મહાદેવ! તમે સાઇન ઇન કર્યું છે.",
    authFailed: "સાઇન-ઇન નિષ્ફળ રહ્યું.",
    googleFailed: "Google સાઇન-ઇન નિષ્ફળ ગયું. ફરી પ્રયાસ કરો.",
    authOfflineNotice: "ઑફલાઇન મોડમાં ભક્ત સાઇન-ઇન હાલમાં ઉપલબ્ધ નથી.",
  },
  te: {
    welcomeBack: "తిరిగి స్వాగతం",
    joinDarshan: "దర్శనంలో చేరండి",
    subtitleSignIn: "మీ దర్శన ఫోటోలు, ప్రార్థనలు మరియు యాత్రా కథలను పంచుకోవడానికి సైన్ ఇన్ చేయండి.",
    subtitleSignUp: "పవిత్ర సమూహంలో చేరడానికి మరియు దర్శనాన్ని పంచుకోవడానికి ఖాతాను సృష్టించండి.",
    continueWithGoogle: "Google తో కొనసాగించండి",
    orDivider: "లేదా ఇమెయిల్‌తో కొనసాగించండి",
    nameLabel: "ప్రదర్శన పేరు",
    namePlaceholder: "పోస్ట్‌లలో కనిపించే మీ పేరు",
    emailLabel: "ఇమెయిల్ చిరునామా",
    emailPlaceholder: "devotee@example.com",
    passwordLabel: "పాస్‌వర్డ్",
    passwordPlaceholder: "మీ పాస్‌వర్డ్‌ను నమోదు చేయండి (కనీసం 6 అక్షరాలు)",
    showPassword: "పాస్‌వర్డ్ చూపించు",
    hidePassword: "పాస్‌వర్డ్ దాచు",
    signInBtn: "సైన్ ఇన్ చేయండి",
    signUpBtn: "ఖాతా సృష్టించండి",
    pleaseWait: "దయచేసి వేచి ఉండండి…",
    newHere: "దర్శనానికి కొత్తవారా? ",
    alreadyHaveAccount: "ఇప్పటికే ఖాతా ఉందా? ",
    createAccountLink: "ఖాతాను సృష్టించండి",
    signInLink: "సైన్ ఇన్ చేయండి",
    backToDarshan: "దర్శనానికి తిరిగి వెళ్లండి",
    checkEmailMsg:
      "దాదాపు పూర్తయింది! మీ ఖాతాను ధృవీకరించడానికి మీ ఇమెయిల్‌ను తనిఖీ చేసి, సైన్ ఇన్ చేయండి.",
    welcomeMsg: "స్వాగతం! మీరు సైన్ ఇన్ అయ్యారు.",
    harHarMahadev: "హర హర మహాదేవ్! మీరు సైన్ ఇన్ అయ్యారు.",
    authFailed: "ధృవీకరణ విఫలమైంది.",
    googleFailed: "Google సైన్ ఇన్ విఫలమైంది. దయచేసి మళ్ళీ ప్రయత్నించండి.",
    authOfflineNotice: "ఆఫ్‌లైన్ మోడ్‌లో భక్తుల సైన్-ఇన్ ప్రస్తుతం అందుబాటులో లేదు.",
  },
  ta: {
    welcomeBack: "மீண்டும் வருக",
    joinDarshan: "தரிசனத்தில் இணையுங்கள்",
    subtitleSignIn:
      "உங்கள் தரிசன படங்கள், பிரார்த்தனைகள் மற்றும் புனித யாத்திரை கதைகளைப் பகிர உள்நுழையவும்.",
    subtitleSignUp: "புனித பக்தர் சமூகத்தில் இணைந்து தரிசனங்களைப் பகிர புதிய கணக்கை உருவாக்கவும்.",
    continueWithGoogle: "Google உடன் தொடரவும்",
    orDivider: "அல்லது மின்னஞ்சல் மூலம் தொடரவும்",
    nameLabel: "காட்சிப் பெயர்",
    namePlaceholder: "பதிவுகளில் தோன்றும் உங்கள் பெயர்",
    emailLabel: "மின்னஞ்சல் முகவரி",
    emailPlaceholder: "devotee@example.com",
    passwordLabel: "கடவுச்சொல்",
    passwordPlaceholder: "உங்கள் கடவுச்சொல்லை உள்ளிடவும் (குறைந்தது 6 எழுத்துகள்)",
    showPassword: "கடவுச்சொல்லைக் காட்டு",
    hidePassword: "கடவுச்சொல்லை மறைக்கவும்",
    signInBtn: "உள்நுழைக",
    signUpBtn: "கணக்கை உருவாக்கவும்",
    pleaseWait: "தயவுசெய்து காத்திருக்கவும்…",
    newHere: "தரிசனத்திற்குப் புதியவரா? ",
    alreadyHaveAccount: "ஏற்கனவே கணக்கு உள்ளதா? ",
    createAccountLink: "கணக்கை உருவாக்கவும்",
    signInLink: "உள்நுழைக",
    backToDarshan: "தரிசனத்திற்குத் திரும்பு",
    checkEmailMsg:
      "கிட்டத்தட்ட முடிந்தது! கணக்கை உறுதிப்படுத்த உங்கள் மின்னஞ்சலை சரிபார்த்து உள்நுழையவும்.",
    welcomeMsg: "வருக! நீங்கள் உள்நுழைந்துவிட்டீர்கள்.",
    harHarMahadev: "ஹர ஹர மஹாதேவ்! நீங்கள் உள்நுழைந்துவிட்டீர்கள்.",
    authFailed: "அங்கீகாரம் தோல்வியடைந்தது.",
    googleFailed: "Google உள்நுழைவு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.",
    authOfflineNotice: "ஆஃப்லைன் பயன்முறையில் பக்தர் உள்நுழைவு தற்போது கிடைக்கவில்லை.",
  },
};

function GoogleIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const { lang, fontClass, displayFontClass } = useLanguage();
  const t = AUTH_I18N[lang] || AUTH_I18N.en;

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast.info(t.authOfflineNotice);
      return;
    }
    setBusy(true);
    try {
      const redirectOrigin = getAuthRedirectOrigin();
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectOrigin,
            data: { display_name: name.trim() || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success(t.checkEmailMsg);
          setMode("signin");
          setPassword("");
          return;
        }
        toast.success(t.welcomeMsg);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t.harHarMahadev);
      }
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.authFailed);
    } finally {
      setBusy(false);
    }
  }

  async function googleSignIn() {
    if (!isSupabaseConfigured) {
      toast.info(t.authOfflineNotice);
      return;
    }
    try {
      const redirectOrigin = getAuthRedirectOrigin();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectOrigin,
        },
      });
      if (error) throw error;
    } catch (err) {
      toast.error(t.googleFailed);
    }
  }

  return (
    <div className="relative min-h-[calc(100dvh-4rem)] flex flex-col justify-center px-4 py-8 sm:px-6 sm:py-12 md:py-16">
      {/* Sacred ambient background glow */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
        aria-hidden="true"
      >
        <div className="size-[320px] sm:size-[440px] rounded-full bg-primary/10 blur-3xl" />
      </div>

      {/* Main card */}
      <div className="relative mx-auto w-full max-w-[420px]">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/70 bg-card/90 p-5 sm:p-7 md:p-8 shadow-2xl backdrop-blur-md">
          {/* Subtle top sacred highlight */}
          <div
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
            aria-hidden="true"
          />

          {/* 1. Spiritual Icon Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-primary/30 bg-primary/10 shadow-[0_0_20px_rgba(234,179,8,0.25)]">
              <Flame className="size-6 text-primary diya-flicker" />
            </div>
            <h1
              className={cn(
                "mt-3 text-xl sm:text-2xl font-bold tracking-tight text-foreground",
                displayFontClass,
              )}
            >
              {mode === "signin" ? t.welcomeBack : t.joinDarshan}
            </h1>
            <p
              className={cn(
                "mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed",
                fontClass,
              )}
            >
              {mode === "signin" ? t.subtitleSignIn : t.subtitleSignUp}
            </p>
          </div>

          {/* 2. Primary Google Sign-in */}
          <div>
            <button
              type="button"
              onClick={googleSignIn}
              disabled={busy}
              className="flex min-h-[48px] h-12 w-full items-center justify-center gap-3 rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-medium text-foreground shadow-xs transition-all hover:bg-muted/40 hover:border-primary/40 active:scale-[0.99] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              <GoogleIcon className="size-4.5 shrink-0" />
              <span className={cn("truncate", fontClass)}>{t.continueWithGoogle}</span>
            </button>
          </div>

          {/* 3. Subtle Divider */}
          <div className="relative my-5 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <span
              className={cn(
                "relative bg-card px-3 text-[11px] font-medium tracking-wider text-muted-foreground uppercase",
                fontClass,
              )}
            >
              {t.orDivider}
            </span>
          </div>

          {/* 4. Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label
                  htmlFor="auth-name"
                  className={cn("text-xs font-semibold text-foreground/90", fontClass)}
                >
                  {t.nameLabel}
                </Label>
                <Input
                  id="auth-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.namePlaceholder}
                  className={cn(
                    "min-h-[44px] h-11 sm:h-12 rounded-xl border-border/70 bg-background/60 px-3.5 text-sm placeholder:text-muted-foreground/60 transition-colors focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/40",
                    fontClass,
                  )}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label
                htmlFor="auth-email"
                className={cn("text-xs font-semibold text-foreground/90", fontClass)}
              >
                {t.emailLabel}
              </Label>
              <Input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                className="min-h-[44px] h-11 sm:h-12 rounded-xl border-border/70 bg-background/60 px-3.5 text-sm placeholder:text-muted-foreground/60 transition-colors focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/40"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="auth-password"
                className={cn("text-xs font-semibold text-foreground/90", fontClass)}
              >
                {t.passwordLabel}
              </Label>
              <div className="relative">
                <Input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className={cn(
                    "min-h-[44px] h-11 sm:h-12 rounded-xl border-border/70 bg-background/60 pl-3.5 pr-11 text-sm placeholder:text-muted-foreground/60 transition-colors focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/40",
                    fontClass,
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/40 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary active:scale-95 cursor-pointer"
                  aria-label={showPassword ? t.hidePassword : t.showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="size-4.5 shrink-0 text-muted-foreground" />
                  ) : (
                    <Eye className="size-4.5 shrink-0 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-1">
              <Button
                variant="hero"
                type="submit"
                className={cn(
                  "min-h-[48px] h-12 w-full rounded-xl text-sm font-semibold shadow-md active:scale-[0.99] transition-transform cursor-pointer",
                  fontClass,
                )}
                disabled={busy}
              >
                {busy ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    <span>{t.pleaseWait}</span>
                  </span>
                ) : mode === "signin" ? (
                  t.signInBtn
                ) : (
                  t.signUpBtn
                )}
              </Button>
            </div>
          </form>

          {/* 5. Switch between Sign In / Sign Up */}
          <div className="mt-5 text-center text-xs sm:text-sm text-muted-foreground">
            <span className={fontClass}>
              {mode === "signin" ? t.newHere : t.alreadyHaveAccount}
            </span>
            <button
              type="button"
              className={cn(
                "font-semibold text-primary underline underline-offset-4 transition-colors hover:text-primary/80 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary rounded-xs cursor-pointer",
                fontClass,
              )}
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setPassword("");
              }}
            >
              {mode === "signin" ? t.createAccountLink : t.signInLink}
            </button>
          </div>
        </div>

        {/* 6. Back to Darshan link */}
        <div className="mt-5 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground transition-colors hover:text-foreground py-1 px-3 rounded-lg focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary"
          >
            <ArrowLeft className="size-3.5 shrink-0" />
            <span className={fontClass}>{t.backToDarshan}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
