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
} from "lucide-react";
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
import { AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Manage submissions — 12 Jyotirlinga Darshan" }] }),
  component: AdminPage,
});

function AdminPage() {
  const rolesFn = useServerFn(getMyRoles);
  const queueFn = useServerFn(getModerationQueue);
  const moderateFn = useServerFn(moderate);
  const bootstrapFn = useServerFn(bootstrapAdmin);
  const qc = useQueryClient();

  const roles = useQuery({ queryKey: ["my-roles"], queryFn: () => rolesFn() });
  const isAdmin = roles.data?.roles.includes("admin");

  const queue = useQuery({
    queryKey: ["moderation"],
    queryFn: () => queueFn(),
    enabled: !!isAdmin,
  });

  async function act(type: "gallery" | "story", id: string, action: "approve" | "reject") {
    try {
      await moderateFn({ data: { type, id, action } });
      toast.success(action === "approve" ? "Approved." : "Removed.");
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl text-foreground">Admin</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage live darshan streams and approve devotee submissions.
      </p>

      <ChannelAutoRefreshManager />
      <RefreshLogViewer />
      <DarshanLinkManager />

      <section className="mt-12">
        <h2 className="font-display text-xl text-foreground">
          Pending photos ({queue.data?.gallery.length ?? 0})
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {queue.data?.gallery.map((g) => (
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
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="hero" onClick={() => act("gallery", g.id, "approve")}>
                    <Check className="size-4" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => act("gallery", g.id, "reject")}
                  >
                    <X className="size-4" /> Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {queue.data && queue.data.gallery.length === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">No pending photos.</p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-foreground">
          Pending stories ({queue.data?.stories.length ?? 0})
        </h2>
        <div className="mt-4 space-y-4">
          {queue.data?.stories.map((s) => (
            <div key={s.id} className="rounded-lg border border-border/60 bg-card p-4">
              <p className="text-xs text-accent">{getJyotirlinga(s.slug)?.name ?? s.slug}</p>
              <h3 className="font-display text-lg text-foreground">{s.title}</h3>
              <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{s.body}</p>
              <p className="mt-2 text-xs text-muted-foreground">— {s.author_name}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="hero" onClick={() => act("story", s.id, "approve")}>
                  <Check className="size-4" /> Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => act("story", s.id, "reject")}>
                  <X className="size-4" /> Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
        {queue.data && queue.data.stories.length === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">No pending stories.</p>
        )}
      </section>
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
