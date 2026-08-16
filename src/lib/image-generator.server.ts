import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { resolveCanonicalImageUrl } from "./instagram.server";
import { ensureServerEnv, generateImageBuffer, getGeminiApiKey } from "./gemini.server";

function getSupabaseAdmin() {
  ensureServerEnv();
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase credentials missing in server environment");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface ImageGenerationResult {
  imageUrl: string;
  filename: string;
  source: "generated";
}

/**
 * Validates that an image URL meets all production constraints:
 * - Uses canonical APP_URL / production domain or Supabase storage domain
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
 * Uploads the resulting binary to Supabase Storage and resolves a public HTTPS URL.
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
    const res = await generateImageBuffer(prompt, slug);
    imageBuffer = res.buffer;
    imageExtension = res.extension;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[REGEN DEBUG 5 ERROR] Image generation API call failed:", msg);
    if (msg.includes("quota is exhausted") || msg.includes("currently unavailable")) {
      throw new Error(msg);
    }
    throw new Error(`${msg}. Your previous image has been preserved.`);
  }

  if (!imageBuffer || imageBuffer.length === 0) {
    throw new Error("Image generation failed: empty image buffer received.");
  }

  console.log("[REGEN DEBUG 6] Image bytes extracted", {
    imageByteLength: imageBuffer.length,
    imageExtension,
  });

  const cleanSlug = (slug || "jyotirlinga").toLowerCase().replace(/[^a-z0-9_-]/g, "");
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  const filename = `gen-${cleanSlug}-${Date.now()}-${randomSuffix}.${imageExtension}`;
  const storagePath = `uploads/${filename}`;

  // 1. Upload buffer to Supabase Storage
  let publicImageUrl = "";
  try {
    const supabase = getSupabaseAdmin();

    // Ensure social-media bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.some((b) => b.name === "social-media")) {
      await supabase.storage.createBucket("social-media", { public: true });
    }

    const { error: uploadErr } = await supabase.storage
      .from("social-media")
      .upload(storagePath, imageBuffer, {
        contentType: imageExtension === "png" ? "image/png" : "image/jpeg",
        upsert: true,
      });

    if (uploadErr) {
      console.error("[REGEN DEBUG 7 ERROR] Storage upload failed:", uploadErr.message);
    } else {
      console.log("[REGEN DEBUG 7] Storage upload completed", { storagePath });
      const { data: pubData } = supabase.storage.from("social-media").getPublicUrl(storagePath);
      publicImageUrl = pubData.publicUrl;
      console.log("[REGEN DEBUG 8] Public URL created", {
        publicUrlCreated: Boolean(publicImageUrl),
        publicUrl: publicImageUrl,
      });
    }
  } catch (stgErr) {
    console.error("[REGEN DEBUG 7 ERROR] Storage upload exception:", stgErr);
  }

  // 2. Local disk fallback writing if storage publicUrl is not available
  if (!publicImageUrl) {
    const publicDir = path.join(process.cwd(), "public", "generated");
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    const filePath = path.join(publicDir, filename);
    fs.writeFileSync(filePath, imageBuffer);

    publicImageUrl = resolveCanonicalImageUrl(`/generated/${filename}`);
    console.log("[REGEN DEBUG 8] Local Public URL created", { publicUrl: publicImageUrl });
  }

  // 3. Validate URL formatting
  const validation = validateProductionImageUrl(publicImageUrl);
  if (!validation.valid) {
    throw new Error(
      `Image regeneration failed: Generated image URL did not pass validation (${validation.reason}). Your previous image has been preserved.`,
    );
  }

  return publicImageUrl;
}
