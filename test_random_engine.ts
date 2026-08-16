import { createClient } from "@supabase/supabase-js";
import { generateDraftContent, ensureServerEnv } from "./src/lib/gemini.server.js";
import { generateImageForPrompt } from "./src/lib/image-generator.server.js";
import { getJyotirlinga } from "./src/data/jyotirlingas.js";

ensureServerEnv();

function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase credentials");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function run() {
  console.log("Starting Read-Only Acceptance Test for Random Shrine + New Concept Engine (12 iterations)...\n");
  const supabase = getAdminClient();
  const createdIds: string[] = [];
  const results = [];

  const allShrines = [
    "somnath", "mallikarjuna", "mahakaleshwar", "omkareshwar", 
    "kedarnath", "bhimashankar", "kashi", "trimbakeshwar", 
    "baidyanath", "nageshwar", "rameshwaram", "grishneshwar"
  ];

  try {
    for (let i = 1; i <= 12; i++) {
      // 1. Determine random underused shrine
      const { data: allPosts } = await supabase
        .from("social_posts")
        .select("jyotirlinga_slug, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
        
      const counts: Record<string, number> = {};
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
      
      const targetSlug = underused[Math.floor(Math.random() * underused.length)];
      const jyotirlinga = getJyotirlinga(targetSlug);
      if (!jyotirlinga) throw new Error("Jyotirlinga not found: " + targetSlug);

      console.log(`[Iteration ${i}] Selected: ${jyotirlinga.name} (Past Count: ${counts[targetSlug]})`);

      // 2. Build Concept Diversity Context
      let recentPostsContext = "";
      let pastThemesCount = 0;
      const { data: recentPosts } = await supabase
        .from("social_posts")
        .select("caption, image_prompt, created_at")
        .eq("jyotirlinga_slug", targetSlug)
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

      const archetypes = [
        "Temple architecture", "Sacred landscape", "River / water symbolism",
        "Sunrise / sunset", "Night divine illumination", "Pilgrimage journey",
        "Temple corridor", "Sanctum atmosphere", "Ancient stone details",
        "Nature surrounding the shrine", "Sacred objects / symbols",
        "Festival / seasonal atmosphere", "Monsoon atmosphere",
        "Himalayan / coastal / forest environment where geographically appropriate",
        "Historical / heritage context", "Devotee-perspective composition without requiring identifiable people",
        "Cinematic environmental storytelling", "Abstract spiritual light / cosmic symbolism"
      ];
      
      const suggestedTheme = archetypes[pastThemesCount % archetypes.length];

      // 3. Generate Draft
      console.log(`[Iteration ${i}] Generating AI Draft for theme: ${suggestedTheme}...`);
      const draftData = await generateDraftContent(
        jyotirlinga.name,
        jyotirlinga.location,
        suggestedTheme,
        recentPostsContext,
      );

      // 4. Test Image Generation Quota
      let publicImageUrl = null;
      try {
        publicImageUrl = await generateImageForPrompt(draftData.imagePrompt, targetSlug);
      } catch (imgGenErr) {
        // Expected to fail with quota 0
        publicImageUrl = null;
      }

      // 5. Insert to DB to track history
      const { data: inserted, error } = await supabase
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

      if (error || !inserted) throw new Error("Insert failed");
      createdIds.push(inserted.id);

      results.push({
        iteration: i,
        shrine: jyotirlinga.name,
        archetype: draftData.contentArchetype,
        concept: draftData.concept,
        imagePrompt: draftData.imagePrompt,
        imageUrl: inserted.image_url,
      });
    }

    // Output Table
    console.log("\n=======================================================");
    console.log("            ACCEPTANCE TEST RESULTS TABLE               ");
    console.log("=======================================================\n");
    console.log("| Iteration | Jyotirlinga | Content Archetype | Concept | Image URL | Image Prompt |");
    console.log("|---|---|---|---|---|---|");
    for (const r of results) {
      console.log(`| ${r.iteration} | **${r.shrine}** | ${r.archetype} | ${r.concept} | \`${r.imageUrl}\` | ${r.imagePrompt.replace(/\n/g, " ")} |`);
    }
    console.log("\n=======================================================\n");

  } catch (e) {
    console.error("Test Error:", e);
  } finally {
    // 6. Clean up
    console.log("Cleaning up test artifacts from database...");
    if (createdIds.length > 0) {
      await supabase.from("social_posts").delete().in("id", createdIds);
    }
    console.log("Cleanup complete.");
  }
}

run();
