import re

with open("src/routes/_authenticated/admin.tsx", "r") as f:
    content = f.read()

# Make array destructuring highly defensive
content = content.replace(
    "const galleryPending = queue.data?.gallery.filter((g: any) => g.status === 'pending') ?? [];",
    "const galleryPending = (queue.data?.gallery || []).filter((g: any) => g.status === 'pending');"
)
content = content.replace(
    "const galleryApproved = queue.data?.gallery.filter((g: any) => g.status === 'approved') ?? [];",
    "const galleryApproved = (queue.data?.gallery || []).filter((g: any) => g.status === 'approved');"
)
content = content.replace(
    "const galleryRejected = queue.data?.gallery.filter((g: any) => g.status === 'rejected') ?? [];",
    "const galleryRejected = (queue.data?.gallery || []).filter((g: any) => g.status === 'rejected');"
)

content = content.replace(
    "const storiesPending = queue.data?.stories.filter((s: any) => s.status === 'pending') ?? [];",
    "const storiesPending = (queue.data?.stories || []).filter((s: any) => s.status === 'pending');"
)
content = content.replace(
    "const storiesApproved = queue.data?.stories.filter((s: any) => s.status === 'approved') ?? [];",
    "const storiesApproved = (queue.data?.stories || []).filter((s: any) => s.status === 'approved');"
)
content = content.replace(
    "const storiesRejected = queue.data?.stories.filter((s: any) => s.status === 'rejected') ?? [];",
    "const storiesRejected = (queue.data?.stories || []).filter((s: any) => s.status === 'rejected');"
)

content = content.replace(
    "const socialPending = posts.data?.filter((p: any) => p.status === 'pending_approval') ?? [];",
    "const socialPending = (Array.isArray(posts.data) ? posts.data : []).filter((p: any) => p.status === 'pending_approval');"
)

with open("src/routes/_authenticated/admin.tsx", "w") as f:
    f.write(content)
