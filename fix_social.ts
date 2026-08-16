import fs from "fs";

const file = "src/lib/social.functions.ts";
let content = fs.readFileSync(file, "utf-8");

const startStr = "export const draftSocialPost = createServerFn({ method: \"POST\" })";
const endStr = "    return data as SocialPost;\n  });";

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr, startIndex) + endStr.length;

if (startIndex === -1 || endIndex < startIndex) {
  console.error("Could not find draftSocialPost bounds");
  process.exit(1);
}

const newCode = `export const draftSocialPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: string | { slug: string }) => {
    if (typeof d === "string") return d;
    if (d && typeof d === "object" && "slug" in d) return d.slug;
    return String(d || "");
  })
  .handler(async ({ data: rawSlug }) => {
    const requestedSlug =
      typeof rawSlug === "string"
        ? rawSlug.trim()
        : rawSlug && typeof rawSlug === "object" && "slug" in (rawSlug as Record<string, unknown>)
          ? String((rawSlug as Record<string, unknown>).slug).trim()
          : "";

    if (!requestedSlug) {
      throw new Error("Invalid Jyotirlinga slug.");
    }

    ensureServerEnv();
    const supabase = adminClient();

    let targetSlug = requestedSlug;
    
    // Determine random shrine if requested
    if (requestedSlug === "random") {
      const { data: allPosts } = await supabase
        .from("social_posts")
        .select("jyotirlinga_slug, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
        
      const counts: Record<string, number> = {};
      const allShrines = ["somnath", "mallikarjuna", "mahakaleshwar", "omkareshwar", "kedarnath", "bhimashankar", "kashi", "trimbakeshwar", "baidyanath", "nageshwar", "rameshwaram", "grishneshwar"];
      allShrines.forEach(s => counts[s] = 0);
      
      if (allPosts) {
        for (const p of allPosts) {
          if (p.jyotirlinga_slug && counts[p.jyotirlinga_slug] !== undefined) {
            counts[p.jyotirlinga_slug]++;
          }
        }
      }
      
      let minCount = Infinity;
      let underused: string[] = [];
      for (const s of allShrines) {
        if (counts[s] < minCount) {
          minCount = counts[s];
          underused = [s];
        } else if (counts[s] === minCount) {
          underused.push(s);
        }
      }
      
      targetSlug = underused[Math.floor(Math.random() * underused.length)];
    }

    const jyotirlinga = getJyotirlinga(targetSlug);
    if (!jyotirlinga) {
      throw new Error(\`Jyotirlinga with slug '\${targetSlug}' not found.\`);
    }

    // 1. Retrieve bounded history of recent posts for this Jyotirlinga to ensure concept diversity
    let recentPostsContext = "";
    let pastThemesCount = 0;
    try {
      const { data: recentPosts } = await supabase
        .from("social_posts")
        .select("caption, image_prompt, created_at")
        .eq("jyotirlinga_slug", targetSlug)
        .order("created_at", { ascending: false })
        .limit(10);

      if (recentPosts && recentPosts.length > 0) {
        pastThemesCount = recentPosts.length;
        const summaries = recentPosts.map((p, idx) => {
          const shortCaption = (p.caption || "").slice(0, 140).replace(/\\n+/g, " ");
          const shortPrompt = (p.image_prompt || "").slice(0, 100).replace(/\\n+/g, " ");
          return \`Past Post #\${idx + 1}: Caption preview: "\${shortCaption}..." | Image prompt preview: "\${shortPrompt}..."\`;
        });
        recentPostsContext = \`
RECENT POSTS ALREADY CREATED FOR \${jyotirlinga.name.toUpperCase()} (DO NOT REPEAT THESE ANGLES, HOOKS, OR VISUALS):
\${summaries.join("\\n")}
\`;
      }
    } catch (e) {
      console.warn("Could not fetch recent posts history for concept diversity:", e);
    }

    const archetypes = [
      "Temple architecture",
      "Sacred landscape",
      "River / water symbolism",
      "Sunrise / sunset",
      "Night divine illumination",
      "Pilgrimage journey",
      "Temple corridor",
      "Sanctum atmosphere",
      "Ancient stone details",
      "Nature surrounding the shrine",
      "Sacred objects / symbols",
      "Festival / seasonal atmosphere",
      "Monsoon atmosphere",
      "Himalayan / coastal / forest environment where geographically appropriate",
      "Historical / heritage context",
      "Devotee-perspective composition without requiring identifiable people",
      "Cinematic environmental storytelling",
      "Abstract spiritual light / cosmic symbolism"
    ];
    
    // Pick an archetype deterministically based on past count to cycle through them
    const suggestedTheme = archetypes[pastThemesCount % archetypes.length];

    console.log("[DRAFT DEBUG 6] Gemini request started");

    const draftData = await generateDraftContent(
      jyotirlinga.name,
      jyotirlinga.location,
      suggestedTheme,
      recentPostsContext,
    );

    console.log("[DRAFT DEBUG 8] JSON extracted successfully");

    // 2. Image generation / resolution
    let publicImageUrl = null;
    console.log("[DRAFT DEBUG 9] Resolving / generating image asset");

    try {
      // Attempt active image generation with Gemini image models
      publicImageUrl = await generateImageForPrompt(draftData.imagePrompt, targetSlug);
      console.log("[DRAFT DEBUG 9a] Generated new AI image asset:", publicImageUrl);
    } catch (imgGenErr) {
      console.warn(
        "Direct AI image generation failed during draft creation:",
        imgGenErr instanceof Error ? imgGenErr.message : imgGenErr,
      );
      // DO NOT fallback to canonical shrine asset here! If quota is exhausted, leave it null.
      publicImageUrl = null;
    }

    // 3. Database Insertion
    console.log("[DRAFT DEBUG 10] Supabase insert started");
    const { data, error } = await supabase
      .from("social_posts")
      .insert({
        jyotirlinga_slug: targetSlug,
        status: "pending_approval",
        caption: draftData.caption,
        image_prompt: draftData.imagePrompt,
        image_url: publicImageUrl,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Failed to save social post draft to Supabase:", error);
      throw new Error("Failed to save draft to database: " + (error?.message || "unknown error"));
    }

    return data as SocialPost;
  });`;

content = content.substring(0, startIndex) + newCode + content.substring(endIndex);
fs.writeFileSync(file, content);
console.log("Updated social.functions.ts");
