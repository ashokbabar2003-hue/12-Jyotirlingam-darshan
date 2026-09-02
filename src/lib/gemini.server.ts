import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs";
import path from "path";

let envInitialized = false;
let detectedKeySource = "none";

/**
 * Ensures server environment variables (especially GEMINI_API_KEY) are loaded into process.env.
 * Checks container config files like /app/.dev.env.json and .env files.
 */
export function ensureServerEnv(): void {
  if (typeof process === "undefined" || !process.env) return;

  const candidatePaths = [
    "/app/.dev.env.json",
    path.join(process.cwd(), ".dev.env.json"),
    path.join(process.cwd(), "..", ".dev.env.json"),
    "/app/applet/.dev.env.json",
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), "..", ".env"),
    "/app/.env",
    "/app/applet/.env",
  ];

  for (const filePath of candidatePaths) {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");
        if (filePath.endsWith(".json")) {
          const parsed = JSON.parse(content) as Record<string, unknown>;
          for (const [key, value] of Object.entries(parsed)) {
            if (typeof value === "string" && value.trim()) {
              if (!process.env[key] || !process.env[key]!.trim()) {
                process.env[key] = value.trim();
                if (key === "GEMINI_API_KEY") {
                  detectedKeySource = filePath;
                }
              }
            }
          }
        } else {
          const lines = content.split("\n");
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;
            const eqIdx = trimmed.indexOf("=");
            if (eqIdx > 0) {
              const key = trimmed.slice(0, eqIdx).trim();
              let val = trimmed.slice(eqIdx + 1).trim();
              if (
                (val.startsWith('"') && val.endsWith('"')) ||
                (val.startsWith("'") && val.endsWith("'"))
              ) {
                val = val.slice(1, -1);
              }
              if (key && val && (!process.env[key] || !process.env[key]!.trim())) {
                process.env[key] = val.trim();
                if (key === "GEMINI_API_KEY") {
                  detectedKeySource = filePath;
                }
              }
            }
          }
        }
      }
    } catch {
      // Continue checking other candidate paths
    }
  }

  // Check aliases for Gemini API key
  if (!process.env.GEMINI_API_KEY || !process.env.GEMINI_API_KEY.trim()) {
    const aliasMap: Record<string, string | undefined> = {
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
      GOOGLE_GENAI_API_KEY: process.env.GOOGLE_GENAI_API_KEY,
      VITE_GEMINI_API_KEY: process.env.VITE_GEMINI_API_KEY,
      VITE_GOOGLE_API_KEY: process.env.VITE_GOOGLE_API_KEY,
    };
    for (const [aliasName, aliasVal] of Object.entries(aliasMap)) {
      if (aliasVal && aliasVal.trim()) {
        process.env.GEMINI_API_KEY = aliasVal.trim();
        detectedKeySource = aliasName;
        break;
      }
    }
  } else if (detectedKeySource === "none") {
    detectedKeySource = "process.env.GEMINI_API_KEY";
  }

  envInitialized = true;
}

// Guarantee hydration immediately at module evaluation
ensureServerEnv();

/**
 * Authoritative helper to retrieve the Gemini API key for server code.
 */
export function getGeminiApiKey(): string | undefined {
  ensureServerEnv();
  const key =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.VITE_GOOGLE_API_KEY;

  const trimmedKey = key ? key.trim() : undefined;

  console.log("[GEMINI RUNTIME DEBUG]", {
    configured: Boolean(trimmedKey),
    keyLength: trimmedKey ? trimmedKey.length : 0,
    runtime: "server",
    cwd: typeof process !== "undefined" ? process.cwd() : "unknown",
    source: detectedKeySource,
  });

  return trimmedKey;
}

/**
 * Authoritative factory for GoogleGenAI client on the server.
 */
export function getGeminiClient(): GoogleGenAI {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    const processDefined = typeof process !== "undefined";
    const envDefined = processDefined && Boolean(process.env);
    const envKeys = envDefined
      ? Object.keys(process.env).filter(
          (k) =>
            k.includes("KEY") ||
            k.includes("API") ||
            k.includes("GEMINI") ||
            k.includes("GOOGLE") ||
            k.includes("PORT"),
        )
      : [];
    const cwd = processDefined ? process.cwd() : "unknown";
    throw new Error(
      `GEMINI_API_KEY environment variable is not configured. (Diagnostics: process=${processDefined}, env=${envDefined}, keys=[${envKeys.join(",")}], cwd=${cwd}, source=${detectedKeySource})`,
    );
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

const TEXT_MODELS_ORDER = [
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-2.5-flash",
  "gemini-3.7-flash",
];

const IMAGE_MODELS_ORDER = [
  "gemini-3.1-flash-image",
  "gemini-3.1-flash-lite-image",
  "gemini-2.5-flash-image",
];

/**
 * Generates plain text using standard text models with robust model fallback.
 */
export async function generateText(prompt: string, systemInstruction?: string): Promise<string> {
  const ai = getGeminiClient();

  let lastError: Error | null = null;
  for (const model of TEXT_MODELS_ORDER) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: systemInstruction ? { systemInstruction } : undefined,
      });

      const text = response.text?.trim();
      if (text) return text;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`Gemini text generation model '${model}' failed:`, lastError.message);
    }
  }

  throw new Error(
    `Text generation failed: ${lastError?.message || "No text returned from Gemini API."}`,
  );
}

/**
 * Generates structured JSON output adhering to a response schema.
 */
export async function generateStructuredOutput<T>(
  prompt: string,
  schema: { type: Type; properties: Record<string, unknown>; required?: string[] },
  systemInstruction?: string,
): Promise<T> {
  const ai = getGeminiClient();

  let lastError: Error | null = null;
  for (const model of TEXT_MODELS_ORDER) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });

      const raw = response.text?.trim() || "";
      if (!raw) continue;

      let clean = raw;
      if (clean.startsWith("```")) {
        clean = clean
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```$/, "")
          .trim();
      }

      const parsed = JSON.parse(clean) as T;
      return parsed;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`Gemini structured output model '${model}' failed:`, lastError.message);
    }
  }

  throw new Error(
    `Structured output generation failed: ${lastError?.message || "Invalid response format."}`,
  );
}

/**
 * Generates an image binary buffer from a prompt using Gemini image models.
 */
export async function generateImageBuffer(
  prompt: string,
): Promise<{ buffer: Buffer; extension: string }> {
  const ai = getGeminiClient();

  let lastError: Error | null = null;
  for (const model of IMAGE_MODELS_ORDER) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt.trim(),
        config: {
          imageConfig: {
            aspectRatio: "1:1",
          },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          const buffer = Buffer.from(part.inlineData.data, "base64");
          const extension = part.inlineData.mimeType?.includes("png") ? "png" : "jpg";
          return { buffer, extension };
        }
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`Gemini image model '${model}' failed:`, lastError.message);
    }
  }

  const msg = lastError?.message || "No image data returned from image generation models.";
  const isQuota =
    msg.includes("quota") || msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED");
  const cleanReason = isQuota ? "Gemini API image generation quota exceeded." : msg.slice(0, 160);

  throw new Error(`Image generation failed: ${cleanReason}`);
}

/**
 * Generates a devotional Instagram post draft (caption + image prompt).
 */
export async function generateDraftContent(
  shrineName: string,
  shrineLocation: string,
  suggestedTheme: string,
  recentPostsContext?: string,
): Promise<{
  shrineSlug: string;
  shrineName: string;
  location: string;
  contentArchetype: string;
  concept: string;
  caption: string;
  imagePrompt: string;
}> {
  const systemInstruction = `
You are an expert Hindu spiritual social media manager and creative director for the sacred 12 Jyotirlingas.
Your task is to write a fresh, unique, and deeply devotional Instagram caption and image prompt for ${shrineName} Jyotirlinga in ${shrineLocation}.

SUGGESTED CREATIVE THEME FOCUS FOR THIS DRAFT:
"${suggestedTheme}"

${recentPostsContext || ""}

CREATIVE DIVERSITY GUIDELINES:
1. Provide a GENUINELY DIFFERENT concept from past posts for this shrine.
2. Start with a captivating, distinct opening hook.
3. Write with spiritual warmth, reverence, and philosophical depth.
4. Conclude with a prayer invocation and 8-10 relevant hashtags.
5. Image prompt must describe a photorealistic, hyper-detailed, spiritual scene depicting ${shrineName} in ${shrineLocation}.
6. The image prompt MUST NOT be a generic temple description. It MUST include geographically and architecturally accurate features for ${shrineName}.
  `;

  const prompt = `Generate a distinct devotional Instagram post for ${shrineName} Jyotirlinga exploring theme: ${suggestedTheme}.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      shrineSlug: { type: Type.STRING },
      shrineName: { type: Type.STRING },
      location: { type: Type.STRING },
      contentArchetype: { type: Type.STRING },
      concept: { type: Type.STRING },
      caption: {
        type: Type.STRING,
        description: "Full formatted Instagram caption with hashtags",
      },
      imagePrompt: {
        type: Type.STRING,
        description:
          "Detailed photographic and spiritual image prompt with geographically and architecturally accurate features",
      },
    },
    required: [
      "shrineSlug",
      "shrineName",
      "location",
      "contentArchetype",
      "concept",
      "caption",
      "imagePrompt",
    ],
  };

  return generateStructuredOutput<{
    shrineSlug: string;
    shrineName: string;
    location: string;
    contentArchetype: string;
    concept: string;
    caption: string;
    imagePrompt: string;
  }>(prompt, schema, systemInstruction, "gemini-3.1-pro");
}

export async function generateCaptionAssistance(
  action: "suggest" | "improve" | "hashtags",
  caption?: string,
  shrineName?: string,
): Promise<string> {
  const targetShrine = shrineName || "Lord Shiva & Sacred Temples";

  let promptText = "";
  if (action === "suggest") {
    promptText = `Write an evocative, devout Instagram caption (2-3 sentences) with authentic spiritual depth and 5 relevant hashtags for a post about ${targetShrine}. Output ONLY the caption text itself. Do NOT include greetings, intro phrases, options, or conversational commentary.`;
  } else if (action === "improve") {
    promptText = `You are a professional social media editor. Refine and polish the following Instagram caption into a single ready-to-publish caption with 5 relevant hashtags.
CRITICAL MANDATE: Output ONLY the final finished caption text. Do NOT include any intro text, explanations, bullet points, options, or conversational filler.

Original Caption: "${caption || ""}"`;
  } else {
    promptText = `Provide 10 popular, relevant spiritual Instagram hashtags for a post about ${targetShrine} and Lord Shiva devotion. Output space-separated hashtags ONLY. Do NOT include intro or outro text.`;
  }

  let text = await generateText(promptText);

  if (action === "improve" || action === "suggest") {
    text = text
      .replace(/^(?:Here (?:is|are) [^\n]+:\s*)/i, "")
      .replace(/^(?:Option \d+:\s*)/i, "")
      .replace(/^"|"$/g, "")
      .trim();
  }

  return text;
}
