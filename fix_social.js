const fs = require("fs");
let code = fs.readFileSync("src/lib/social.functions.ts", "utf8");

// Fix getSocialPosts
code = code.replace(
  'export const getSocialPosts = createServerFn("GET", async () => {',
  'export const getSocialPosts = createServerFn({ method: "GET" }).handler(async () => {',
);

// Fix draftSocialPost
code = code.replace(
  'export const draftSocialPost = createServerFn("POST", async (slug: string) => {',
  'export const draftSocialPost = createServerFn({ method: "POST" })\n  .validator((d: string) => d)\n  .handler(async ({ data: slug }) => {',
);
// Wait, react-start validator is typically `.validator(...)` or `.inputValidator(...)` depending on version.
// Let's check darshan.functions.ts to see what it uses.
