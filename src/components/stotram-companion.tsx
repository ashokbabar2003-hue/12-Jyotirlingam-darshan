import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Send, Loader2, Music4, Trash2, Play, Pause, RefreshCw } from "lucide-react";
import {
  askStotram,
  loadStotramHistory,
  saveStotramTurn,
  clearStotramHistory,
  generateStotramAudio,
} from "@/lib/stotram.functions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage, fontClassFor } from "@/hooks/use-language";
import { toast } from "sonner";

type StyleKey = "priest" | "sage" | "devotee" | "chorister" | "narrator";
type TempoKey = "slow" | "normal" | "brisk";

const STYLE_OPTIONS: { value: StyleKey; label: string }[] = [
  { value: "priest", label: "Temple Priest" },
  { value: "sage", label: "Wise Sage" },
  { value: "devotee", label: "Heartfelt Devotee" },
  { value: "chorister", label: "Melodic Chorister" },
  { value: "narrator", label: "Storyteller" },
];
const TEMPO_OPTIONS: { value: TempoKey; label: string }[] = [
  { value: "slow", label: "Slow" },
  { value: "normal", label: "Normal" },
  { value: "brisk", label: "Brisk" },
];

type Msg = { role: "user" | "assistant"; content: string };

export function StotramCompanion({ slug, shrineName }: { slug: string; shrineName: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [style, setStyle] = useState<StyleKey>("priest");
  const [tempo, setTempo] = useState<TempoKey>("slow");
  const [lastScript, setLastScript] = useState<string | null>(null);
  const { user } = useAuth();
  const { lang } = useLanguage();
  const qc = useQueryClient();

  const GREETINGS: Record<string, string> = {
    en: `🙏 Har Har Mahadev. I am Stotram, your companion for ${shrineName}. Ask me about its legends, history, or significance — or tap the music note for a short recitation.`,
    hi: `🙏 हर हर महादेव। मैं स्तोत्रम् हूँ, ${shrineName} के लिए आपका साथी। इसकी कथाओं, इतिहास या महिमा के बारे में पूछें — या संगीत चिन्ह दबाकर एक लघु स्तोत्र सुनें।`,
    mr: `🙏 हर हर महादेव. मी स्तोत्रम्, ${shrineName} साठी आपला सहचर. याच्या कथा, इतिहास किंवा महात्म्याबद्दल विचारा — किंवा संगीत चिन्हावर टॅप करून लघु स्तोत्र ऐका.`,
    gu: `🙏 હર હર મહાદેવ. હું સ્તોત્રમ્ છું, ${shrineName} માટે તમારો સાથી. તેની કથાઓ, ઇતિહાસ કે મહિમા વિશે પૂછો — અથવા સંગીત આઇકન દબાવીને લઘુ સ્તોત્ર સાંભળો.`,
    te: `🙏 హర హర మహాదేవ. నేను స్తోత్రమ్, ${shrineName} కు మీ సహచరుడిని. దీని కథలు, చరిత్ర, మహిమ గురించి అడగండి — లేదా సంగీత చిహ్నం నొక్కి చిన్న స్తోత్రం వినండి.`,
    ta: `🙏 ஹர ஹர மகாதேவ. நான் ஸ்தோத்ரம், ${shrineName}க்கான உங்கள் துணை. இதன் புராணக் கதைகள், வரலாறு அல்லது மகிமை பற்றி கேளுங்கள் — அல்லது இசை ஐகானை அழுத்தி சிறு ஸ்தோத்ரம் கேளுங்கள்.`,
  };
  const greeting: Msg = { role: "assistant", content: GREETINGS[lang] ?? GREETINGS.en };
  const [messages, setMessages] = useState<Msg[]>([greeting]);

  const askFn = useServerFn(askStotram);
  const loadFn = useServerFn(loadStotramHistory);
  const saveFn = useServerFn(saveStotramTurn);
  const clearFn = useServerFn(clearStotramHistory);
  const audioFn = useServerFn(generateStotramAudio);

  // Load saved history for signed-in users
  const historyQ = useQuery({
    queryKey: ["stotram-history", slug, user?.id ?? "guest"],
    queryFn: () => loadFn({ data: { slug } }),
    enabled: !!user && open,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (historyQ.data?.messages && historyQ.data.messages.length > 0) {
      setMessages([greeting, ...historyQ.data.messages]);
    } else if (historyQ.data) {
      setMessages([greeting]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyQ.data]);
  // Update greeting when language changes
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 0) return [greeting];
      const [, ...rest] = prev;
      return [greeting, ...rest];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const ask = useMutation({
    mutationFn: async (next: Msg[]) => askFn({ data: { slug, messages: next.slice(1), lang } }),
    onSuccess: async (res, next) => {
      const reply = res.reply || "…";
      setMessages([...next, { role: "assistant", content: reply }]);
      if (user) {
        const lastUser = next[next.length - 1];
        try {
          await saveFn({
            data: { slug, turns: [lastUser, { role: "assistant", content: reply }] },
          });
          qc.invalidateQueries({ queryKey: ["stotram-history", slug, user.id] });
        } catch {
          /* non-blocking */
        }
      }
    },
    onError: (err: Error) => {
      setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${err.message}` }]);
    },
  });

  const clearMut = useMutation({
    mutationFn: () => clearFn({ data: { slug } }),
    onSuccess: () => {
      setMessages([greeting]);
      if (user) qc.invalidateQueries({ queryKey: ["stotram-history", slug, user.id] });
      toast.success("Conversation cleared");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const FALLBACK_NOTICES: Record<string, string> = {
    en: "Note: your selected language isn't available for recitation yet — using English instead.",
    mr: "सूचना: आपली निवडलेली भाषा अद्याप स्तोत्रासाठी उपलब्ध नाही — इंग्रजीत सादर करत आहे.",
    hi: "सूचना: आपकी चुनी हुई भाषा अभी स्तोत्र पाठ के लिए उपलब्ध नहीं है — अंग्रेज़ी में प्रस्तुत कर रहा हूँ.",
    gu: "નોંધ: તમારી પસંદ કરેલી ભાષા હજુ સ્તોત્ર માટે ઉપલબ્ધ નથી — અંગ્રેજીમાં રજૂ કરું છું.",
    te: "గమనిక: మీ ఎంచుకున్న భాష ఇంకా అందుబాటులో లేదు — ఇంగ్లీషులో అందిస్తున్నాను.",
    ta: "குறிப்பு: நீங்கள் தேர்ந்தெடுத்த மொழி இன்னும் கிடைக்கவில்லை — ஆங்கிலத்தில் வழங்குகிறேன்.",
  };

  const audioMut = useMutation({
    mutationFn: (opts: { reuse: boolean }) =>
      audioFn({
        data: {
          slug,
          lang,
          style,
          tempo,
          reuseScript: opts.reuse && lastScript ? lastScript : undefined,
        },
      }),
    onSuccess: (res, variables) => {
      setAudioUrl(res.audioDataUrl);
      setLastScript(res.script);
      const notice = res.fellBack ? `${FALLBACK_NOTICES[lang] ?? FALLBACK_NOTICES.en}\n\n` : "";
      const styleLabel = STYLE_OPTIONS.find((s) => s.value === style)?.label ?? style;
      const tempoLabel = TEMPO_OPTIONS.find((t) => t.value === tempo)?.label ?? tempo;
      const header = variables.reuse
        ? `🎶 Regenerated · ${styleLabel} · ${tempoLabel}`
        : `🎶 ${styleLabel} · ${tempoLabel}`;
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `${header}\n${notice}${res.script}` },
      ]);
      if (res.fellBack) {
        toast.message(FALLBACK_NOTICES[lang] ?? FALLBACK_NOTICES.en);
      }
      setTimeout(() => {
        audioRef.current?.play().catch(() => {});
      }, 100);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, ask.isPending, audioMut.isPending]);

  const send = () => {
    const text = input.trim();
    if (!text || ask.isPending) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    ask.mutate(next);
  };

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play();
    else a.pause();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-6 right-6 z-40 rounded-full shadow-elegant bg-gradient-aarti text-primary-foreground"
        >
          <Sparkles className="size-4" /> Ask Stotram
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border/60 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <SheetTitle className="flex items-center gap-2 font-display">
                <Sparkles className="size-4 text-primary" /> Stotram · {shrineName}
              </SheetTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {user
                  ? "Your conversation is saved and restored on this shrine."
                  : "Sign in to save your conversation across visits."}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => audioMut.mutate({ reuse: false })}
                disabled={audioMut.isPending}
                title="Play a short stotram recitation"
              >
                {audioMut.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Music4 className="size-4" />
                )}
              </Button>
              {user && messages.length > 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => clearMut.mutate()}
                  disabled={clearMut.isPending}
                  title="Clear saved history"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="mt-3 space-y-2 rounded-md border border-border/60 bg-muted/40 p-2">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={style} onValueChange={(v) => setStyle(v as StyleKey)}>
                <SelectTrigger className="h-8 flex-1 min-w-[140px] text-xs">
                  <SelectValue placeholder="Voice style" />
                </SelectTrigger>
                <SelectContent>
                  {STYLE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={tempo} onValueChange={(v) => setTempo(v as TempoKey)}>
                <SelectTrigger className="h-8 w-[110px] text-xs">
                  <SelectValue placeholder="Tempo" />
                </SelectTrigger>
                <SelectContent>
                  {TEMPO_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                onClick={() => audioMut.mutate({ reuse: !!lastScript })}
                disabled={audioMut.isPending}
                className="h-8 gap-1"
                title={
                  lastScript ? "Regenerate audio with these settings" : "Generate a recitation"
                }
              >
                {audioMut.isPending ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <RefreshCw className="size-3" />
                )}
                <span className="text-xs">{lastScript ? "Regenerate" : "Generate"}</span>
              </Button>
            </div>

            {audioUrl && (
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" onClick={togglePlay} className="size-8">
                  {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
                </Button>
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  onEnded={() => setPlaying(false)}
                  controls
                  className="h-8 flex-1"
                />
              </div>
            )}
          </div>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {historyQ.isLoading && user && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> Restoring your conversation…
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                  fontClassFor(lang),
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          {ask.isPending && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> Stotram is reflecting…
            </div>
          )}
        </div>

        <div className="border-t border-border/60 p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-end gap-2"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={`Ask about ${shrineName}…`}
              rows={2}
              className="flex-1 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <Button type="submit" size="icon" disabled={ask.isPending || !input.trim()}>
              {ask.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
