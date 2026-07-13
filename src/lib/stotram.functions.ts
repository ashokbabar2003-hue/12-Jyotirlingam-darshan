import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getJyotirlinga } from "@/data/jyotirlingas";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { GoogleGenAI } from "@google/genai";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const LangSchema = z.enum(["en", "mr", "hi", "gu", "te", "ta"]).default("en");

const LANG_NAMES: Record<string, string> = {
  en: "English",
  mr: "Marathi (मराठी, Devanagari script)",
  hi: "Hindi (हिन्दी, Devanagari script)",
  gu: "Gujarati (ગુજરાતી script)",
  te: "Telugu (తెలుగు script)",
  ta: "Tamil (தமிழ் script)",
};

const InputSchema = z.object({
  slug: z.string().min(1).max(64),
  messages: z.array(MessageSchema).min(1).max(30),
  lang: LangSchema.optional(),
});

function systemPrompt(slug: string, lang: string = "en") {
  const jl = getJyotirlinga(slug);
  if (!jl) throw new Error("Unknown shrine");
  return `You are "Stotram", a calm, respectful AI companion devoted to the twelve Jyotirlingas of Lord Shiva.
The devotee is currently seeking guidance about **${jl.name} Jyotirlinga** (${jl.deity}), located at ${jl.location}, ${jl.state}, near ${jl.river}.

Context about this shrine:
- Description: ${jl.description}
- Significance: ${jl.significance}

Guidelines:
- Speak gently, reverently, and simply — like a temple elder sharing wisdom.
- Focus on legends (puranic stories), history, rituals, and spiritual significance of THIS specific Jyotirlinga.
- If asked about another Jyotirlinga, briefly answer then invite them back to ${jl.name}.
- If unsure, say so humbly. Never invent dates, names, or scripture verses.
- Keep answers concise (2–5 short paragraphs). Use Sanskrit terms sparingly with a short gloss.
- End respectfully when apt (e.g., "Har Har Mahadev 🙏").

Language:
- ALWAYS reply in ${LANG_NAMES[lang] ?? "English"}, regardless of the language of the devotee's question.
- Use the native script for that language. Sanskrit mantras may stay in Devanagari with a short gloss in the target language.`;
}

export const askStotram = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is not configured.");

    const ai = new GoogleGenAI({ apiKey });

    // Convert system prompt
    const systemInstruction = systemPrompt(data.slug, data.lang ?? "en");

    // Convert messages to Gemini API format
    const contents = data.messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
        },
      });

      return { reply: response.text ?? "" };
    } catch (err) {
      console.error("Gemini API error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`AI error: ${msg}`);
    }
  });

/* ---------------- History persistence (signed-in users) ---------------- */

const SlugInput = z.object({ slug: z.string().min(1).max(64) });

export const loadStotramHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => SlugInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("stotram_messages")
      .select("role, content, created_at")
      .eq("user_id", userId)
      .eq("slug", data.slug)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) throw new Error(error.message);
    return { messages: (rows ?? []) as { role: "user" | "assistant"; content: string }[] };
  });

export const saveStotramTurn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        slug: z.string().min(1).max(64),
        turns: z.array(MessageSchema).min(1).max(2),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const rows = data.turns.map((t) => ({
      user_id: userId,
      slug: data.slug,
      role: t.role,
      content: t.content,
    }));
    const { error } = await supabase.from("stotram_messages").insert(rows);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const clearStotramHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => SlugInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("stotram_messages")
      .delete()
      .eq("user_id", userId)
      .eq("slug", data.slug);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------- Stotram recitation audio (TTS) ---------------- */

export const VOICE_STYLES = {
  priest: {
    voice: "Fenrir",
    label: "Temple Priest (deep, reverent)",
    instructions:
      "Speak slowly, warmly, and reverently, like a temple priest reciting a stotram. Deep, calm cadence.",
  },
  sage: {
    voice: "Zephyr",
    label: "Wise Sage (soft, meditative)",
    instructions:
      "Speak in a soft, meditative, contemplative tone — as an aged sage whispering ancient wisdom. Gentle pauses.",
  },
  devotee: {
    voice: "Kore",
    label: "Devotee (bright, heartfelt)",
    instructions:
      "Speak with heartfelt devotion, bright and sincere, as a joyous devotee singing the Lord's name.",
  },
  chorister: {
    voice: "Puck",
    label: "Chorister (melodic, chant-like)",
    instructions:
      "Speak in a melodic, chant-like manner with lyrical rhythm, evoking a temple chorus.",
  },
  narrator: {
    voice: "Charon",
    label: "Storyteller (clear, narrative)",
    instructions:
      "Speak in a clear, warm storyteller's voice with steady pacing, as one narrating a sacred legend.",
  },
} as const;

const StyleSchema = z.enum(["priest", "sage", "devotee", "chorister", "narrator"]);
const TempoSchema = z.enum(["slow", "normal", "brisk"]);

const AudioInput = z.object({
  slug: z.string().min(1).max(64),
  lang: LangSchema.optional(),
  style: StyleSchema.optional(),
  tempo: TempoSchema.optional(),
  reuseScript: z.string().min(1).max(4000).optional(),
});

function encodeWavHeader(pcmLength: number, sampleRate: number): Uint8Array {
  const header = new Uint8Array(44);
  const view = new DataView(header.buffer);

  header[0] = 0x52; // 'R'
  header[1] = 0x49; // 'I'
  header[2] = 0x46; // 'F'
  header[3] = 0x46; // 'F'

  view.setUint32(4, 36 + pcmLength, true);

  header[8] = 0x57; // 'W'
  header[9] = 0x41; // 'A'
  header[10] = 0x56; // 'V'
  header[11] = 0x45; // 'E'

  header[12] = 0x66; // 'f'
  header[13] = 0x6d; // 'm'
  header[14] = 0x74; // 't'
  header[15] = 0x20; // ' '

  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);

  header[36] = 0x64; // 'd'
  header[37] = 0x61; // 'a'
  header[38] = 0x74; // 't'
  header[39] = 0x61; // 'a'

  view.setUint32(40, pcmLength, true);

  return header;
}

export const generateStotramAudio = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => AudioInput.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is not configured.");
    const jl = getJyotirlinga(data.slug);
    if (!jl) throw new Error("Unknown shrine");

    const requestedLang = (data.lang ?? "en") as string;
    const langAvailable = requestedLang in LANG_NAMES;
    const effectiveLang = langAvailable ? requestedLang : "en";
    const languageName = LANG_NAMES[effectiveLang];
    const styleKey = data.style ?? "priest";
    const style = VOICE_STYLES[styleKey];
    const tempoKey = data.tempo ?? "slow";

    const ai = new GoogleGenAI({ apiKey });

    // 1) Compose script — reuse the previous one when regenerating with a new voice/tempo.
    let script = data.reuseScript?.trim() ?? "";
    if (!script) {
      try {
        const scriptResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `Compose a short devotional stotram snippet in honor of ${jl.name} Jyotirlinga (${jl.deity}) at ${jl.location}, ${jl.state}. Reference the shrine's essence: ${jl.significance}`,
          config: {
            systemInstruction: `You compose short, reverent Shiva stotram snippets. Output ONLY the recitation text — no titles, no explanation, no markdown. 4 to 8 short lines. Include a closing salutation.

Language: write the entire snippet in ${languageName}, using that language's native script. Traditional Sanskrit mantras (e.g. "ॐ नमः शिवाय" / "Om Namah Shivaya") may appear in Devanagari or transliteration as appropriate, but explanatory or devotional lines must be in ${languageName}.`,
          },
        });
        script = scriptResponse.text?.trim() ?? "";
        if (!script) throw new Error("Empty script returned from AI");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`Stotram script generation failed: ${msg}`);
      }
    }

    // 2) Convert to speech using Gemini TTS model
    const ttsPrompt = `Style: ${style.instructions}
Language: Pronounce the text as ${languageName}.
Recitation Speed: Recite at a ${tempoKey} pace.

Text to recite:
${script}`;

    try {
      const ttsResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: ttsPrompt }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: style.voice },
            },
          },
        },
      });

      const pcmBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!pcmBase64) throw new Error("No audio payload received from TTS");

      // Convert PCM base64 to Uint8Array bytes
      const pcmBinary = atob(pcmBase64);
      const pcmBytes = new Uint8Array(pcmBinary.length);
      for (let i = 0; i < pcmBinary.length; i++) {
        pcmBytes[i] = pcmBinary.charCodeAt(i);
      }

      // Encode as standard WAV (16-bit, 1 channel, 24000Hz sampling rate)
      const wavHeader = encodeWavHeader(pcmBytes.length, 24000);
      const wavBytes = new Uint8Array(wavHeader.length + pcmBytes.length);
      wavBytes.set(wavHeader, 0);
      wavBytes.set(pcmBytes, wavHeader.length);

      // Convert final WAV bytes to base64
      let bin = "";
      for (let i = 0; i < wavBytes.length; i += 0x8000) {
        bin += String.fromCharCode.apply(null, Array.from(wavBytes.subarray(i, i + 0x8000)));
      }
      const audioBase64 = btoa(bin);

      return {
        script,
        audioDataUrl: `data:audio/wav;base64,${audioBase64}`,
        requestedLang,
        effectiveLang,
        fellBack: !langAvailable,
        style: styleKey,
        tempo: tempoKey,
      };
    } catch (err) {
      console.error("Gemini TTS error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`TTS generation failed: ${msg}`);
    }
  });
