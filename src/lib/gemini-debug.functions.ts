import { createServerFn } from "@tanstack/react-start";
import { ensureServerEnv, getGeminiApiKey } from "./gemini.server";

export interface GeminiDebugReport {
  available: boolean;
  length: number;
  source: string;
  cwd: string;
  timestamp: string;
  envKeys: string[];
}

export const getGeminiDebugStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<GeminiDebugReport> => {
    // 1. Ensure the server environment is fully loaded from all candidate files
    ensureServerEnv();

    const rawKey = process.env.GEMINI_API_KEY || "";
    const resolvedKey = getGeminiApiKey() || "";

    const available = resolvedKey.trim().length > 0;
    const keyLength = resolvedKey.trim().length;

    // Detect key source safely
    let source = "not_found";
    if (process.env.GEMINI_API_KEY) {
      source = "process.env.GEMINI_API_KEY";
    } else if (process.env.VITE_GEMINI_API_KEY) {
      source = "process.env.VITE_GEMINI_API_KEY";
    }

    const envKeys = Object.keys(process.env).filter(
      (k) =>
        k.includes("KEY") ||
        k.includes("API") ||
        k.includes("GEMINI") ||
        k.includes("GOOGLE") ||
        k.includes("PORT"),
    );

    const report: GeminiDebugReport = {
      available,
      length: keyLength,
      source,
      cwd: typeof process !== "undefined" ? process.cwd() : "unknown",
      timestamp: new Date().toISOString(),
      envKeys,
    };

    // Safe logging to the server console
    console.log("[GEMINI SERVER DEBUG REPORT]:", {
      ...report,
      rawKeyLength: rawKey.length,
    });

    return report;
  },
);
