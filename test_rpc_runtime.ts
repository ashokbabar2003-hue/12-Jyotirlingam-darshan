import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI, Type } from "@google/genai";

const env = JSON.parse(fs.readFileSync("/app/.dev.env.json", "utf8"));
const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = env.SUPABASE_PUBLISHABLE_KEY;
const GEMINI_API_KEY = env.GEMINI_API_KEY;

console.log("1. GEMINI_API_KEY exists:", !!GEMINI_API_KEY);
console.log("2. SUPABASE_URL exists:", !!SUPABASE_URL);

// Let's test calling the server function or simulating its exact logic
import { draftSocialPost } from "./src/lib/social.functions.ts";
console.log("draftSocialPost imported successfully:", typeof draftSocialPost);
