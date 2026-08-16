import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = JSON.parse(fs.readFileSync("/app/.dev.env.json", "utf8"));
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function run() {
  console.log("Supabase URL:", env.SUPABASE_URL);

  // Try inserting mallikarjuna
  const { data, error } = await supabase
    .from("social_posts")
    .insert({
      jyotirlinga_slug: "mallikarjuna",
      status: "pending_approval",
      caption: "Test Mallikarjuna caption",
      image_prompt: "Test Mallikarjuna image prompt",
    })
    .select()
    .single();

  if (error) {
    console.error("Insert error:", error);
  } else {
    console.log("Insert success, data:", data);
  }

  const { data: allRows, error: fetchError } = await supabase
    .from("social_posts")
    .select("id, jyotirlinga_slug, status, created_at")
    .order("created_at", { ascending: false });

  console.log("All rows count:", allRows?.length, allRows);
}

run();
