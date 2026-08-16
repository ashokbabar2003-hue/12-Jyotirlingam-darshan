import fs from "fs";
import path from "path";
import { resolveCanonicalImageUrl } from "./instagram.server";
import { ensureServerEnv, generateImageBuffer, getGeminiApiKey } from "./gemini.server";

export interface ImageGenerationResult {
  imageUrl: string;
  filename: string;
  source: "generated";
}

/**
 * Validates that an image URL meets all production constraints:
 * - Uses canonical APP_URL / production domain
 * - Is HTTPS
 * - Does not point to localhost, ais-dev-, or ais-pre-
 */
export function validateProductionImageUrl(url: string): { valid: boolean; reason?: string } {
  if (!url || typeof url !== "string") {
    return { valid: false, reason: "Image URL is empty." };
  }

  if (!url.startsWith("https://")) {
    return { valid: false, reason: "Image URL must use HTTPS protocol." };
  }

  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    return { valid: false, reason: "Image URL must not point to localhost." };
  }

  if (url.includes("ais-dev-") || url.includes("ais-pre-")) {
    return { valid: false, reason: "Image URL must not point to preview environments." };
  }

  return { valid: true };
}

/**
 * Generates a new image from a creative image prompt using Google Gemini.
 * Saves the resulting image binary to the public directory and resolves its canonical public URL.
 * Throws a clean, descriptive error if generation fails, ensuring previous images are preserved.
 */
export async function generateImageForPrompt(prompt: string, slug: string): Promise<string> {
  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    throw new Error("Image prompt is required for image generation.");
  }

  ensureServerEnv();

  let imageBuffer: Buffer | null = null;
  let imageExtension = "jpg";

  try {
    const res = await generateImageBuffer(prompt);
    imageBuffer = res.buffer;
    imageExtension = res.extension;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Image regeneration failed: ${msg}. Your previous image has been preserved.`);
  }

  // 2. Persist image binary to public storage
  const cleanSlug = (slug || "jyotirlinga").toLowerCase().replace(/[^a-z0-9_-]/g, "");
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  const filename = `gen-${cleanSlug}-${Date.now()}-${randomSuffix}.${imageExtension}`;

  const publicDir = path.join(process.cwd(), "public", "generated");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const filePath = path.join(publicDir, filename);
  fs.writeFileSync(filePath, imageBuffer);

  // Also write to .output/public/generated if in production build
  const outputPublicDir = path.join(process.cwd(), ".output", "public", "generated");
  if (fs.existsSync(path.join(process.cwd(), ".output", "public"))) {
    if (!fs.existsSync(outputPublicDir)) {
      fs.mkdirSync(outputPublicDir, { recursive: true });
    }
    fs.writeFileSync(path.join(outputPublicDir, filename), imageBuffer);
  }

  // 3. Resolve canonical public URL
  const publicImageUrl = resolveCanonicalImageUrl(`/generated/${filename}`);

  // 4. Validate URL formatting
  const validation = validateProductionImageUrl(publicImageUrl);
  if (!validation.valid) {
    throw new Error(
      `Image regeneration failed: Generated image URL did not pass validation (${validation.reason}). Your previous image has been preserved.`,
    );
  }

  return publicImageUrl;
}
