import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = JSON.parse(fs.readFileSync("/app/.dev.env.json", "utf8"));

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function run() {
  const jyotirlinga = { name: "Somnath", location: "Gujarat" };
  const systemInstruction = "You are a helpful assistant.";

  try {
    console.log("Sending request to Gemini...");
    const response = await ai.interactions.create({
      model: "gemini-3.5-flash-lite",
      input: `Generate an Instagram post for ${jyotirlinga.name} Jyotirlinga.`,
      system_instruction: systemInstruction,
      response_format: {
        type: Type.OBJECT,
        properties: {
          caption: { type: Type.STRING },
          imagePrompt: { type: Type.STRING },
        },
        required: ["caption", "imagePrompt"],
      },
    });

    console.log("Gemini response output_text:", response.output_text);
    const parsed = JSON.parse(response.output_text || "{}");
    console.log("Parsed JSON:", parsed);

    console.log("Inserting into Supabase...");
    const { data, error } = await supabase
      .from("social_posts")
      .insert({
        jyotirlinga_slug: "somnath",
        status: "pending_approval",
        caption: parsed.caption || "Draft caption",
        image_prompt: parsed.imagePrompt || "Draft image prompt",
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
    } else {
      console.log("Supabase insert success:", data.id);
    }
  } catch (error) {
    console.error("Error generating Instagram draft:", error);
  }
}

run();
