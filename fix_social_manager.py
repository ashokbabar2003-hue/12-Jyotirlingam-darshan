import re

with open("src/routes/_authenticated/admin.tsx", "r") as f:
    content = f.read()

content = content.replace(
    ") : !posts || posts.length === 0 ? (",
    ") : !Array.isArray(posts) || posts.length === 0 ? ("
)

with open("src/routes/_authenticated/admin.tsx", "w") as f:
    f.write(content)
