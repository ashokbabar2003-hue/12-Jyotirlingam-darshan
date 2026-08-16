import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { getJyotirlinga } from "@/data/jyotirlingas";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  createInstagramMediaContainer,
  createInstagramCarouselItemContainer,
  createInstagramCarouselContainer,
  createInstagramReelContainer,
  publishInstagramMedia,
  resolveCanonicalImageUrl,
  waitForInstagramMediaReady,
} from "./instagram.server";
import { generateImageForPrompt } from "./image-generator.server";
import {
  ensureServerEnv,
  getGeminiApiKey,
  generateDraftContent,
  generateCaptionAssistance,
} from "./gemini.server";

// Using a custom client to avoid strictly requiring generated types for the new table yet
function adminClient() {
  ensureServerEnv();
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(url!, key!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface SocialPostMedia {
  id: string;
  social_post_id: string;
  storage_path: string;
  public_url: string;
  media_type: "image" | "video";
  sort_order: number;
  created_at: string;
}

export interface SocialPost {
  id: string;
  jyotirlinga_slug: string;
  post_type?: "image" | "carousel" | "reel";
  status: "draft" | "pending_approval" | "approved" | "published" | "failed";
  caption: string | null;
  image_prompt: string | null;
  image_url: string | null;
  instagram_media_id: string | null;
  scheduled_for: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  media?: SocialPostMedia[];
}

export const getSocialPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const supabase = adminClient();

    let data: any[] | null = null;
    let error = null;

    // Try fetching with social_post_media relation
    const res = await supabase
      .from("social_posts")
      .select("*, media:social_post_media(*)")
      .order("created_at", { ascending: false });

    if (res.error) {
      // Fallback if table doesn't exist yet
      const fallbackRes = await supabase
        .from("social_posts")
        .select("*")
        .order("created_at", { ascending: false });
      data = fallbackRes.data;
      error = fallbackRes.error;
    } else {
      data = res.data;
    }

    if (error) {
      console.error("Failed to fetch social posts:", error);
      if (error.code === "42P01") return [];
      throw new Error(error.message);
    }

    // Standardize post_type and media array fallback
    const normalized = (data || []).map((p: any) => {
      const fallbackMedia = p.image_url
        ? [
            {
              id: p.id,
              social_post_id: p.id,
              storage_path: p.image_url,
              public_url: p.image_url,
              media_type: "image",
              sort_order: 0,
              created_at: p.created_at,
            },
          ]
        : [];
      return {
        ...p,
        post_type: p.post_type || (p.media && p.media.length > 1 ? "carousel" : "image"),
        media: p.media && p.media.length > 0 ? p.media : fallbackMedia,
      };
    });

    return normalized as SocialPost[];
  });

export const draftSocialPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: string | { slug: string }) => {
    if (typeof d === "string") return d;
    if (d && typeof d === "object" && "slug" in d) return d.slug;
    return String(d || "");
  })
  .handler(async ({ data: rawSlug }) => {
    const slug = typeof rawSlug === "string" ? rawSlug.trim() : "";
    console.log("[DRAFT DEBUG 3] Server function entered for slug:", slug);

    if (!slug) {
      throw new Error("Invalid Jyotirlinga slug.");
    }

    console.log("[DRAFT DEBUG 4] Authentication passed");

    const jyotirlinga = getJyotirlinga(slug);
    if (!jyotirlinga) {
      throw new Error(`Jyotirlinga with slug '${slug}' not found.`);
    }
    console.log("[DRAFT DEBUG 5] Jyotirlinga resolved:", jyotirlinga.name);

    ensureServerEnv();

    const supabase = adminClient();

    // 1. Retrieve bounded history of recent posts for this Jyotirlinga to ensure concept diversity
    let recentPostsContext = "";
    let pastThemesCount = 0;
    try {
      const { data: recentPosts } = await supabase
        .from("social_posts")
        .select("caption, image_prompt, created_at")
        .eq("jyotirlinga_slug", slug)
        .order("created_at", { ascending: false })
        .limit(10);

      if (recentPosts && recentPosts.length > 0) {
        pastThemesCount = recentPosts.length;
        const summaries = recentPosts.map((p, idx) => {
          const shortCaption = (p.caption || "").slice(0, 140).replace(/\n+/g, " ");
          const shortPrompt = (p.image_prompt || "").slice(0, 100).replace(/\n+/g, " ");
          return `Past Post #${idx + 1}: Caption preview: "${shortCaption}..." | Image prompt preview: "${shortPrompt}..."`;
        });
        recentPostsContext = `
RECENT POSTS ALREADY CREATED FOR ${jyotirlinga.name.toUpperCase()} (DO NOT REPEAT THESE ANGLES, HOOKS, OR VISUALS):
${summaries.join("\n")}
`;
      }
    } catch (e) {
      console.warn("Could not fetch recent posts history for concept diversity:", e);
    }

    const archetypes = [
      "Puranic mythology and ancient legends (Soma/Chandra cosmic boon, Jyotir-linga light manifestation)",
      "Sacred geography & natural atmosphere (shoreline waves, mountain mist, holy river confluence, dense forests)",
      "Dawn darshan (Brahma Muhurta, golden sunrise illumination, morning temple bells, waking sanctum)",
      "Evening Sandhya aarti (Deeparadhana, twilight sanctum, rhythmic chants, glowing brass lamps)",
      "Ancient temple architecture & stone carvings (Nagara/Dravidian shikhara, sanctum pillared mandapams, timeless masonry)",
      "Jyotirlinga metaphysical symbolism (infinite cosmic pillar of light, transcendence of ego, stillness of consciousness)",
      "Devotee inner journey & emotional surrender (tears of devotion, peaceful silence after pilgrimage, profound grace)",
      "Sacred Vedic rituals & offerings (Bilva leaves, holy ash/Bhasma, Panchamrit abhisheka, continuous chanting)",
      "Historical resilience & eternal sanctity (unbroken spiritual heartbeat through millennia)",
      "Sanctum perspective & sacred symbols (divine Nandi facing lingam, Trishul, Damru, sacred serpent)",
      "Festival atmosphere & celebrations (Maha Shivaratri night vigil, Shravan Maas devotion, joyous pilgrim processions)",
      "Night illumination & celestial stars over the sacred temple shikhara",
    ];
    const suggestedTheme = archetypes[pastThemesCount % archetypes.length];

    console.log("[DRAFT DEBUG 6] Gemini request started");

    const { caption, imagePrompt } = await generateDraftContent(
      jyotirlinga.name,
      jyotirlinga.location,
      suggestedTheme,
      recentPostsContext,
    );

    console.log("[DRAFT DEBUG 8] JSON extracted successfully");

    // 2. Image generation / resolution
    let publicImageUrl = "";
    console.log("[DRAFT DEBUG 9] Resolving / generating image asset");

    try {
      // Attempt active image generation with Gemini image models
      publicImageUrl = await generateImageForPrompt(imagePrompt, slug);
      console.log("[DRAFT DEBUG 9a] Generated new AI image asset:", publicImageUrl);
    } catch (imgGenErr) {
      console.warn(
        "Direct AI image generation failed during draft creation (falling back to canonical shrine image):",
        imgGenErr instanceof Error ? imgGenErr.message : imgGenErr,
      );
      // Fallback to canonical shrine asset so the draft is NEVER lost and ALWAYS has a working image preview
      publicImageUrl = resolveCanonicalImageUrl(jyotirlinga.image || slug);
      console.log("[DRAFT DEBUG 9b] Using canonical shrine image asset fallback:", publicImageUrl);
    }

    // 3. Database Insertion
    console.log("[DRAFT DEBUG 10] Supabase insert started");
    const { data, error } = await supabase
      .from("social_posts")
      .insert({
        jyotirlinga_slug: slug,
        status: "pending_approval",
        caption: caption,
        image_prompt: imagePrompt,
        image_url: publicImageUrl || null,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("[DRAFT DEBUG 10 ERROR] Failed to save social post draft to Supabase:", error);
      throw new Error("Failed to save draft to database: " + (error?.message || "unknown error"));
    }

    console.log("[DRAFT DEBUG 11] Supabase insert succeeded. New Draft ID:", data.id);
    console.log("[DRAFT DEBUG 12] Draft returned to client");

    return data as SocialPost;
  });

export const regenerateSocialPostImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data: payload }) => {
    if (!payload.id || typeof payload.id !== "string") {
      throw new Error("Social post ID is required.");
    }

    const supabase = adminClient();
    const { data: post, error: fetchErr } = await supabase
      .from("social_posts")
      .select("*")
      .eq("id", payload.id)
      .single();

    if (fetchErr || !post) {
      throw new Error("Social post not found.");
    }

    if (post.status === "published") {
      throw new Error("Published posts cannot have their images modified.");
    }

    const prompt = (post.image_prompt || "").trim();
    if (!prompt) {
      throw new Error("Cannot generate image: this draft has no image prompt.");
    }

    // Generate new image
    const newImageUrl = await generateImageForPrompt(prompt, post.jyotirlinga_slug);

    const { data, error } = await supabase
      .from("social_posts")
      .update({
        image_url: newImageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.id)
      .select()
      .single();

    if (error || !data) {
      throw new Error("Failed to update post with new image.");
    }

    return data as SocialPost;
  });

export const updateSocialPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; caption: string; image_prompt: string }) => d)
  .handler(async ({ data: payload }) => {
    console.log("[EDIT DEBUG 5] Server function entered");
    if (!payload.id || typeof payload.id !== "string") {
      throw new Error("Social post ID is required.");
    }

    if (
      !payload.caption ||
      typeof payload.caption !== "string" ||
      payload.caption.trim().length === 0
    ) {
      throw new Error("Caption cannot be empty.");
    }

    if (
      !payload.image_prompt ||
      typeof payload.image_prompt !== "string" ||
      payload.image_prompt.trim().length === 0
    ) {
      throw new Error("Image prompt cannot be empty.");
    }

    console.log("[EDIT DEBUG 6] Authentication passed");
    const supabase = adminClient();

    // 1. Fetch current post to verify status and original prompt
    const { data: currentPost, error: fetchErr } = await supabase
      .from("social_posts")
      .select("*")
      .eq("id", payload.id)
      .single();

    if (fetchErr || !currentPost) {
      throw new Error("Social post not found.");
    }

    console.log("[EDIT DEBUG 7] Existing post fetched", {
      id: currentPost.id,
      slug: currentPost.jyotirlinga_slug,
      status: currentPost.status,
    });

    if (currentPost.status === "published") {
      throw new Error("Published posts cannot be edited.");
    }

    const trimmedNewCaption = payload.caption.trim();
    const trimmedNewPrompt = payload.image_prompt.trim();
    const originalPrompt = (currentPost.image_prompt || "").trim();
    const originalImageUrl = currentPost.image_url;

    const isPromptChanged = originalPrompt !== trimmedNewPrompt;
    console.log("[EDIT DEBUG 8] Existing image prompt compared", {
      isPromptChanged,
      originalPromptLength: originalPrompt.length,
      newPromptLength: trimmedNewPrompt.length,
    });
    console.log("[EDIT DEBUG 9] Image regeneration required:", isPromptChanged);

    // =========================================================================
    // STEP A — SAVE THE EDIT FIRST (PERSIST CONTENT INDEPENDENTLY OF IMAGE GEN)
    // =========================================================================
    // If post was approved, reset to pending_approval for editorial review.
    // If it was already pending_approval, it remains pending_approval.
    const updatedStatus = "pending_approval";

    console.log("[EDIT DEBUG 13] Supabase UPDATE started");
    const { data: updatedPost, error: updateErr } = await supabase
      .from("social_posts")
      .update({
        caption: trimmedNewCaption,
        image_prompt: trimmedNewPrompt,
        status: updatedStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.id)
      .select()
      .single();

    if (updateErr || !updatedPost) {
      console.error("[EDIT DEBUG 13 ERROR] Failed to update social post in Supabase:", updateErr);
      throw new Error("Failed to save draft changes: " + (updateErr?.message || "unknown error"));
    }

    console.log("[EDIT DEBUG 14] Supabase UPDATE succeeded", {
      id: updatedPost.id,
      status: updatedPost.status,
      captionLength: updatedPost.caption?.length,
      promptLength: updatedPost.image_prompt?.length,
    });

    // =========================================================================
    // STEP B — GENERATE NEW IMAGE IF PROMPT CHANGED
    // =========================================================================
    let newGeneratedImageUrl: string | null = null;
    let imageGenError: string | null = null;

    if (isPromptChanged) {
      console.log("[EDIT DEBUG 10] Image generation started");
      try {
        newGeneratedImageUrl = await generateImageForPrompt(
          trimmedNewPrompt,
          currentPost.jyotirlinga_slug,
        );
        console.log("[EDIT DEBUG 11] Image generation returned");
        console.log("[EDIT DEBUG 12] Canonical image URL resolved:", newGeneratedImageUrl);

        // Update post with the new image URL immediately as candidate / default
        if (newGeneratedImageUrl) {
          await supabase
            .from("social_posts")
            .update({
              image_url: newGeneratedImageUrl,
              updated_at: new Date().toISOString(),
            })
            .eq("id", payload.id);
        }
      } catch (genErr: unknown) {
        imageGenError = genErr instanceof Error ? genErr.message : String(genErr);
        console.warn(
          "[EDIT DEBUG 11 WARNING] Image generation did not complete (text edits remain safely saved):",
          imageGenError,
        );
      }
    }

    // Refetch final authoritative state of the row
    const { data: finalPost } = await supabase
      .from("social_posts")
      .select("*")
      .eq("id", payload.id)
      .single();

    console.log("[EDIT DEBUG 15] Updated row returned to client");

    return {
      post: (finalPost || updatedPost) as SocialPost,
      originalImageUrl: originalImageUrl,
      newImageUrl: newGeneratedImageUrl,
      imagePromptChanged: isPromptChanged,
      imageGenerationSuccess: isPromptChanged ? Boolean(newGeneratedImageUrl) : true,
      imageGenerationError: imageGenError,
    };
  });

export const setSocialPostImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; image_url: string }) => d)
  .handler(async ({ data: payload }) => {
    if (!payload.id || !payload.image_url) {
      throw new Error("Post ID and image URL are required.");
    }

    const supabase = adminClient();
    const { data: post, error: fetchErr } = await supabase
      .from("social_posts")
      .select("*")
      .eq("id", payload.id)
      .single();

    if (fetchErr || !post) {
      throw new Error("Social post not found.");
    }

    if (post.status === "published") {
      throw new Error("Published posts cannot have their image altered.");
    }

    const { data, error } = await supabase
      .from("social_posts")
      .update({
        image_url: payload.image_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(
        "Failed to set active image for post: " + (error?.message || "unknown error"),
      );
    }

    return data as SocialPost;
  });

export const approveSocialPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: string) => d)
  .handler(async ({ data: id }) => {
    const supabase = adminClient();
    const { data, error } = await supabase
      .from("social_posts")
      .update({
        status: "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Failed to approve social post:", error);
      throw new Error("Failed to approve post.");
    }

    return data as SocialPost;
  });

export const uploadSocialMediaFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { fileName: string; fileType: string; base64Data: string }) => d)
  .handler(async ({ data: payload }) => {
    ensureServerEnv();
    const supabase = adminClient();

    // 1. Ensure 'social-media' bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === "social-media");
    if (!exists) {
      const { error: bucketError } = await supabase.storage.createBucket("social-media", {
        public: true,
        fileSizeLimit: 104857600, // 100MB
      });
      if (bucketError) {
        console.warn("Notice: Storage bucket creation response:", bucketError.message);
      }
    }

    // 2. Prepare collision-safe filename
    const extMatch = payload.fileName.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : "bin";
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
    const storagePath = `uploads/${uniqueName}`;

    // 3. Convert base64 to Buffer
    const buffer = Buffer.from(payload.base64Data, "base64");

    // 4. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("social-media")
      .upload(storagePath, buffer, {
        contentType: payload.fileType || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      console.error("Failed to upload media to Supabase Storage:", uploadError);
      throw new Error("Upload to storage failed: " + uploadError.message);
    }

    // 5. Generate public URL
    const { data: pubData } = supabase.storage.from("social-media").getPublicUrl(storagePath);
    const publicUrl = pubData.publicUrl;

    return {
      storagePath,
      publicUrl,
    };
  });

export const createUploadedSocialPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      jyotirlinga_slug?: string;
      post_type: "image" | "carousel" | "reel";
      caption: string;
      media: Array<{
        storage_path: string;
        public_url: string;
        media_type: "image" | "video";
        sort_order: number;
      }>;
    }) => d,
  )
  .handler(async ({ data: payload }) => {
    console.log("[SAVE DEBUG 2] Media count:", payload.media?.length);
    console.log(
      "[SAVE DEBUG 3] Media URLs:",
      payload.media?.map((m) => m.public_url),
    );
    console.log("[SAVE DEBUG 4] Caption received:", payload.caption?.slice(0, 50));
    console.log("[SAVE DEBUG 5] Post type:", payload.post_type);

    ensureServerEnv();
    const supabase = adminClient();

    if (!payload.caption || !payload.caption.trim()) {
      throw new Error("Caption is required.");
    }
    if (!payload.media || payload.media.length === 0) {
      throw new Error("At least one media item is required.");
    }

    // Storage verification
    for (const item of payload.media) {
      if (!item.public_url || !item.public_url.startsWith("https://")) {
        throw new Error("Invalid media upload: public_url must be a valid public HTTPS URL.");
      }
    }

    const firstMediaUrl = payload.media[0].public_url;
    const requestedPostType = payload.post_type || "image";
    const slug = payload.jyotirlinga_slug || "general";

    console.log("[SAVE DEBUG 6] Starting social_posts insert");

    // 1. Primary insert into social_posts
    const { data: postRecord, error: postErr } = await supabase
      .from("social_posts")
      .insert({
        jyotirlinga_slug: slug,
        post_type: requestedPostType,
        caption: payload.caption.trim(),
        image_url: firstMediaUrl,
        image_prompt: null,
        status: "pending_approval",
      })
      .select()
      .single();

    if (postErr || !postRecord) {
      console.error("[SAVE DEBUG ERROR] social_posts insert failed:", postErr);
      throw new Error("Failed to create social post: " + (postErr?.message || "database error"));
    }

    console.log("[SAVE DEBUG 7] social_posts insert succeeded. ID:", postRecord.id);

    // 2. Insert child media rows into social_post_media
    console.log("[SAVE DEBUG 8] social_post_media insert started");
    const mediaRows = payload.media.map((m, idx) => ({
      social_post_id: postRecord.id,
      storage_path: m.storage_path || m.public_url,
      public_url: m.public_url,
      media_type: m.media_type || (requestedPostType === "reel" ? "video" : "image"),
      sort_order: m.sort_order ?? idx,
    }));

    const { error: mediaErr } = await supabase.from("social_post_media").insert(mediaRows);
    if (mediaErr) {
      console.error("[SAVE DEBUG WARNING] social_post_media insert failed:", mediaErr.message);
    } else {
      console.log("[SAVE DEBUG 9] social_post_media insert succeeded");
    }

    console.log("[SAVE DEBUG 10] Save completed");

    return {
      ...postRecord,
      post_type: postRecord.post_type || requestedPostType,
      media: payload.media,
    } as SocialPost;
  });

export const updateUploadedSocialPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id: string;
      caption: string;
      media: Array<{
        id?: string;
        storage_path: string;
        public_url: string;
        media_type: "image" | "video";
        sort_order: number;
      }>;
    }) => d,
  )
  .handler(async ({ data: payload }) => {
    ensureServerEnv();
    const supabase = adminClient();

    const { data: existingPost } = await supabase
      .from("social_posts")
      .select("*")
      .eq("id", payload.id)
      .single();

    if (!existingPost) throw new Error("Post not found.");
    if (existingPost.status === "published") {
      throw new Error("Published posts cannot be edited.");
    }

    const firstMediaUrl = payload.media[0]?.public_url || existingPost.image_url;

    // Any modification to an approved post resets status to pending_approval
    const { data: updatedPost, error: updateErr } = await supabase
      .from("social_posts")
      .update({
        caption: payload.caption.trim(),
        image_url: firstMediaUrl,
        status: "pending_approval",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.id)
      .select()
      .single();

    if (updateErr) throw new Error("Failed to update post: " + updateErr.message);

    // Sync child media records
    try {
      await supabase.from("social_post_media").delete().eq("social_post_id", payload.id);
      const mediaRows = payload.media.map((m, idx) => ({
        social_post_id: payload.id,
        storage_path: m.storage_path,
        public_url: m.public_url,
        media_type: m.media_type,
        sort_order: m.sort_order ?? idx,
      }));
      await supabase.from("social_post_media").insert(mediaRows);
    } catch (e) {
      console.warn("Notice syncing social_post_media child rows:", e);
    }

    return updatedPost as SocialPost;
  });

export const generateAICaptionAssistance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: { action: "suggest" | "improve" | "hashtags"; caption?: string; shrineSlug?: string }) => d,
  )
  .handler(async ({ data: payload }) => {
    ensureServerEnv();

    const shrine = payload.shrineSlug ? getJyotirlinga(payload.shrineSlug) : null;
    const resultText = await generateCaptionAssistance(
      payload.action,
      payload.caption,
      shrine?.name,
    );

    return {
      result: resultText,
    };
  });

export const publishSocialPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: string) => d)
  .handler(async ({ data: id }) => {
    console.log("[SOCIAL DEBUG 3] Server function entered", { postId: id });
    console.log("[SOCIAL DEBUG 4] Authentication passed");

    try {
      if (!id || typeof id !== "string") {
        throw new Error("Invalid social post ID.");
      }

      const supabase = adminClient();

      // 1. Fetch post from database
      const { data: post, error: fetchError } = await supabase
        .from("social_posts")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !post) {
        console.error("Failed to fetch social post for publishing:", fetchError);
        throw new Error("Social post not found.");
      }

      console.log("[SOCIAL DEBUG 5] Post fetched", {
        id: post?.id,
        status: post?.status,
        postType: post?.post_type,
        imageUrl: post?.image_url,
      });

      // 2. Validate post state
      if (post.status !== "approved") {
        throw new Error("Post must be in 'approved' status before publishing.");
      }

      if (post.instagram_media_id) {
        throw new Error("Post has already been published to Instagram.");
      }

      if (!post.caption || post.caption.trim().length === 0) {
        throw new Error("Post does not have a valid caption to publish.");
      }

      // Fetch child media records
      let childMedia: SocialPostMedia[] = [];
      try {
        const { data: mediaData } = await supabase
          .from("social_post_media")
          .select("*")
          .eq("social_post_id", id)
          .order("sort_order", { ascending: true });
        if (mediaData) childMedia = mediaData as SocialPostMedia[];
      } catch {
        // Child table might not exist if single image legacy post
      }

      const postType = post.post_type || (childMedia.length > 1 ? "carousel" : "image");
      let containerId = "";

      // 3. Media Type Publishing Routing
      if (postType === "carousel" && childMedia.length >= 2) {
        // =====================================================================
        // CAROUSEL PUBLISHING FLOW
        // =====================================================================
        console.log(`[PUBLISH DEBUG] Starting Carousel flow with ${childMedia.length} child items`);
        const childContainerIds: string[] = [];

        for (const item of childMedia) {
          const pubUrl = item.public_url;
          console.log(`[PUBLISH DEBUG] Creating carousel child container for: ${pubUrl}`);
          const res = await createInstagramCarouselItemContainer(pubUrl, item.media_type);
          childContainerIds.push(res.containerId);
        }

        // Wait for all child containers to finish processing
        for (const cId of childContainerIds) {
          await waitForInstagramMediaReady(cId, 60000, 3000);
        }

        // Create parent carousel container
        console.log(
          `[PUBLISH DEBUG] Creating parent carousel container with children:`,
          childContainerIds,
        );
        const parentRes = await createInstagramCarouselContainer(childContainerIds, post.caption);
        containerId = parentRes.containerId;
        await waitForInstagramMediaReady(containerId, 60000, 3000);
      } else if (
        postType === "reel" ||
        (childMedia.length === 1 && childMedia[0].media_type === "video")
      ) {
        // =====================================================================
        // REEL / VIDEO PUBLISHING FLOW
        // =====================================================================
        const videoUrl = childMedia[0]?.public_url || post.image_url;
        if (!videoUrl) throw new Error("Video URL missing for Reel post.");

        console.log(`[PUBLISH DEBUG] Creating Reel container for: ${videoUrl}`);
        const reelRes = await createInstagramReelContainer(videoUrl, post.caption);
        containerId = reelRes.containerId;

        // Wait up to 120s for video rendering
        await waitForInstagramMediaReady(containerId, 120000, 4000);
      } else {
        // =====================================================================
        // SINGLE IMAGE PUBLISHING FLOW (LEGACY + NEW SINGLE IMAGE)
        // =====================================================================
        const rawImageUrl = childMedia[0]?.public_url || post.image_url || "";
        const canonicalUrl = resolveCanonicalImageUrl(rawImageUrl);

        if (!canonicalUrl || !canonicalUrl.startsWith("https://")) {
          throw new Error("Valid public HTTPS image URL required for publishing.");
        }

        // Pre-flight check
        try {
          const headRes = await fetch(canonicalUrl, { method: "HEAD" });
          if (!headRes.ok) {
            console.warn(`Notice: Image HEAD request returned status ${headRes.status}`);
          }
        } catch (verifyErr) {
          console.warn("Pre-flight HEAD check notice:", verifyErr);
        }

        console.log(`[PUBLISH DEBUG] Creating Single Image container for: ${canonicalUrl}`);
        const containerResult = await createInstagramMediaContainer(canonicalUrl, post.caption);
        containerId = containerResult.containerId;
        await waitForInstagramMediaReady(containerId, 60000, 3000);
      }

      // 4. Publish Container to Instagram
      console.log("[SOCIAL DEBUG 8] Publishing container to Instagram", {
        creationId: containerId,
      });
      const publishResult = await publishInstagramMedia(containerId);
      const mediaId = publishResult.mediaId;

      if (!mediaId) {
        throw new Error("Instagram API returned success but did not provide a media ID.");
      }

      console.log("[SOCIAL DEBUG 9] Instagram media published with ID:", mediaId);

      // 5. Update Database Record to 'published'
      const now = new Date().toISOString();
      const { data: updatedPost, error: updateError } = await supabase
        .from("social_posts")
        .update({
          status: "published",
          instagram_media_id: mediaId,
          published_at: now,
          updated_at: now,
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        console.error(
          "Critical: Published to Instagram but failed to update database:",
          updateError,
        );
        throw new Error("Post was published to Instagram, but updating database state failed.");
      }

      return updatedPost as SocialPost;
    } catch (error) {
      console.error("[SOCIAL DEBUG SERVER ERROR]", error);
      throw error;
    }
  });
