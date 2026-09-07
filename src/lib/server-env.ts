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

  // In Node.js server environments, try to dynamically read local dev env files if available.
  // In Cloudflare Workers / Edge environments, process.versions.node is absent or fs is unavailable.
  try {
    const isNode = Boolean(
      typeof process !== "undefined" &&
        process.versions &&
        process.versions.node &&
        typeof process.cwd === "function",
    );

    if (isNode) {
      // Dynamic import or require inside try/catch so Edge bundlers don't inject top-level Node dependencies
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nodeFs = typeof require === "function" ? require("fs") : null;
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nodePath = typeof require === "function" ? require("path") : null;

      if (nodeFs?.existsSync && nodePath?.join) {
        const cwd = process.cwd();
        const candidatePaths = [
          "/app/.dev.env.json",
          nodePath.join(cwd, ".dev.env.json"),
          nodePath.join(cwd, "..", ".dev.env.json"),
          "/app/applet/.dev.env.json",
          nodePath.join(cwd, ".env"),
          nodePath.join(cwd, ".env.local"),
          nodePath.join(cwd, "..", ".env"),
          "/app/.env",
          "/app/applet/.env",
        ];

        for (const filePath of candidatePaths) {
          try {
            if (nodeFs.existsSync(filePath)) {
              const content = nodeFs.readFileSync(filePath, "utf8");
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
      }
    }
  } catch {
    // Edge runtime safe fallback
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
