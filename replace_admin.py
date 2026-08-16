import re

with open("src/routes/_authenticated/admin.tsx", "r") as f:
    content = f.read()

# 1. Add Tabs import
if "import { Tabs" not in content:
    content = content.replace(
        'import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";',
        'import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";\nimport { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";'
    )

# 2. Add StoryList and GalleryList components at the end
components_to_add = """
function StoryList({ stories, act, title, emptyMessage }: any) {
  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg text-foreground">{title} ({stories.length})</h3>
      {stories.length === 0 ? <p className="text-sm text-muted-foreground">{emptyMessage}</p> : 
        stories.map((s: any) => (
          <div key={s.id} className="rounded-lg border border-border/60 bg-card p-4">
            <p className="text-xs text-accent">{getJyotirlinga(s.slug)?.name ?? s.slug}</p>
            <h3 className="font-display text-lg text-foreground">{s.title}</h3>
            <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{s.body}</p>
            <p className="mt-2 text-xs text-muted-foreground">— {s.author_name}</p>
            {s.status === 'pending' && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="hero" onClick={() => act("story", s.id, "approve")}>
                  <Check className="size-4" /> Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => act("story", s.id, "reject")}>
                  <X className="size-4" /> Reject
                </Button>
              </div>
            )}
            {s.status === 'approved' && (
              <div className="mt-3">
                <Button size="sm" variant="outline" onClick={() => act("story", s.id, "reject")}>
                  <X className="size-4" /> Move to Rejected
                </Button>
              </div>
            )}
            {s.status === 'rejected' && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="hero" onClick={() => act("story", s.id, "approve")}>
                  <Check className="size-4" /> Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => act("story", s.id, "pending")}>
                  <RefreshCw className="size-4 mr-1" /> Re-queue
                </Button>
              </div>
            )}
          </div>
        ))
      }
    </div>
  )
}

function GalleryList({ gallery, act, title, emptyMessage }: any) {
  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg text-foreground">{title} ({gallery.length})</h3>
      {gallery.length === 0 ? <p className="text-sm text-muted-foreground">{emptyMessage}</p> : 
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {gallery.map((g: any) => (
            <div key={g.id} className="overflow-hidden rounded-lg border border-border/60 bg-card">
              {g.url && (
                <img
                  src={g.url}
                  alt={g.caption ?? ""}
                  className="aspect-video w-full object-cover"
                />
              )}
              <div className="p-3 text-sm">
                <p className="text-xs text-accent">{getJyotirlinga(g.slug)?.name ?? g.slug}</p>
                {g.caption && <p className="text-foreground">{g.caption}</p>}
                {g.note && (
                  <p className="mt-1 whitespace-pre-line italic text-muted-foreground">{g.note}</p>
                )}
                <p className="text-xs text-muted-foreground">— {g.author_name}</p>
                {g.status === 'pending' && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="hero" onClick={() => act("gallery", g.id, "approve")}>
                      <Check className="size-4" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => act("gallery", g.id, "reject")}>
                      <X className="size-4" /> Reject
                    </Button>
                  </div>
                )}
                {g.status === 'approved' && (
                  <div className="mt-3">
                    <Button size="sm" variant="outline" onClick={() => act("gallery", g.id, "reject")}>
                      <X className="size-4" /> Move to Rejected
                    </Button>
                  </div>
                )}
                {g.status === 'rejected' && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="hero" onClick={() => act("gallery", g.id, "approve")}>
                      <Check className="size-4" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => act("gallery", g.id, "pending")}>
                      <RefreshCw className="size-4 mr-1" /> Re-queue
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  )
}
"""

if "function StoryList(" not in content:
    content += "\n" + components_to_add

# 3. Replace AdminPage entirely
import re

admin_page_pattern = re.compile(r"function AdminPage\(\) \{.*?(?=\nfunction RefreshLogViewer)", re.DOTALL)

new_admin_page = """function AdminPage() {
  const rolesFn = useServerFn(getMyRoles);
  const queueFn = useServerFn(getModerationQueue);
  const moderateFn = useServerFn(moderate);
  const bootstrapFn = useServerFn(bootstrapAdmin);
  const getPostsFn = useServerFn(getSocialPosts);
  const qc = useQueryClient();

  const roles = useQuery({ queryKey: ["my-roles"], queryFn: () => rolesFn() });
  const isAdmin = roles.data?.roles.includes("admin");

  const queue = useQuery({
    queryKey: ["moderation"],
    queryFn: () => queueFn(),
    enabled: !!isAdmin,
  });

  const posts = useQuery({
    queryKey: ["social-posts"],
    queryFn: () => getPostsFn(),
    enabled: !!isAdmin,
  });

  async function act(type: "gallery" | "story", id: string, action: "approve" | "reject" | "pending") {
    try {
      await moderateFn({ data: { type, id, action: action as any } });
      toast.success(action === "approve" ? "Approved." : action === "reject" ? "Rejected." : "Moved to pending.");
      qc.invalidateQueries({ queryKey: ["moderation"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed.");
    }
  }

  async function claimAdmin() {
    const res = await bootstrapFn();
    if (res.granted) {
      toast.success("You are now an admin.");
      qc.invalidateQueries({ queryKey: ["my-roles"] });
    } else {
      toast.error(res.reason ?? "Could not grant admin.");
    }
  }

  if (roles.isLoading) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-muted-foreground">Loading…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <ShieldCheck className="mx-auto size-8 text-primary" />
        <h1 className="mt-4 font-display text-2xl text-foreground">Admin access required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Approve photos and stories here. If no admin exists yet, you can claim the first admin
          role for this site.
        </p>
        <Button variant="hero" className="mt-6" onClick={claimAdmin}>
          Become the first admin
        </Button>
        <div className="mt-4">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to darshan
          </Link>
        </div>
      </div>
    );
  }

  const galleryPending = queue.data?.gallery.filter((g: any) => g.status === 'pending') ?? [];
  const galleryApproved = queue.data?.gallery.filter((g: any) => g.status === 'approved') ?? [];
  const galleryRejected = queue.data?.gallery.filter((g: any) => g.status === 'rejected') ?? [];

  const storiesPending = queue.data?.stories.filter((s: any) => s.status === 'pending') ?? [];
  const storiesApproved = queue.data?.stories.filter((s: any) => s.status === 'approved') ?? [];
  const storiesRejected = queue.data?.stories.filter((s: any) => s.status === 'rejected') ?? [];

  const socialPending = posts.data?.filter((p: any) => p.status === 'pending_approval') ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-foreground">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage live darshan streams and approve devotee submissions.
          </p>
        </div>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← View site
        </Link>
      </div>

      <Tabs defaultValue="overview" className="mt-8 flex flex-col md:flex-row gap-8 items-start">
        <TabsList className="flex md:flex-col h-auto w-full md:w-56 bg-transparent border-0 justify-start space-x-2 md:space-x-0 md:space-y-1 p-0 overflow-x-auto">
          <TabsTrigger value="overview" className="justify-start data-[state=active]:bg-primary/10 w-full px-4 py-2">Overview</TabsTrigger>
          <TabsTrigger value="live-darshan" className="justify-start data-[state=active]:bg-primary/10 w-full px-4 py-2">Live Darshan</TabsTrigger>
          <TabsTrigger value="darshan-links" className="justify-start data-[state=active]:bg-primary/10 w-full px-4 py-2">Darshan Links</TabsTrigger>
          <TabsTrigger value="stories" className="justify-start data-[state=active]:bg-primary/10 w-full px-4 py-2 flex items-center justify-between">
            <span>Devotee Stories</span>
            {storiesPending.length > 0 && <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">{storiesPending.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="gallery" className="justify-start data-[state=active]:bg-primary/10 w-full px-4 py-2 flex items-center justify-between">
            <span>Gallery</span>
            {galleryPending.length > 0 && <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">{galleryPending.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="social-media" className="justify-start data-[state=active]:bg-primary/10 w-full px-4 py-2 flex items-center justify-between">
            <span>Social Media</span>
            {socialPending.length > 0 && <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">{socialPending.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="users" className="justify-start data-[state=active]:bg-primary/10 w-full px-4 py-2">Users & Roles</TabsTrigger>
        </TabsList>

        <div className="flex-1 w-full min-w-0">
          <TabsContent value="overview" className="mt-0 space-y-6">
            <h2 className="font-display text-2xl text-foreground">Overview</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-border/60 bg-card p-6">
                <p className="text-sm text-muted-foreground">Pending Stories</p>
                <p className="mt-2 font-display text-3xl text-foreground">{storiesPending.length}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-card p-6">
                <p className="text-sm text-muted-foreground">Pending Gallery</p>
                <p className="mt-2 font-display text-3xl text-foreground">{galleryPending.length}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-card p-6">
                <p className="text-sm text-muted-foreground">Pending Social Drafts</p>
                <p className="mt-2 font-display text-3xl text-foreground">{socialPending.length}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-card p-6">
                <p className="text-sm text-muted-foreground">Total Approved Stories</p>
                <p className="mt-2 font-display text-3xl text-foreground">{storiesApproved.length}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-card p-6">
                <p className="text-sm text-muted-foreground">Total Approved Photos</p>
                <p className="mt-2 font-display text-3xl text-foreground">{galleryApproved.length}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-card p-6">
                <p className="text-sm text-muted-foreground">Total Active Jyotirlingas</p>
                <p className="mt-2 font-display text-3xl text-foreground">{jyotirlingas.length}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="live-darshan" className="mt-0 space-y-8">
            <ChannelAutoRefreshManager />
            <RefreshLogViewer />
          </TabsContent>

          <TabsContent value="darshan-links" className="mt-0">
            <DarshanLinkManager />
          </TabsContent>

          <TabsContent value="stories" className="mt-0 space-y-8">
            <StoryList stories={storiesPending} act={act} title="Pending Stories" emptyMessage="No pending stories." />
            {storiesApproved.length > 0 && <StoryList stories={storiesApproved} act={act} title="Approved Stories" emptyMessage="No approved stories." />}
            {storiesRejected.length > 0 && <StoryList stories={storiesRejected} act={act} title="Rejected Stories" emptyMessage="No rejected stories." />}
          </TabsContent>

          <TabsContent value="gallery" className="mt-0 space-y-8">
            <GalleryList gallery={galleryPending} act={act} title="Pending Photos" emptyMessage="No pending photos." />
            {galleryApproved.length > 0 && <GalleryList gallery={galleryApproved} act={act} title="Approved Photos" emptyMessage="No approved photos." />}
            {galleryRejected.length > 0 && <GalleryList gallery={galleryRejected} act={act} title="Rejected Photos" emptyMessage="No rejected photos." />}
          </TabsContent>

          <TabsContent value="social-media" className="mt-0">
            <SocialMediaManager />
          </TabsContent>

          <TabsContent value="users" className="mt-0 space-y-6">
            <h2 className="font-display text-xl text-foreground">Users & Roles</h2>
            <div className="rounded-lg border border-border/60 bg-card p-6">
              <p className="text-sm text-foreground font-semibold">Your Roles</p>
              <div className="mt-3 flex gap-2">
                {roles.data?.roles.map(r => (
                  <span key={r} className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs text-primary capitalize">{r}</span>
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              User and role management is handled via the Postgres database using Row Level Security and the public.user_roles table.
              Currently, you hold the roles displayed above.
            </p>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
"""

content = admin_page_pattern.sub(new_admin_page, content)

with open("src/routes/_authenticated/admin.tsx", "w") as f:
    f.write(content)

