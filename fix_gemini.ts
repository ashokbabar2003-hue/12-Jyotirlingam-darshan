import fs from "fs";

const file = "src/lib/gemini.server.ts";
let content = fs.readFileSync(file, "utf-8");

const startStr = "export async function generateDraftContent(";
const endStr = "  });\n}";

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr, startIndex) + endStr.length;

const newCode = `export async function generateDraftContent(
  shrineName: string,
  shrineLocation: string,
  suggestedTheme: string,
  recentPostsContext?: string,
): Promise<{ 
  shrineSlug: string; 
  shrineName: string; 
  location: string; 
  contentArchetype: string; 
  concept: string; 
  caption: string; 
  imagePrompt: string 
}> {
  const systemInstruction = \`
You are an expert Hindu spiritual social media manager and creative director for the sacred 12 Jyotirlingas.
Your task is to write a fresh, unique, and deeply devotional Instagram caption and image prompt for \${shrineName} Jyotirlinga in \${shrineLocation}.

SUGGESTED CREATIVE THEME FOCUS FOR THIS DRAFT:
"\${suggestedTheme}"

\${recentPostsContext || ""}

CREATIVE DIVERSITY GUIDELINES:
1. Provide a GENUINELY DIFFERENT concept from past posts for this shrine.
2. Start with a captivating, distinct opening hook.
3. Write with spiritual warmth, reverence, and philosophical depth.
4. Conclude with a prayer invocation and 8-10 relevant hashtags.
5. Image prompt must describe a photorealistic, hyper-detailed, spiritual scene depicting \${shrineName} in \${shrineLocation}.
6. The image prompt MUST NOT be a generic temple description. It MUST include geographically and architecturally accurate features for \${shrineName}.
  \`;

  const prompt = \`Generate a distinct devotional Instagram post for \${shrineName} Jyotirlinga exploring theme: \${suggestedTheme}.\`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      shrineSlug: { type: Type.STRING },
      shrineName: { type: Type.STRING },
      location: { type: Type.STRING },
      contentArchetype: { type: Type.STRING },
      concept: { type: Type.STRING },
      caption: {
        type: Type.STRING,
        description: "Full formatted Instagram caption with hashtags",
      },
      imagePrompt: {
        type: Type.STRING,
        description: "Detailed photographic and spiritual image prompt with geographically and architecturally accurate features",
      },
    },
    required: ["shrineSlug", "shrineName", "location", "contentArchetype", "concept", "caption", "imagePrompt"],
  };

  return generateStructuredOutput<{ 
    shrineSlug: string; 
    shrineName: string; 
    location: string; 
    contentArchetype: string; 
    concept: string; 
    caption: string; 
    imagePrompt: string 
  }>(
    prompt,
    schema,
    systemInstruction,
    "gemini-3.1-pro", // use a good text model
  );
}`;

content = content.substring(0, startIndex) + newCode + content.substring(endIndex);
fs.writeFileSync(file, content);
console.log("Updated gemini.server.ts");
