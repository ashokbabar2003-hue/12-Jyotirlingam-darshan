import fs from "fs";

const file = "src/routes/_authenticated/admin.tsx";
let content = fs.readFileSync(file, "utf-8");

const startStr = "post.image_url && (\n                        <div className=\"mt-3\">\n                          <p className=\"text-sm font-semibold text-muted-foreground\">\n                            Image Preview:";
const endStr = "                        </div>\n                      )\n                    )}";

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr, startIndex) + endStr.length;

if (startIndex === -1 || endIndex < startIndex) {
  console.error("Could not find admin.tsx image block bounds");
  process.exit(1);
}

const newBlock = `post.image_url ? (
                        <div className="mt-3">
                          <p className="text-sm font-semibold text-muted-foreground">
                            Image Preview:
                          </p>
                          <img
                            src={post.image_url}
                            alt={\`\${post.jyotirlinga_slug} preview\`}
                            className="mt-1 max-h-48 rounded-md object-cover border border-border/40"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="mt-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20 flex items-start gap-2">
                          <AlertCircle className="size-4 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-bold">AI IMAGE UNAVAILABLE</p>
                            <p>Gemini image-generation quota is currently 0.</p>
                          </div>
                        </div>
                      )
                    )}`;

content = content.substring(0, startIndex) + newBlock + content.substring(endIndex);
fs.writeFileSync(file, content);
console.log("Updated admin.tsx image block");
