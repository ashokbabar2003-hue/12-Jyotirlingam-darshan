import re

with open("src/lib/social.functions.ts", "r") as f:
    content = f.read()

# Replace the catch block for Gemini
content = re.sub(
    r'catch \(error\) \{\s*console\.error\("Error generating Instagram draft:", error\);\s*throw new Error\("Failed to generate Instagram draft with AI\."\);\s*\}',
    r'catch (error: any) { console.error("Error generating Instagram draft:", error); throw new Error("Failed to generate Instagram draft with AI: " + (error?.message || String(error))); }',
    content
)

with open("src/lib/social.functions.ts", "w") as f:
    f.write(content)
