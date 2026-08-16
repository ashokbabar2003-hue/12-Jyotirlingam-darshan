import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = JSON.parse(fs.readFileSync("/app/.dev.env.json", "utf8"));
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function run() {
  console.log("Checking Supabase connection and social_posts table...");
  const { data, error } = await supabase.from("social_posts").select("*").limit(1);
  if (error) {
    console.error("Database Error:", error.message, error.code);
  } else {
    console.log("Database connection successful. Table exists.");
    console.log("Current row count:", data.length);
  }
}
run();
