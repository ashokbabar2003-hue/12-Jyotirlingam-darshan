import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI, Type } from "@google/genai";

const env = JSON.parse(fs.readFileSync("/app/.dev.env.json", "utf8"));
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

async function traceLive() {
  const selectedSlug = "mallikarjuna";
  console.log("1. selectedSlug from Admin UI:", selectedSlug);

  const shrineName = "Mallikarjuna";
  const location = "Srisailam, Andhra Pradesh";
  const description =
    "Mallikarjuna Jyotirlinga is situated on Shri Shaila mountain on the banks of Krishna river.";
  const significance = "One of the twelve Jyotirlingas, revered as Kailash of the South.";

  const systemInstruction = `
    You are an expert Hindu spiritual social media manager and content creator.
    Your task is to write a highly engaging, respectful, and deeply devotional Instagram caption for the ${shrineName} Jyotirlinga, located in ${location}.
    
    Guidelines:
    1. The tone should be deeply devotional, peaceful, and inspiring.
    2. Include 1-2 interesting facts or mythological context about this specific Jyotirlinga.
    3. Start with a hook (e.g., an invocation like "Om Namah Shivaya 🔱").
    4. Keep paragraphs short for readability on mobile.
    5. End with a call to action (e.g., "Type 'Har Har Mahadev' if you wish to visit!").
    6. Include exactly 8-10 relevant hashtags.
    
    You must also provide an AI Image Generation prompt. The image prompt should:
    1. Describe a photorealistic, hyper-detailed, spiritual, and cinematic scene related to ${shrineName}.
    2. Focus on the temple, the Shiva Lingam, or a divine aesthetic.
    3. Do NOT include text in the image prompt description.
  `;

  const prompt = `Generate an Instagram post for ${shrineName} Jyotirlinga.`;
  console.log("3. exact Gemini prompt sent:", prompt);
  const modelName = "gemini-3.5-flash-lite";
  console.log("4. exact Gemini model:", modelName);

  const response = await ai.interactions.create({
    model: modelName,
    input: prompt,
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

  const outputText = response.output_text;
  console.log("5. exact Gemini output_text returned:", outputText);

  const parsed = JSON.parse(outputText);
  console.log("6. exact JSON parsed from output_text:", parsed);

  const captionVar = parsed.caption;
  const imagePromptVar = parsed.imagePrompt;
  console.log("7. exact caption variable:", captionVar);
  console.log("8. exact image_prompt variable:", imagePromptVar);

  const insertPayload = {
    jyotirlinga_slug: selectedSlug,
    status: "pending_approval",
    caption: captionVar,
    image_prompt: imagePromptVar,
  };
  console.log("9. exact object passed to insert:", insertPayload);

  const { data: insertData, error: insertError } = await supabase
    .from("social_posts")
    .insert(insertPayload)
    .select()
    .single();

  console.log("10. exact INSERT response:", {
    returned_id: insertData?.id,
    returned_jyotirlinga_slug: insertData?.jyotirlinga_slug,
    returned_caption: insertData?.caption,
    returned_image_prompt: insertData?.image_prompt,
    returned_status: insertData?.status,
    error: insertError,
  });

  if (insertData?.id) {
    const { data: selectData, error: selectError } = await supabase
      .from("social_posts")
      .select("*")
      .eq("id", insertData.id)
      .single();

    console.log("11. immediate SELECT for UUID:", {
      id: selectData?.id,
      jyotirlinga_slug: selectData?.jyotirlinga_slug,
      caption: selectData?.caption,
      image_prompt: selectData?.image_prompt,
      status: selectData?.status,
      error: selectError,
    });

    const identical =
      selectData?.caption === captionVar &&
      selectData?.image_prompt === imagePromptVar &&
      selectData?.jyotirlinga_slug === selectedSlug &&
      selectData?.status === "pending_approval";
    console.log("12. Values identical:", identical);
  }
}

traceLive();
