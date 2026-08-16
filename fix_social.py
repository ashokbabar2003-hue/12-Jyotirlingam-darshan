import re

with open("src/lib/social.functions.ts", "r") as f:
    content = f.read()

# 1. getSocialPosts
content = content.replace(
    'export const getSocialPosts = createServerFn("GET", async () => {',
    'export const getSocialPosts = createServerFn({ method: "GET" }).handler(async () => {'
)

# 2. draftSocialPost
content = content.replace(
    'export const draftSocialPost = createServerFn("POST", async (slug: string) => {',
    'export const draftSocialPost = createServerFn({ method: "POST" })\n  .inputValidator((d: string) => d)\n  .handler(async ({ data: slug }) => {'
)

# 3. updateSocialPost
content = content.replace(
    'export const updateSocialPost = createServerFn("POST", async (payload: {\n  id: string;\n  caption?: string;\n  image_url?: string;\n}) => {',
    'export const updateSocialPost = createServerFn({ method: "POST" })\n  .inputValidator((d: { id: string; caption?: string; image_url?: string }) => d)\n  .handler(async ({ data: payload }) => {'
)

# 4. approveSocialPost
content = content.replace(
    'export const approveSocialPost = createServerFn("POST", async (id: string) => {',
    'export const approveSocialPost = createServerFn({ method: "POST" })\n  .inputValidator((d: string) => d)\n  .handler(async ({ data: id }) => {'
)

with open("src/lib/social.functions.ts", "w") as f:
    f.write(content)
