import fs from "fs";
import path from "path";

let initialized = false;

function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (key) {
        result[key] = value;
      }
    }
  }
  return result;
}

export function ensureServerEnv() {
  if (typeof process === "undefined" || !process.env) return;
  if (initialized) return;

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
              }
            }
          }
        } else {
          const parsed = parseEnvFile(content);
          for (const [key, value] of Object.entries(parsed)) {
            if (value && (!process.env[key] || !process.env[key]!.trim())) {
              process.env[key] = value.trim();
            }
          }
        }
      }
    } catch {
      // Continue checking other candidates
    }
  }

  // Check aliases for Gemini API key
  if (!process.env.GEMINI_API_KEY || !process.env.GEMINI_API_KEY.trim()) {
    const alias =
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      process.env.VITE_GOOGLE_API_KEY;
    if (alias && alias.trim()) {
      process.env.GEMINI_API_KEY = alias.trim();
    }
  }

  initialized = true;
}

export function getServerEnv(key: string): string | undefined {
  ensureServerEnv();
  return process.env[key];
}

export function getGeminiApiKey(): string | undefined {
  ensureServerEnv();
  const key =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.VITE_GOOGLE_API_KEY;

  return key ? key.trim() : undefined;
}
