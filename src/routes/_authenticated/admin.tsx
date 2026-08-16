import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Check,
  X,
  ShieldCheck,
  Youtube,
  Save,
  RefreshCw,
  Trash2,
  Radio,
  ScrollText,
  Send,
  Edit3,
  Sparkles,
  ImageIcon,
  Layers,
  Video,
} from "lucide-react";
import { CreateInstagramPostDialog } from "@/components/CreateInstagramPostDialog";
import { useEffect, useState } from "react";
import {
  getModerationQueue,
  moderate,
  getMyRoles,
  bootstrapAdmin,
  getDarshanLinks,
  setDarshanLink,
  getDarshanChannels,
  setDarshanChannel,
  deleteDarshanChannel,
  refreshLiveStreamsNow,
  getRefreshLogs,
  type RefreshLogRow,
} from "@/lib/darshan.functions";
import { getJyotirlinga, jyotirlingas } from "@/data/jyotirlingas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateYoutubeUrl } from "@/lib/youtube";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import {
  getSocialPosts,
  draftSocialPost,
  updateSocialPost,
  approveSocialPost,
  publishSocialPost,
  regenerateSocialPostImage,
  setSocialPostImage,
} from "@/lib/social.functions";
import { getGeminiDebugStatus } from "@/lib/gemini-debug.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Manage submissions — 12 Jyotirlinga Darshan" }] }),
  component: AdminPage,
});

function AdminPage() {
  const rolesFn = useServerFn(getMyRoles);
  const queueFn = useServerFn(getModerationQueue);
  const moderateFn = useServerFn(moderate);
  const bootstrapFn = useServerFn(bootstrapAdmin);
  const getPostsFn = useServerFn(getSocialPosts);
  const debugStatusFn = useServerFn(getGeminiDebugStatus);
  const qc = useQueryClient();

  const [isDebugRunning, setIsDebugRunning] = useState(false);

  async function runGeminiDiagnostics() {
    setIsDebugRunning(true);
    try {
      const report = await debugStatusFn();
      console.log("[GEMINI BROWSER DEBUG REPORT]:", report);
      if (report.available) {
        toast.success(
          `Gemini API Key Verified! Length: ${report.length} chars. Source: ${report.source}. Detected ${report.envKeys.length} config keys.`,
          { duration: 10000 },
        );
      } else {
        toast.error(
          `Gemini API Key is NOT configured on the server. Available keys list: [${report.envKeys.join(", ")}].`,
          { duration: 10000 },
        );
      }
    } catch (err) {
      toast.error(
        `Diagnostics failed to invoke: ${err instanceof Error ? err.message : String(err)}`,
        { duration: 10000 },
      );
    } finally {
      setIsDebugRunning(false);
    }
  }

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

  async function act(
    type: "gallery" | "story",
    id: string,
    action: "approve" | "reject" | "pending",
  ) {
    try {
      await moderateFn({ data: { type, id, action: action as any } });
      toast.success(
        action === "approve"
          ? "Approved."
          : action === "reject"
            ? "Rejected."
            : "Moved to pending.",
      );
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

  const galleryPending = (queue.data?.gallery || []).filter((g: any) => g.status === "pending");
  const galleryApproved = (queue.data?.gallery || []).filter((g: any) => g.status === "approved");
  const galleryRejected = (queue.data?.gallery || []).filter((g: any) => g.status === "rejected");

  const storiesPending = (queue.data?.stories || []).filter((s: any) => s.status === "pending");
  const storiesApproved = (queue.data?.stories || []).filter((s: any) => s.status === "approved");
  const storiesRejected = (queue.data?.stories || []).filter((s: any) => s.status === "rejected");

  const socialPending = (Array.isArray(posts.data) ? posts.data : []).filter(
    (p: any) => p.status === "pending_approval",
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-foreground">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage live darshan streams and approve devotee submissions.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={runGeminiDiagnostics}
            disabled={isDebugRunning}
            className="text-xs text-muted-foreground hover:text-foreground border-dashed h-8 px-3"
          >
            {isDebugRunning ? "Verifying..." : "Verify Gemini Key"}
          </Button>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← View site
          </Link>
        </div>
      </div>

      <Tabs defaultValue="overview" className="mt-8 flex flex-col md:flex-row gap-8 items-start">
        <TabsList className="flex md:flex-col h-auto w-full md:w-56 bg-transparent border-0 justify-start space-x-2 md:space-x-0 md:space-y-1 p-0 overflow-x-auto">
          <TabsTrigger
            value="overview"
            className="justify-start data-[state=active]:bg-primary/10 w-full px-4 py-2"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="live-darshan"
            className="justify-start data-[state=active]:bg-primary/10 w-full px-4 py-2"
          >
            Live Darshan
          </TabsTrigger>
          <TabsTrigger
            value="darshan-links"
            className="justify-start data-[state=active]:bg-primary/10 w-full px-4 py-2"
          >
            Darshan Links
          </TabsTrigger>
          <TabsTrigger
            value="stories"
            className="justify-start data-[state=active]:bg-primary/10 w-full px-4 py-2 flex items-center justify-between"
          >
            <span>Devotee Stories</span>
            {storiesPending.length > 0 && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
                {storiesPending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="gallery"
            className="justify-start data-[state=active]:bg-primary/10 w-full px-4 py-2 flex items-center justify-between"
          >
            <span>Gallery</span>
            {galleryPending.length > 0 && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
                {galleryPending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="social-media"
            className="justify-start data-[state=active]:bg-primary/10 w-full px-4 py-2 flex items-center justify-between"
          >
            <span>Social Media</span>
            {socialPending.length > 0 && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
                {socialPending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="justify-start data-[state=active]:bg-primary/10 w-full px-4 py-2"
          >
            Users & Roles
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 w-full min-w-0">
          <TabsContent value="overview" className="mt-0 space-y-6">
            <h2 className="font-display text-2xl text-foreground">Overview</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-border/60 bg-card p-6">
                <p className="text-sm text-muted-foreground">Pending Stories</p>
                <p className="mt-2 font-display text-3xl text-foreground">
                  {storiesPending.length}
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-card p-6">
                <p className="text-sm text-muted-foreground">Pending Gallery</p>
                <p className="mt-2 font-display text-3xl text-foreground">
                  {galleryPending.length}
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-card p-6">
                <p className="text-sm text-muted-foreground">Pending Social Drafts</p>
                <p className="mt-2 font-display text-3xl text-foreground">{socialPending.length}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-card p-6">
                <p className="text-sm text-muted-foreground">Total Approved Stories</p>
                <p className="mt-2 font-display text-3xl text-foreground">
                  {storiesApproved.length}
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-card p-6">
                <p className="text-sm text-muted-foreground">Total Approved Photos</p>
                <p className="mt-2 font-display text-3xl text-foreground">
                  {galleryApproved.length}
                </p>
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
            <StoryList
              stories={storiesPending}
              act={act}
              title="Pending Stories"
              emptyMessage="No pending stories."
            />
            {storiesApproved.length > 0 && (
              <StoryList
                stories={storiesApproved}
                act={act}
                title="Approved Stories"
                emptyMessage="No approved stories."
              />
            )}
            {storiesRejected.length > 0 && (
              <StoryList
                stories={storiesRejected}
                act={act}
                title="Rejected Stories"
                emptyMessage="No rejected stories."
              />
            )}
          </TabsContent>

          <TabsContent value="gallery" className="mt-0 space-y-8">
            <GalleryList
              gallery={galleryPending}
              act={act}
              title="Pending Photos"
              emptyMessage="No pending photos."
            />
            {galleryApproved.length > 0 && (
              <GalleryList
                gallery={galleryApproved}
                act={act}
                title="Approved Photos"
                emptyMessage="No approved photos."
              />
            )}
            {galleryRejected.length > 0 && (
              <GalleryList
                gallery={galleryRejected}
                act={act}
                title="Rejected Photos"
                emptyMessage="No rejected photos."
              />
            )}
          </TabsContent>

          <TabsContent value="social-media" className="mt-0">
            <SocialMediaManager />
          </TabsContent>

          <TabsContent value="users" className="mt-0 space-y-6">
            <h2 className="font-display text-xl text-foreground">Users & Roles</h2>
            <div className="rounded-lg border border-border/60 bg-card p-6">
              <p className="text-sm text-foreground font-semibold">Your Roles</p>
              <div className="mt-3 flex gap-2">
                {roles.data?.roles.map((r) => (
                  <span
                    key={r}
                    className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs text-primary capitalize"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              User and role management is handled via the Postgres database using Row Level Security
              and the public.user_roles table. Currently, you hold the roles displayed above.
            </p>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function RefreshLogViewer() {
  const logsFn = useServerFn(getRefreshLogs);
  const logs = useQuery({
    queryKey: ["refresh-logs"],
    queryFn: () => logsFn(),
    refetchInterval: 30_000,
  });
  const qc = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [shrineFilter, setShrineFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const rows = logs.data ?? [];
  const filtered = rows
    .map((row) => {
      const outcomes = row.outcomes.filter((o) => {
        if (shrineFilter !== "all" && o.slug !== shrineFilter) return false;
        if (statusFilter !== "all" && o.status !== statusFilter) return false;
        return true;
      });
      return { ...row, outcomes };
    })
    .filter((row) => {
      const t = new Date(row.started_at).getTime();
      if (fromDate && t < new Date(fromDate).getTime()) return false;
      if (toDate && t > new Date(toDate).getTime() + 86_400_000) return false;
      if ((shrineFilter !== "all" || statusFilter !== "all") && row.outcomes.length === 0)
        return false;
      return true;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [fromDate, toDate, shrineFilter, statusFilter, rows.length]);

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
          <ScrollText className="size-5 text-primary" /> Refresh log
        </h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => qc.invalidateQueries({ queryKey: ["refresh-logs"] })}
        >
          <RefreshCw className="size-4" /> Reload
        </Button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Every cron run (every 10 minutes) and manual refresh is recorded with per-shrine status,
        previous link, updated link, and timestamps.
      </p>

      <div className="mt-3 grid gap-2 rounded-lg border border-border/60 bg-card/40 p-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label className="text-xs">From date</Label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">To date</Label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Shrine</Label>
          <select
            value={shrineFilter}
            onChange={(e) => setShrineFilter(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="all">All shrines</option>
            {jyotirlingas.map((j) => (
              <option key={j.slug} value={j.slug}>
                {j.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs">Status</Label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="updated">Updated</option>
            <option value="unchanged">Unchanged</option>
            <option value="no_live">No live</option>
            <option value="error">Error</option>
          </select>
        </div>
        {(fromDate || toDate || shrineFilter !== "all" || statusFilter !== "all") && (
          <Button
            size="sm"
            variant="ghost"
            className="sm:col-span-2 lg:col-span-4 justify-self-start"
            onClick={() => {
              setFromDate("");
              setToDate("");
              setShrineFilter("all");
              setStatusFilter("all");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {logs.isLoading && <p className="text-sm text-muted-foreground">Loading logs…</p>}
        {!logs.isLoading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No runs match these filters. The cron job fires every 10 minutes; you can also press
            "Refresh now" above.
          </p>
        )}
        {paged.map((row) => {
          const isOpen = open === row.id;
          const errored = row.errors > 0;
          return (
            <div key={row.id} className="rounded-lg border border-border/60 bg-card p-3 text-sm">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : row.id)}
                className="flex w-full flex-wrap items-center justify-between gap-2 text-left"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                      row.source === "cron"
                        ? "bg-primary/15 text-primary"
                        : "bg-accent/20 text-accent"
                    }`}
                  >
                    {row.source}
                  </span>
                  <span className="text-foreground">
                    {new Date(row.started_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-emerald-400">{row.updated} updated</span>
                  <span className="text-muted-foreground">{row.unchanged} same</span>
                  <span className="text-amber-400">{row.no_live} idle</span>
                  <span className={errored ? "text-destructive" : "text-muted-foreground"}>
                    {row.errors} errors
                  </span>
                </div>
              </button>

              {isOpen && (
                <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
                  {row.outcomes.map((o, i) => {
                    const changed =
                      o.status === "updated" &&
                      o.previous_url &&
                      o.new_url &&
                      o.previous_url !== o.new_url;
                    return (
                      <div
                        key={`${o.slug}-${i}`}
                        className="rounded border border-border/40 bg-background/40 p-2 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium text-foreground">
                            {getJyotirlinga(o.slug)?.name ?? o.slug}
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                o.status === "updated"
                                  ? "text-emerald-400"
                                  : o.status === "error"
                                    ? "text-destructive"
                                    : o.status === "no_live"
                                      ? "text-amber-400"
                                      : "text-muted-foreground"
                              }
                            >
                              {o.status}
                            </span>
                            <span className="text-muted-foreground">
                              {o.checked_at
                                ? new Date(o.checked_at).toLocaleString()
                                : new Date(row.started_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="mt-1 grid gap-1 sm:grid-cols-2">
                          <div className="text-muted-foreground">
                            <span className="opacity-60">Previous: </span>
                            {o.previous_url ? (
                              <a
                                href={o.previous_url}
                                target="_blank"
                                rel="noreferrer"
                                className="break-all underline-offset-2 hover:text-foreground hover:underline"
                              >
                                {o.previous_url}
                              </a>
                            ) : (
                              <span className="italic">none</span>
                            )}
                          </div>
                          <div className="text-muted-foreground">
                            <span className="opacity-60">Updated: </span>
                            {o.new_url ? (
                              <a
                                href={o.new_url}
                                target="_blank"
                                rel="noreferrer"
                                className={`break-all underline-offset-2 hover:underline ${
                                  changed ? "text-emerald-400" : "hover:text-foreground"
                                }`}
                              >
                                {o.new_url}
                              </a>
                            ) : (
                              <span className="italic">none</span>
                            )}
                          </div>
                        </div>
                        {o.message && (
                          <div className="mt-1 italic text-muted-foreground">{o.message}</div>
                        )}
                        {o.status === "unchanged" && !o.message && (
                          <div className="mt-1 italic text-muted-foreground">
                            No change — same live link as before.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {filtered.length > pageSize && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            Showing {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} runs
          </span>
          <div className="flex flex-wrap items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Prev
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1)
              .map((n, idx, arr) => (
                <span key={n} className="flex items-center gap-1">
                  {idx > 0 && arr[idx - 1] !== n - 1 && <span className="px-1">…</span>}
                  <Button
                    size="sm"
                    variant={n === currentPage ? "default" : "outline"}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </Button>
                </span>
              ))}
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function defaultKey(slug: string) {
  return `${slug}__default`;
}

function DarshanLinkManager() {
  const linksFn = useServerFn(getDarshanLinks);
  const saveFn = useServerFn(setDarshanLink);
  const qc = useQueryClient();
  const links = useQuery({ queryKey: ["darshan-links"], queryFn: () => linksFn() });
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingSlug, setSavingSlug] = useState<string | null>(null);

  useEffect(() => {
    if (links.data) {
      const next: Record<string, string> = {};
      for (const jl of jyotirlingas) {
        next[jl.slug] = links.data[jl.slug] ?? jl.youtubeUrl;
        next[defaultKey(jl.slug)] = links.data[defaultKey(jl.slug)] ?? jl.defaultYoutubeUrl;
      }
      setDrafts(next);
    }
  }, [links.data]);

  async function save(slug: string) {
    const value = drafts[slug]?.trim();
    if (!value) return;
    const check = validateYoutubeUrl(value);
    if (!check.ok) {
      toast.error(`Can't save — ${check.reason}`);
      return;
    }
    setSavingSlug(slug);
    try {
      await saveFn({ data: { slug, youtube_url: value } });
      toast.success("Darshan link updated.");
      qc.invalidateQueries({ queryKey: ["darshan-links"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save link.");
    } finally {
      setSavingSlug(null);
    }
  }

  return (
    <section className="mt-12">
      <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
        <Youtube className="size-5 text-primary" /> Live darshan links
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Set a <b>Live</b> link and a <b>Default</b> fallback for each shrine. If the live stream
        becomes unavailable (removed, blocked, embedding disabled), the homepage automatically swaps
        to the default link for that shrine.
      </p>
      <div className="mt-4 space-y-4">
        {jyotirlingas.map((jl) => {
          const dk = defaultKey(jl.slug);
          return (
            <div key={jl.slug} className="rounded-lg border border-border/60 bg-card p-3">
              <Label className="text-xs text-accent">{jl.name}</Label>

              <div className="mt-3">
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Live link
                </Label>
                <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={drafts[jl.slug] ?? ""}
                    onChange={(e) => setDrafts((d) => ({ ...d, [jl.slug]: e.target.value }))}
                    placeholder="https://www.youtube.com/watch?v=…"
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="hero"
                    onClick={() => save(jl.slug)}
                    disabled={savingSlug === jl.slug}
                  >
                    <Save className="size-4" /> {savingSlug === jl.slug ? "Saving…" : "Save"}
                  </Button>
                </div>
                <LinkPreview
                  savedUrl={links.data?.[jl.slug] ?? jl.youtubeUrl}
                  draftUrl={drafts[jl.slug] ?? ""}
                  title={`${jl.name} live darshan preview`}
                />
              </div>

              <div className="mt-4">
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Default fallback link
                </Label>
                <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={drafts[dk] ?? ""}
                    onChange={(e) => setDrafts((d) => ({ ...d, [dk]: e.target.value }))}
                    placeholder="https://www.youtube.com/watch?v=…"
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => save(dk)}
                    disabled={savingSlug === dk}
                  >
                    <Save className="size-4" /> {savingSlug === dk ? "Saving…" : "Save"}
                  </Button>
                </div>
                <LinkPreview
                  savedUrl={links.data?.[dk] ?? jl.defaultYoutubeUrl}
                  draftUrl={drafts[dk] ?? ""}
                  title={`${jl.name} default darshan preview`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function LinkPreview({
  savedUrl,
  draftUrl,
  title,
}: {
  savedUrl: string;
  draftUrl: string;
  title: string;
}) {
  const draftDiffers = draftUrl.trim() && draftUrl.trim() !== savedUrl.trim();
  const draftCheck = draftDiffers ? validateYoutubeUrl(draftUrl) : null;
  const savedCheck = validateYoutubeUrl(savedUrl);

  return (
    <div className="mt-3 space-y-2">
      {draftCheck && !draftCheck.ok && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>This link won't embed</AlertTitle>
          <AlertDescription>{draftCheck.reason}</AlertDescription>
        </Alert>
      )}
      {savedCheck.ok ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-md bg-black">
          <iframe
            src={savedCheck.embedUrl}
            title={title}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 size-full"
          />
        </div>
      ) : (
        <Alert>
          <AlertCircle className="size-4" />
          <AlertTitle>Saved link can't be previewed</AlertTitle>
          <AlertDescription>
            {savedCheck.reason} Accepted formats: watch?v=…, youtu.be/…, /live/…, /shorts/…, or
            channel/UC…/live.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Verified official YouTube channels. Only include URLs we've confirmed are run by
// the temple trust itself — a wrong "official" URL here would feed bad video IDs to
// the live tile every 10 minutes. Leave shrines with no confirmed channel out of
// this map; the admin gets a "Search on YouTube" helper to find and paste theirs.
const SUGGESTED_CHANNELS: Record<string, string> = {
  somnath: "https://www.youtube.com/channel/UCT1egsvA08YcdMLiEu1DTRg",
  mahakaleshwar: "https://www.youtube.com/channel/UCEUuwXHmHckwmdANSy4c7Sw",
  "kashi-vishwanath": "https://www.youtube.com/@ShreeKashiVishwanathMandir",
};

function youtubeSearchUrl(name: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${name} temple official live darshan`,
  )}`;
}

function ChannelAutoRefreshManager() {
  const channelsFn = useServerFn(getDarshanChannels);
  const setFn = useServerFn(setDarshanChannel);
  const delFn = useServerFn(deleteDarshanChannel);
  const refreshFn = useServerFn(refreshLiveStreamsNow);
  const qc = useQueryClient();

  const channels = useQuery({ queryKey: ["darshan-channels"], queryFn: () => channelsFn() });
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Pre-fill empty inputs with saved channels first, then with verified suggestions
  // so admins see a one-click Save for shrines we've already researched.
  useEffect(() => {
    if (!channels.data) return;
    const saved: Record<string, string> = {};
    for (const c of channels.data) saved[c.slug] = c.channel_url;
    setDrafts((prev) => {
      const next: Record<string, string> = { ...prev };
      for (const jl of jyotirlingas) {
        if (next[jl.slug]) continue;
        next[jl.slug] = saved[jl.slug] ?? SUGGESTED_CHANNELS[jl.slug] ?? "";
      }
      return next;
    });
  }, [channels.data]);

  const byslug = new Map((channels.data ?? []).map((c) => [c.slug, c]));

  async function save(slug: string) {
    const value = (drafts[slug] ?? "").trim();
    if (!value) {
      toast.error("Paste a channel URL first.");
      return;
    }
    setBusy(slug);
    try {
      await setFn({ data: { slug, channel_url: value } });
      toast.success("Channel saved.");
      qc.invalidateQueries({ queryKey: ["darshan-channels"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(slug: string) {
    setBusy(slug);
    try {
      await delFn({ data: { slug } });
      setDrafts((d) => ({ ...d, [slug]: "" }));
      toast.success("Channel removed.");
      qc.invalidateQueries({ queryKey: ["darshan-channels"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    } finally {
      setBusy(null);
    }
  }

  async function refreshNow() {
    setRefreshing(true);
    try {
      const res = await refreshFn();
      const updated = res.outcomes.filter((o) => o.status === "updated").length;
      const noLive = res.outcomes.filter((o) => o.status === "no_live").length;
      const errors = res.outcomes.filter((o) => o.status === "error").length;
      toast.success(
        `Refresh done — ${updated} updated, ${noLive} idle, ${errors} errors. Links with errors were kept as-is.`,
      );
      qc.invalidateQueries({ queryKey: ["darshan-channels"] });
      qc.invalidateQueries({ queryKey: ["darshan-links"] });
      qc.invalidateQueries({ queryKey: ["refresh-logs"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Refresh failed.");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
          <Radio className="size-5 text-primary" /> Auto-refresh live streams
        </h2>
        <Button size="sm" variant="hero" onClick={refreshNow} disabled={refreshing}>
          <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing…" : "Refresh now"}
        </Button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Paste each shrine's official YouTube channel URL (e.g.{" "}
        <code className="text-foreground/80">https://www.youtube.com/@channel</code> or{" "}
        <code className="text-foreground/80">https://www.youtube.com/channel/UCxxxx/live</code>). A
        background job runs every 10 minutes, finds the active live stream, and updates the Live
        link above. If the scan fails or no stream is on, the existing Live link is kept.
      </p>

      <div className="mt-4 space-y-3">
        {jyotirlingas.map((jl) => {
          const c = byslug.get(jl.slug);
          const statusColor = c?.last_status?.startsWith("updated")
            ? "text-emerald-400"
            : c?.last_status?.startsWith("unchanged")
              ? "text-muted-foreground"
              : c?.last_status?.startsWith("no_live")
                ? "text-amber-400"
                : c?.last_status?.startsWith("error")
                  ? "text-destructive"
                  : "text-muted-foreground";
          return (
            <div key={jl.slug} className="rounded-lg border border-border/60 bg-card p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className="text-xs text-accent">{jl.name}</Label>
                <div className="flex items-center gap-2 text-[11px]">
                  {SUGGESTED_CHANNELS[jl.slug] && !c && (
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-emerald-300">
                      Verified suggestion pre-filled
                    </span>
                  )}
                  <a
                    href={youtubeSearchUrl(jl.name)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  >
                    Search on YouTube ↗
                  </a>
                </div>
              </div>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <Input
                  value={drafts[jl.slug] ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [jl.slug]: e.target.value }))}
                  placeholder="https://www.youtube.com/@officialchannel"
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="hero"
                  onClick={() => save(jl.slug)}
                  disabled={busy === jl.slug}
                >
                  <Save className="size-4" /> Save
                </Button>
                {c && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => remove(jl.slug)}
                    disabled={busy === jl.slug}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
              {c?.last_checked && (
                <p className={`mt-2 text-xs ${statusColor}`}>
                  Last checked {new Date(c.last_checked).toLocaleString()} — {c.last_status}
                  {c.last_video_id ? ` (videoId: ${c.last_video_id})` : ""}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SocialMediaManager() {
  const qc = useQueryClient();
  const getPostsFn = useServerFn(getSocialPosts);
  const draftFn = useServerFn(draftSocialPost);
  const updateFn = useServerFn(updateSocialPost);
  const approveFn = useServerFn(approveSocialPost);
  const publishFn = useServerFn(publishSocialPost);
  const regenerateImageFn = useServerFn(regenerateSocialPostImage);
  const setImageFn = useServerFn(setSocialPostImage);

  const [selectedSlug, setSelectedSlug] = useState<string>("somnath");
  const [drafting, setDrafting] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [settingImageId, setSettingImageId] = useState<string | null>(null);

  // Candidate images for original vs new selection: { [postId]: { original: string, generated: string } }
  const [candidateImages, setCandidateImages] = useState<
    Record<string, { original: string; generated: string }>
  >({});
  const [failedImageDrafts, setFailedImageDrafts] = useState<Record<string, string>>({});

  // Manual Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState<string>("");
  const [editImagePrompt, setEditImagePrompt] = useState<string>("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["social-posts"],
    queryFn: () => getPostsFn(),
  });

  async function onDraft() {
    if (!selectedSlug) {
      toast.error("Please select a Jyotirlinga.");
      return;
    }

    console.log("[DRAFT DEBUG 1] Generate Draft clicked");
    console.log("[DRAFT DEBUG 2] Selected slug:", selectedSlug);

    try {
      setDrafting(true);
      toast.info("Generating new draft concept & imagery...");
      const result = await draftFn({ data: { slug: selectedSlug } });
      console.log("[DRAFT DEBUG 12 Client] Draft received from server:", result);
      toast.success("Draft generated successfully!");
      await qc.invalidateQueries({ queryKey: ["social-posts"] });
    } catch (e) {
      console.error("[DRAFT GENERATION ERROR]", e);
      toast.error(e instanceof Error ? e.message : "Failed to generate draft");
    } finally {
      setDrafting(false);
    }
  }

  async function onRegenerateImage(post: SocialPost) {
    try {
      setRegeneratingId(post.id);
      toast.info("Generating new image for draft...");
      const updated = await regenerateImageFn({ data: { id: post.id } });
      // If we had an original image, track candidate images
      if (post.image_url && updated.image_url && post.image_url !== updated.image_url) {
        setCandidateImages((prev) => ({
          ...prev,
          [post.id]: {
            original: post.image_url!,
            generated: updated.image_url!,
          },
        }));
      }
      setFailedImageDrafts((prev) => {
        const copy = { ...prev };
        delete copy[post.id];
        return copy;
      });
      toast.success("New visual asset generated!");
      await qc.invalidateQueries({ queryKey: ["social-posts"] });
    } catch (e) {
      console.error("[REGENERATE IMAGE ERROR]", e);
      toast.error(e instanceof Error ? e.message : "Failed to generate image");
    } finally {
      setRegeneratingId(null);
    }
  }

  async function onSetImage(postId: string, imageUrl: string) {
    try {
      setSettingImageId(postId);
      await setImageFn({ data: { id: postId, image_url: imageUrl } });
      toast.success("Selected image is now authoritative.");
      await qc.invalidateQueries({ queryKey: ["social-posts"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to select image");
    } finally {
      setSettingImageId(null);
    }
  }

  function onStartEdit(post: SocialPost) {
    setEditingId(post.id);
    setEditCaption(post.caption || "");
    setEditImagePrompt(post.image_prompt || "");
  }

  function onCancelEdit() {
    setEditingId(null);
    setEditCaption("");
    setEditImagePrompt("");
  }

  async function onSaveEdit(post: SocialPost) {
    if (!editCaption.trim()) {
      toast.error("Caption cannot be empty.");
      return;
    }
    if (!editImagePrompt.trim()) {
      toast.error("Image prompt cannot be empty.");
      return;
    }

    const isPromptChanged = editImagePrompt.trim() !== (post.image_prompt || "").trim();

    console.log("[EDIT DEBUG 1] Save Changes clicked");
    console.log("[EDIT DEBUG 2] Draft ID:", post.id);
    console.log("[EDIT DEBUG 3] Image prompt changed:", isPromptChanged);
    console.log("[EDIT DEBUG 4] updateSocialPost RPC started");

    try {
      setSavingId(post.id);
      const res = await updateFn({
        data: {
          id: post.id,
          caption: editCaption.trim(),
          image_prompt: editImagePrompt.trim(),
        },
      });

      const responsePayload = res as {
        post?: SocialPost;
        originalImageUrl?: string | null;
        newImageUrl?: string | null;
        imagePromptChanged?: boolean;
        imageGenerationSuccess?: boolean;
        imageGenerationError?: string | null;
      };

      // Check if candidate images were generated
      if (responsePayload.newImageUrl && responsePayload.originalImageUrl) {
        setCandidateImages((prev) => ({
          ...prev,
          [post.id]: {
            original: responsePayload.originalImageUrl!,
            generated: responsePayload.newImageUrl!,
          },
        }));
        setFailedImageDrafts((prev) => {
          const copy = { ...prev };
          delete copy[post.id];
          return copy;
        });
        toast.success(
          "Changes saved and new image generated! You can choose between assets below.",
        );
      } else if (responsePayload.imagePromptChanged && !responsePayload.imageGenerationSuccess) {
        setFailedImageDrafts((prev) => ({
          ...prev,
          [post.id]: responsePayload.imageGenerationError || "Image generation could not complete.",
        }));
        toast.warning("Changes saved, but the new image could not be generated.");
      } else {
        setFailedImageDrafts((prev) => {
          const copy = { ...prev };
          delete copy[post.id];
          return copy;
        });
        toast.success("Draft changes saved successfully.");
      }

      console.log("[EDIT DEBUG 16] Editor closed / UI refreshed");
      setEditingId(null);
      await qc.invalidateQueries({ queryKey: ["social-posts"] });
    } catch (e) {
      console.error("[EDIT SAVE ERROR]", e);
      toast.error(e instanceof Error ? e.message : "Failed to save draft changes");
    } finally {
      setSavingId(null);
    }
  }

  async function onApprove(id: string) {
    try {
      await approveFn({ data: id });
      toast.success("Post approved.");
      qc.invalidateQueries({ queryKey: ["social-posts"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to approve");
    }
  }

  async function onPublish(post: SocialPost) {
    console.log("[PUBLISH BUTTON CLICKED]", post.id, post.status, post.image_url);
    try {
      setPublishingId(post.id);
      console.log("[SOCIAL DEBUG 1] Publish button clicked", {
        postId: post.id,
        status: post.status,
        imageUrl: post.image_url,
      });
      const result = await publishFn({ data: post.id });
      console.log("[SOCIAL DEBUG 2] publishSocialPost returned", result);
      toast.success("Successfully published to Instagram!");
      qc.invalidateQueries({ queryKey: ["social-posts"] });
    } catch (e) {
      console.error("[SOCIAL DEBUG CLIENT ERROR]", e);
      toast.error(e instanceof Error ? e.message : "Failed to publish to Instagram");
    } finally {
      setPublishingId(null);
    }
  }

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-foreground">Social Media Manager</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Publish single images, carousels, or reels directly, or generate AI drafts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* NEW MANUAL UPLOAD WORKFLOW */}
          <CreateInstagramPostDialog
            onSuccess={() => qc.invalidateQueries({ queryKey: ["social-posts"] })}
          />

          <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />

          {/* AI GENERATED DRAFT WORKFLOW */}
          <select
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            className="rounded-md border border-border/60 bg-card p-1 text-sm text-foreground"
          >
            {jyotirlingas.map((j) => (
              <option key={j.slug} value={j.slug}>
                {j.name}
              </option>
            ))}
          </select>
          <Button size="sm" variant="outline" onClick={onDraft} disabled={drafting}>
            {drafting ? (
              <RefreshCw className="mr-2 size-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 size-4 text-amber-500" />
            )}
            {drafting ? "Generating AI Draft..." : "AI Draft"}
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading posts...</p>
        ) : !Array.isArray(posts) || posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No posts found. Click "Create Instagram Post" above to upload media, or select a shrine
            and click "AI Draft".
          </p>
        ) : (
          posts.map((post) => {
            const isEditing = editingId === post.id;
            const postType =
              post.post_type || (post.media && post.media.length > 1 ? "carousel" : "image");
            const isNonProductionImageUrl =
              !post.image_url ||
              !post.image_url.startsWith("https://") ||
              post.image_url.includes("localhost") ||
              post.image_url.includes("ais-dev-") ||
              post.image_url.includes("ais-pre-");

            const candidates = candidateImages[post.id];
            const failedGen = failedImageDrafts[post.id];

            return (
              <div key={post.id} className="rounded-lg border border-border/60 bg-card p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold uppercase text-accent tracking-wider">
                      {getJyotirlinga(post.jyotirlinga_slug)?.name ||
                        (post.jyotirlinga_slug === "general"
                          ? "General Instagram Post"
                          : post.jyotirlinga_slug || "Instagram Post")}
                    </p>
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase flex items-center gap-1">
                      {postType === "carousel" ? (
                        <>
                          <Layers className="size-3" /> Carousel
                        </>
                      ) : postType === "reel" ? (
                        <>
                          <Video className="size-3" /> Reel
                        </>
                      ) : (
                        <>
                          <ImageIcon className="size-3" /> Single Image
                        </>
                      )}
                    </span>
                  </div>
                  <span className="rounded-full bg-border/50 px-2 py-0.5 text-[10px] text-muted-foreground uppercase font-medium">
                    {post.status}
                  </span>
                </div>

                {isEditing ? (
                  /* EDIT MODE */
                  <div className="mt-4 space-y-4">
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Edit Caption
                      </Label>
                      <textarea
                        value={editCaption}
                        onChange={(e) => setEditCaption(e.target.value)}
                        rows={8}
                        className="mt-1.5 w-full rounded-md border border-border/80 bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                        placeholder="Write or refine the Instagram caption..."
                      />
                    </div>

                    {post.image_url && (
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Current Image Preview (Pre-Edit)
                          </p>
                          <span className="text-[11px] text-muted-foreground italic">
                            Authoritative visual asset
                          </span>
                        </div>
                        <img
                          src={post.image_url}
                          alt={`${post.jyotirlinga_slug} preview`}
                          className="mt-1.5 max-h-48 rounded-md object-cover border border-border/40"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Edit Image Prompt
                        </Label>
                        <span className="text-[11px] text-muted-foreground italic">
                          Creative direction for AI image generation
                        </span>
                      </div>
                      <textarea
                        value={editImagePrompt}
                        onChange={(e) => setEditImagePrompt(e.target.value)}
                        rows={4}
                        className="mt-1.5 w-full rounded-md border border-border/80 bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                        placeholder="Describe the visual composition, lighting, and spiritual aesthetic..."
                      />
                      {editImagePrompt.trim() !== (post.image_prompt || "").trim() && (
                        <p className="mt-1 text-[11px] text-accent font-medium">
                          ⚡ Image Prompt modified — saving will persist edits and attempt to
                          generate a matching visual asset.
                        </p>
                      )}
                    </div>

                    {(() => {
                      const isPromptChanged =
                        editImagePrompt.trim() !== (post.image_prompt || "").trim();
                      return (
                        <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                          <Button
                            size="sm"
                            variant="hero"
                            onClick={() => onSaveEdit(post)}
                            disabled={savingId === post.id}
                          >
                            {savingId === post.id ? (
                              <RefreshCw className="mr-1.5 size-4 animate-spin" />
                            ) : (
                              <Save className="mr-1.5 size-4" />
                            )}
                            {savingId === post.id
                              ? isPromptChanged
                                ? "Saving & Generating Image..."
                                : "Saving Changes..."
                              : "Save Changes"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={onCancelEdit}
                            disabled={savingId === post.id}
                          >
                            <X className="mr-1.5 size-4" /> Cancel
                          </Button>
                          {post.status === "approved" && (
                            <span className="text-xs text-amber-500 font-medium ml-2">
                              Note: Saving changes will reset post status to pending approval.
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  /* VIEW / NORMAL MODE */
                  <>
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-muted-foreground">Caption:</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                        {post.caption}
                      </p>
                    </div>

                    {/* FAILED IMAGE GEN ALERT */}
                    {failedGen && (
                      <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-center justify-between">
                        <div>
                          <p className="font-semibold">
                            Changes saved, but new image could not be generated.
                          </p>
                          <p className="text-[11px] text-amber-400/80 mt-0.5">{failedGen}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-3 h-7 text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/20"
                          onClick={() => onRegenerateImage(post)}
                          disabled={regeneratingId === post.id}
                        >
                          {regeneratingId === post.id ? (
                            <RefreshCw className="mr-1 size-3 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-1 size-3" />
                          )}
                          Retry Image Generation
                        </Button>
                      </div>
                    )}

                    {/* CANDIDATE ORIGINAL VS NEW IMAGE SELECTION CARDS */}
                    {candidates && candidates.original && candidates.generated ? (
                      <div className="mt-4 rounded-lg border border-border/80 bg-background/50 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                            Select Authoritative Visual Asset
                          </p>
                          <span className="text-[11px] text-muted-foreground italic">
                            Choose between original & new generated images
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          {/* ORIGINAL IMAGE CARD */}
                          <div
                            className={`rounded-md border p-2.5 flex flex-col justify-between ${
                              post.image_url === candidates.original
                                ? "border-accent bg-accent/10 ring-1 ring-accent"
                                : "border-border/60 bg-card"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-semibold text-foreground">
                                  Original Image
                                </span>
                                {post.image_url === candidates.original && (
                                  <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent flex items-center gap-1">
                                    <Check className="size-3" /> Active
                                  </span>
                                )}
                              </div>
                              <img
                                src={candidates.original}
                                alt="Original asset"
                                className="w-full h-36 rounded object-cover border border-border/40"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <Button
                              size="sm"
                              variant={post.image_url === candidates.original ? "hero" : "outline"}
                              className="mt-2.5 w-full text-xs h-8"
                              onClick={() => onSetImage(post.id, candidates.original)}
                              disabled={
                                settingImageId === post.id || post.image_url === candidates.original
                              }
                            >
                              {post.image_url === candidates.original ? (
                                <>
                                  <Check className="mr-1.5 size-3.5" /> In Use (Authoritative)
                                </>
                              ) : (
                                "Use Original Image"
                              )}
                            </Button>
                          </div>

                          {/* NEW GENERATED IMAGE CARD */}
                          <div
                            className={`rounded-md border p-2.5 flex flex-col justify-between ${
                              post.image_url === candidates.generated
                                ? "border-accent bg-accent/10 ring-1 ring-accent"
                                : "border-border/60 bg-card"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-semibold text-foreground">
                                  New Generated Image
                                </span>
                                {post.image_url === candidates.generated && (
                                  <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent flex items-center gap-1">
                                    <Check className="size-3" /> Active
                                  </span>
                                )}
                              </div>
                              <img
                                src={candidates.generated}
                                alt="New generated asset"
                                className="w-full h-36 rounded object-cover border border-border/40"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <Button
                              size="sm"
                              variant={post.image_url === candidates.generated ? "hero" : "outline"}
                              className="mt-2.5 w-full text-xs h-8"
                              onClick={() => onSetImage(post.id, candidates.generated)}
                              disabled={
                                settingImageId === post.id ||
                                post.image_url === candidates.generated
                              }
                            >
                              {post.image_url === candidates.generated ? (
                                <>
                                  <Check className="mr-1.5 size-3.5" /> In Use (Authoritative)
                                </>
                              ) : (
                                "Use New Image"
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : /* MULTI-MEDIA / CAROUSEL / REEL / SINGLE IMAGE PREVIEW */
                    post.media && post.media.length > 0 ? (
                      <div className="mt-3">
                        <p className="text-sm font-semibold text-muted-foreground">
                          Media Assets ({post.media.length}):
                        </p>
                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {post.media.map((m, idx) => (
                            <div
                              key={m.id || idx}
                              className="relative rounded overflow-hidden border border-border/60 bg-black"
                            >
                              {m.media_type === "video" ? (
                                <video
                                  src={m.public_url}
                                  className="h-28 w-full object-cover"
                                  controls
                                />
                              ) : (
                                <img
                                  src={m.public_url}
                                  alt={`Asset ${idx + 1}`}
                                  className="h-28 w-full object-cover"
                                />
                              )}
                              <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                #{idx + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      post.image_url && (
                        <div className="mt-3">
                          <p className="text-sm font-semibold text-muted-foreground">
                            Image Preview:
                          </p>
                          <img
                            src={post.image_url}
                            alt={`${post.jyotirlinga_slug} preview`}
                            className="mt-1 max-h-48 rounded-md object-cover border border-border/40"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )
                    )}

                    {post.image_prompt && (
                      <div className="mt-3">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-muted-foreground">
                            Image Prompt:
                          </p>
                          <span className="text-[11px] text-muted-foreground italic">
                            (Creative direction)
                          </span>
                        </div>
                        <p className="mt-1 text-xs italic text-muted-foreground/90">
                          {post.image_prompt}
                        </p>
                      </div>
                    )}

                    {/* ACTIONS FOR PENDING APPROVAL */}
                    {post.status === "pending_approval" && (
                      <div className="mt-4 flex flex-wrap gap-2 items-center">
                        <Button size="sm" variant="hero" onClick={() => onApprove(post.id)}>
                          <Check className="mr-1.5 size-4" /> Approve for Publishing
                        </Button>

                        {/* If manual post with media, edit using CreateInstagramPostDialog */}
                        {post.post_type || (post.media && post.media.length > 0) ? (
                          <CreateInstagramPostDialog
                            postToEdit={post}
                            onSuccess={() => qc.invalidateQueries({ queryKey: ["social-posts"] })}
                            trigger={
                              <Button size="sm" variant="outline">
                                <Edit3 className="mr-1.5 size-4" /> Edit Post
                              </Button>
                            }
                          />
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => onStartEdit(post)}>
                            <Edit3 className="mr-1.5 size-4" /> Edit Draft
                          </Button>
                        )}

                        {!post.post_type && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onRegenerateImage(post)}
                            disabled={regeneratingId === post.id}
                          >
                            {regeneratingId === post.id ? (
                              <RefreshCw className="mr-1.5 size-4 animate-spin" />
                            ) : (
                              <ImageIcon className="mr-1.5 size-4" />
                            )}
                            {regeneratingId === post.id ? "Regenerating..." : "Regenerate Image"}
                          </Button>
                        )}
                      </div>
                    )}

                    {/* ACTIONS FOR APPROVED */}
                    {post.status === "approved" && (
                      <div className="mt-4 space-y-2">
                        <div className="flex flex-wrap gap-2 items-center">
                          <Button
                            size="sm"
                            variant="hero"
                            onClick={() => onPublish(post)}
                            disabled={publishingId === post.id || isNonProductionImageUrl}
                          >
                            {publishingId === post.id ? (
                              <RefreshCw className="mr-1.5 size-4 animate-spin" />
                            ) : (
                              <Send className="mr-1.5 size-4" />
                            )}
                            {publishingId === post.id ? "Publishing..." : "Publish to Instagram"}
                          </Button>
                          {post.post_type || (post.media && post.media.length > 0) ? (
                            <CreateInstagramPostDialog
                              postToEdit={post}
                              onSuccess={() => qc.invalidateQueries({ queryKey: ["social-posts"] })}
                              trigger={
                                <Button size="sm" variant="outline">
                                  <Edit3 className="mr-1.5 size-4" /> Edit Post
                                </Button>
                              }
                            />
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => onStartEdit(post)}>
                              <Edit3 className="mr-1.5 size-4" /> Edit Draft
                            </Button>
                          )}

                          {!post.post_type && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onRegenerateImage(post)}
                              disabled={regeneratingId === post.id}
                            >
                              {regeneratingId === post.id ? (
                                <RefreshCw className="mr-1.5 size-4 animate-spin" />
                              ) : (
                                <ImageIcon className="mr-1.5 size-4" />
                              )}
                              {regeneratingId === post.id ? "Regenerating..." : "Regenerate Image"}
                            </Button>
                          )}
                        </div>
                        {isNonProductionImageUrl && (
                          <p className="text-xs text-amber-500 font-medium">
                            Instagram publishing requires a stable public production image URL.
                          </p>
                        )}
                      </div>
                    )}

                    {/* LOCKED HISTORICAL VIEW FOR PUBLISHED */}
                    {post.status === "published" && (
                      <div className="mt-4 rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400 space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
                          <Check className="size-4 text-emerald-400" /> Published to Instagram
                        </div>
                        {post.instagram_media_id && (
                          <p className="text-muted-foreground">
                            <span className="text-foreground/80 font-medium">
                              Instagram Media ID:
                            </span>{" "}
                            {post.instagram_media_id}
                          </p>
                        )}
                        {post.published_at && (
                          <p className="text-muted-foreground">
                            <span className="text-foreground/80 font-medium">Published At:</span>{" "}
                            {new Date(post.published_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function StoryList({ stories, act, title, emptyMessage }: any) {
  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg text-foreground">
        {title} ({stories.length})
      </h3>
      {stories.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        stories.map((s: any) => (
          <div key={s.id} className="rounded-lg border border-border/60 bg-card p-4">
            <p className="text-xs text-accent">{getJyotirlinga(s.slug)?.name ?? s.slug}</p>
            <h3 className="font-display text-lg text-foreground">{s.title}</h3>
            <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{s.body}</p>
            <p className="mt-2 text-xs text-muted-foreground">— {s.author_name}</p>
            {s.status === "pending" && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="hero" onClick={() => act("story", s.id, "approve")}>
                  <Check className="size-4" /> Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => act("story", s.id, "reject")}>
                  <X className="size-4" /> Reject
                </Button>
              </div>
            )}
            {s.status === "approved" && (
              <div className="mt-3">
                <Button size="sm" variant="outline" onClick={() => act("story", s.id, "reject")}>
                  <X className="size-4" /> Move to Rejected
                </Button>
              </div>
            )}
            {s.status === "rejected" && (
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
      )}
    </div>
  );
}

function GalleryList({ gallery, act, title, emptyMessage }: any) {
  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg text-foreground">
        {title} ({gallery.length})
      </h3>
      {gallery.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
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
                {g.status === "pending" && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="hero"
                      onClick={() => act("gallery", g.id, "approve")}
                    >
                      <Check className="size-4" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => act("gallery", g.id, "reject")}
                    >
                      <X className="size-4" /> Reject
                    </Button>
                  </div>
                )}
                {g.status === "approved" && (
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => act("gallery", g.id, "reject")}
                    >
                      <X className="size-4" /> Move to Rejected
                    </Button>
                  </div>
                )}
                {g.status === "rejected" && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="hero"
                      onClick={() => act("gallery", g.id, "approve")}
                    >
                      <Check className="size-4" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => act("gallery", g.id, "pending")}
                    >
                      <RefreshCw className="size-4 mr-1" /> Re-queue
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
