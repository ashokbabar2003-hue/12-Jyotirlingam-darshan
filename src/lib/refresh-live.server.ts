// Server-only helper: scans configured YouTube channels for an active live stream
// and updates `darshan_links` for each shrine. On any failure, the existing
// live link is left untouched.

import { validateYoutubeUrl } from "@/lib/youtube";

export interface RefreshOutcome {
  slug: string;
  channelUrl: string;
  status: "updated" | "unchanged" | "no_live" | "error";
  message?: string;
  videoId?: string | null;
  previousUrl?: string | null;
  newUrl?: string | null;
  checkedAt?: string;
}

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;
const CHANNEL_ID_RE = /^UC[A-Za-z0-9_-]{22}$/;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "user-agent": UA,
        "accept-language": "en-US,en;q=0.9",
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export function extractCanonicalVideoId(html: string): string | null {
  // <link rel="canonical" href="https://www.youtube.com/watch?v=XXXXX">
  const canon = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i);
  if (canon) {
    try {
      const u = new URL(canon[1]);
      const v = u.searchParams.get("v");
      if (v && VIDEO_ID_RE.test(v)) return v;
      // /live/XXXXX or /embed/XXXXX in canonical
      const m = u.pathname.match(/\/(?:live|embed|shorts)\/([A-Za-z0-9_-]{11})/);
      if (m) return m[1];
    } catch {
      /* ignore */
    }
  }
  // og:url meta tag
  const og = html.match(/<meta[^>]+property="og:url"[^>]+content="([^"]+)"/i);
  if (og) {
    try {
      const u = new URL(og[1]);
      const v = u.searchParams.get("v");
      if (v && VIDEO_ID_RE.test(v)) return v;
    } catch {
      /* ignore */
    }
  }
  return null;
}

export function extractChannelId(html: string): string | null {
  // Try several places channel IDs appear in YouTube HTML.
  const patterns = [
    /"channelId":"(UC[A-Za-z0-9_-]{22})"/,
    /"externalChannelId":"(UC[A-Za-z0-9_-]{22})"/,
    /<meta[^>]+itemprop="channelId"[^>]+content="(UC[A-Za-z0-9_-]{22})"/i,
    /<link[^>]+rel="canonical"[^>]+href="https?:\/\/www\.youtube\.com\/channel\/(UC[A-Za-z0-9_-]{22})/i,
    /"browseId":"(UC[A-Za-z0-9_-]{22})"/,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m && CHANNEL_ID_RE.test(m[1])) return m[1];
  }
  return null;
}

/**
 * Look at all 11-char videoIds in the HTML and return the first one whose
 * surrounding JSON window suggests it's currently live (badge "LIVE", "isLive":true,
 * "isLiveNow":true, watching-now counter, etc.).
 */
export function findLiveVideoIdInHtml(html: string): string | null {
  const cands = findLiveCandidatesInHtml(html);
  return cands.length > 0 ? cands[0].id : null;
}

export interface LiveCandidate {
  id: string;
  title: string;
  channelId?: string | null;
}

/**
 * Return every videoId on the page whose surrounding JSON window suggests
 * it's currently live, along with the best-effort title we can pull from
 * that same window.
 */
export function findLiveCandidatesInHtml(html: string): LiveCandidate[] {
  const idRe = /"videoId":"([A-Za-z0-9_-]{11})"/g;
  const seen = new Set<string>();
  const out: LiveCandidate[] = [];
  const liveSignals = [
    /"style":"LIVE"/,
    /"label":"LIVE"/,
    /BADGE_STYLE_TYPE_LIVE_NOW/,
    /"isLive":true/,
    /"isLiveNow":true/,
    /"text":"LIVE"/,
    /watching now/i,
  ];
  let match: RegExpExecArray | null;
  while ((match = idRe.exec(html)) !== null) {
    const id = match[1];
    if (seen.has(id)) continue;
    const signalWindow = html.slice(match.index, match.index + 4000);
    if (!liveSignals.some((re) => re.test(signalWindow))) continue;

    // Tight centered window for title extraction to avoid cross-talk
    const sliceStart = Math.max(0, match.index - 1500);
    const detailWindow = html.slice(sliceStart, Math.min(html.length, match.index + 2000));
    const videoIdOffset = match.index - sliceStart;

    seen.add(id);
    out.push({
      id,
      title: extractTitleFromWindow(detailWindow, videoIdOffset),
      channelId: extractCandidateChannelId(detailWindow),
    });
  }
  return out;
}

function extractCandidateChannelId(window: string): string | null {
  const patterns = [
    /"channelId":"(UC[A-Za-z0-9_-]{22})"/,
    /"browseId":"(UC[A-Za-z0-9_-]{22})"/,
    /"externalChannelId":"(UC[A-Za-z0-9_-]{22})"/,
  ];
  for (const re of patterns) {
    const m = window.match(re);
    if (m && CHANNEL_ID_RE.test(m[1])) return m[1];
  }
  return null;
}

function extractPrimaryLiveCandidate(html: string): LiveCandidate | null {
  const start = html.indexOf('"videoDetails":{');
  if (start >= 0) {
    const detailWindow = html.slice(start, start + 20000);
    // Ensure videoId is a direct property of videoDetails by searching only the first 200 characters
    const id = detailWindow.slice(0, 200).match(/"videoId":"([A-Za-z0-9_-]{11})"/)?.[1] ?? null;
    const channelId = extractCandidateChannelId(detailWindow);
    const isLive = /"isLive":true/.test(detailWindow) || /"isLiveContent":true/.test(detailWindow);
    if (id && VIDEO_ID_RE.test(id) && isLive) {
      return { id, title: extractTitleFromWindow(detailWindow), channelId };
    }
  }

  // Some YouTube responses do not expose videoDetails in the HTML, but the
  // /live page still declares the current video in its canonical URL. In that
  // case only use the canonical ID itself, never every LIVE-looking video from
  // recommendations on the page.
  if (!pageLooksLive(html)) return null;
  const canon = extractCanonicalVideoId(html);
  if (canon) {
    const match = findLiveCandidatesInHtml(html).find((c) => c.id === canon);
    return {
      id: canon,
      title: match?.title ?? extractTitleFromWindow(html.slice(0, 12000)),
      channelId: match?.channelId ?? extractChannelId(html),
    };
  }

  // Fallback if canonical URL is missing/undefined/unparseable but the page looks live and we found candidates
  const candidates = findLiveCandidatesInHtml(html);
  if (candidates.length > 0) {
    return candidates[0];
  }

  return null;
}

function extractTitleFromWindow(window: string, videoIdOffset: number = -1): string {
  // Try common YouTube JSON title shapes near the videoId.
  const patterns = [
    /"title":\s*\{\s*"runs":\s*\[\s*\{\s*"text":"((?:[^"\\]|\\.)*)"/g,
    /"title":\s*\{\s*"simpleText":"((?:[^"\\]|\\.)*)"/g,
    /"title":"((?:[^"\\]|\\.)*)"/g,
    /"headline":\s*\{\s*"simpleText":"((?:[^"\\]|\\.)*)"/g,
  ];

  if (videoIdOffset < 0) {
    for (const re of patterns) {
      const simpleRe = new RegExp(re.source);
      const m = window.match(simpleRe);
      if (m && m[1]) {
        try {
          return JSON.parse(`"${m[1]}"`);
        } catch {
          return m[1];
        }
      }
    }
    return "";
  }

  let bestTitle = "";
  let bestDist = Infinity;

  for (const re of patterns) {
    let match: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((match = re.exec(window)) !== null) {
      const titleStr = match[1];
      if (!titleStr) continue;

      const matchCenter = match.index + match[0].length / 2;
      const dist = Math.abs(matchCenter - videoIdOffset);
      if (dist < bestDist) {
        bestDist = dist;
        try {
          bestTitle = JSON.parse(`"${titleStr}"`);
        } catch {
          bestTitle = titleStr;
        }
      }
    }
  }

  return bestTitle;
}

/**
 * Score a candidate's title against shrine hints. Higher is better, 0 means
 * nothing matched. Matches whole words, case-insensitive, and tolerates
 * Devanagari/Tamil/etc. by also checking raw substring.
 */
export function scoreLiveCandidate(title: string, hints: string[]): number {
  if (!title) return 0;
  const lower = title.toLowerCase();
  let score = 0;
  for (const hint of hints) {
    const h = hint.trim();
    if (!h) continue;
    const hl = h.toLowerCase();
    if (lower.includes(hl)) {
      // Longer hints (shrine names) are more discriminating than generic keywords.
      score += hl.length >= 6 ? 10 : 3;
    }
  }
  return score;
}

const DARSHAN_KEYWORDS = [
  "darshan",
  "darshana",
  "puja",
  "pooja",
  "aarti",
  "arati",
  "abhishek",
  "live",
];
const WEAK_HINT_SET = new Set(DARSHAN_KEYWORDS.map((k) => k.toLowerCase()));

/** A "specific" hint is one that identifies the shrine (name / long token),
 * not a generic devotional word. Used to avoid mixing unrelated live streams
 * into the wrong shrine when a channel broadcasts many different things. */
function isSpecificHint(hint: string): boolean {
  const hl = hint.trim().toLowerCase();
  if (!hl) return false;
  if (WEAK_HINT_SET.has(hl)) return false;
  return hl.length >= 4;
}

export function hasSpecificHintMatch(title: string, hints: string[]): boolean {
  if (!title) return false;
  const lower = title.toLowerCase();
  for (const h of hints) {
    if (!isSpecificHint(h)) continue;
    const hl = h.trim().toLowerCase();
    if (lower.includes(hl)) return true;
    // Multi-word hints (e.g. "Mahakaleshwar Jyotirlinga") match when any
    // standalone token of length >= 4 appears in the title.
    for (const token of hl.split(/[^a-z0-9\u00C0-\uFFFF]+/)) {
      if (token.length >= 4 && !WEAK_HINT_SET.has(token) && lower.includes(token)) return true;
    }
  }
  return false;
}

/** True when the channel URL's handle/path already identifies the shrine
 * (e.g. @KedarnathLiveDarshanOfficial for kedarnath). When true, the channel
 * is trusted and its first live stream is used without title-scoring. */
export function channelHandleMatchesHints(channelUrl: string, hints: string[]): boolean {
  let path = "";
  try {
    const u = new URL(channelUrl.trim());
    if (!u.hostname.replace(/^www\./, "").endsWith("youtube.com")) return false;
    path = u.pathname.toLowerCase().replace(/[^a-z0-9]/g, "");
  } catch {
    return false;
  }
  if (!path) return false;
  for (const h of hints) {
    if (!isSpecificHint(h)) continue;
    const token = h
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    if (token.length >= 4 && path.includes(token)) return true;
  }
  return false;
}

export function pageLooksLive(html: string): boolean {
  return (
    /"isLiveContent":true/.test(html) ||
    /"isLive":true/.test(html) ||
    /"isLiveNow":true/.test(html) ||
    /"liveBroadcastDetails"/.test(html) ||
    /BADGE_STYLE_TYPE_LIVE_NOW/.test(html) ||
    /"label":"LIVE"/.test(html) ||
    /watching now/i.test(html)
  );
}

async function isEmbeddableLive(videoId: string): Promise<boolean> {
  const oembed = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  try {
    const r = await fetch(oembed, { method: "GET", headers: { "user-agent": UA } });
    if (!r.ok) return false;
    const body = await r.json().catch(() => null);
    return !!(body && typeof body === "object");
  } catch {
    return false;
  }
}

/**
 * Normalize a user-pasted YouTube channel URL into a set of candidate pages to
 * probe for the current live stream.
 */
export function buildCandidatePages(channelUrl: string): {
  bases: string[];
  directVideoId: string | null;
  channelId: string | null;
} {
  let directVideoId: string | null = null;
  let channelId: string | null = null;
  const bases: string[] = [];

  const direct = validateYoutubeUrl(channelUrl);
  if (direct.ok && direct.videoId && VIDEO_ID_RE.test(direct.videoId)) {
    directVideoId = direct.videoId;
  }

  try {
    const u = new URL(channelUrl.trim());
    const host = u.hostname.replace(/^www\./, "");
    if (host.endsWith("youtube.com")) {
      const path = u.pathname.replace(/\/(live|streams|videos|featured)\/?$/, "");
      const m = path.match(/^\/channel\/(UC[A-Za-z0-9_-]{22})/);
      if (m) channelId = m[1];

      if (
        path.startsWith("/@") ||
        path.startsWith("/channel/") ||
        path.startsWith("/c/") ||
        path.startsWith("/user/")
      ) {
        const base = `https://www.youtube.com${path.replace(/\/$/, "")}`;
        bases.push(base);
      }
    }
  } catch {
    /* ignore */
  }

  return { bases, directVideoId, channelId };
}

export type HtmlFetcher = (url: string) => Promise<string | null>;

/**
 * Find the active live videoId for a channel URL. When `hints` is provided
 * (e.g. shrine name + "darshan"/"aarti"/"puja"), all live candidates across
 * /live, /streams and the channel home are scored against the hints and the
 * best match wins. Without hints, returns the first live candidate found
 * (preserves the simple legacy behaviour).
 */
export async function resolveLiveVideoId(
  channelUrl: string,
  fetcher: HtmlFetcher = fetchHtml,
  hints: string[] = [],
): Promise<string | null> {
  const { bases, directVideoId, channelId: initialChannelId } = buildCandidatePages(channelUrl);
  let channelId = initialChannelId;

  if (directVideoId) return directVideoId;

  const useScoring = hints.length > 0;
  const allCandidates: LiveCandidate[] = [];
  const seen = new Set<string>();
  const collect = (cands: LiveCandidate[]) => {
    for (const c of cands) {
      if (channelId && c.channelId && c.channelId !== channelId) continue;
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      allCandidates.push(c);
    }
  };

  const pickBest = (): string | null => {
    if (allCandidates.length === 0) return null;
    if (!useScoring) return allCandidates[0].id;
    let best: { id: string; title: string; score: number } | null = null;
    for (const c of allCandidates) {
      const s = scoreLiveCandidate(c.title, hints);
      if (!best || s > best.score) best = { id: c.id, title: c.title, score: s };
    }
    // Require the winning title to actually contain a shrine-specific hint
    // (name / long token) — not just a generic devotional word. This prevents
    // an unrelated "Live Darshan" from a multi-topic channel getting glued
    // onto the wrong shrine.
    if (!best || best.score <= 0) return null;
    if (!hasSpecificHintMatch(best.title, hints)) return null;
    return best.id;
  };

  // 1) /live — single canonical live video; trust it only when no scoring,
  // otherwise collect into the candidate pool and decide at the end.
  for (const base of bases) {
    const html = await fetcher(`${base}/live`);
    if (!html) continue;
    if (!channelId) {
      const cid = extractChannelId(html);
      if (cid) channelId = cid;
    }
    const primary = extractPrimaryLiveCandidate(html);
    if (primary) {
      collect([primary]);
      if (!useScoring && allCandidates.length > 0) return allCandidates[0].id;

      if (useScoring) {
        const score = scoreLiveCandidate(primary.title, hints);
        if (score > 0 && hasSpecificHintMatch(primary.title, hints)) {
          return primary.id;
        }
      }
    }
  }

  // 2) /streams — current + upcoming live broadcasts.
  for (const base of bases) {
    const html = await fetcher(`${base}/streams`);
    if (!html) continue;
    if (!channelId) {
      const cid = extractChannelId(html);
      if (cid) channelId = cid;
    }
    collect(findLiveCandidatesInHtml(html));
    if (!useScoring && allCandidates.length > 0) return allCandidates[0].id;
  }

  // 3) Channel home.
  for (const base of bases) {
    const html = await fetcher(base);
    if (!html) continue;
    if (!channelId) {
      const cid = extractChannelId(html);
      if (cid) channelId = cid;
    }
    collect(findLiveCandidatesInHtml(html));
    if (!useScoring && allCandidates.length > 0) return allCandidates[0].id;
  }

  // 4) Fallback to /channel/UC.../live when only the channel ID resolved.
  if (allCandidates.length === 0 && channelId) {
    const html = await fetcher(`https://www.youtube.com/channel/${channelId}/live`);
    if (html && pageLooksLive(html)) {
      const primary = extractPrimaryLiveCandidate(html);
      if (primary) {
        collect([primary]);
        if (!useScoring && allCandidates.length > 0) return allCandidates[0].id;
        if (useScoring) {
          const score = scoreLiveCandidate(primary.title, hints);
          if (score > 0 && hasSpecificHintMatch(primary.title, hints)) {
            return primary.id;
          }
        }
      }
    }
  }

  return pickBest();
}

export { DARSHAN_KEYWORDS };

export interface PlanChannel {
  slug: string;
  channel_url: string;
  last_video_id?: string | null;
}

/**
 * Pure planner: takes channels + current links + per-shrine hints and resolves
 * the next live videoId for each shrine, enforcing anti-collision so a single
 * videoId never gets assigned to two shrines in one run. No DB writes, no
 * embeddable check — safe to call from tests with a mock fetcher.
 *
 * Both the manual "Refresh now" and the cron auto-refresh paths funnel into
 * this planner so they cannot diverge.
 */
export async function planRefresh(
  channels: PlanChannel[],
  currentBySlug: Map<string, string | null>,
  hintsBySlug: Map<string, string[]>,
  fetcher: HtmlFetcher = fetchHtml,
): Promise<RefreshOutcome[]> {
  const outcomes: RefreshOutcome[] = [];
  const claimedVideoIds = new Set<string>();

  for (const ch of channels) {
    const slug = ch.slug;
    const channelUrl = ch.channel_url;
    const previousUrl = currentBySlug.get(slug) ?? null;
    const checkedAt = new Date().toISOString();
    let outcome: RefreshOutcome = {
      slug,
      channelUrl,
      status: "no_live",
      previousUrl,
      newUrl: previousUrl,
      checkedAt,
    };
    try {
      const hints = hintsBySlug.get(slug) ?? DARSHAN_KEYWORDS;
      // Prefer a scored, shrine-name-matching stream so we never assign an
      // unrelated live from a multi-topic channel to the wrong shrine.
      let videoId = await resolveLiveVideoId(channelUrl, fetcher, hints);
      // If the channel handle itself clearly identifies this shrine (e.g.
      // @KedarnathLiveDarshanOfficial for kedarnath) and no scored candidate
      // won, fall back to its first active live stream — many temple
      // channels title streams in local scripts we can't reliably tokenize.
      if (!videoId && channelHandleMatchesHints(channelUrl, hints)) {
        videoId = await resolveLiveVideoId(channelUrl, fetcher, []);
      }
      if (!videoId) {
        outcome = {
          ...outcome,
          status: "no_live",
          message: "No active live stream matched this shrine — link unchanged.",
        };
      } else if (claimedVideoIds.has(videoId)) {
        outcome = {
          ...outcome,
          status: "no_live",
          message: `Video ${videoId} already assigned to another shrine this run; skipped.`,
          videoId,
        };
      } else {
        const newUrl = `https://www.youtube.com/watch?v=${videoId}`;
        claimedVideoIds.add(videoId);
        const same = previousUrl === newUrl;
        outcome = {
          ...outcome,
          status: same ? "unchanged" : "updated",
          videoId,
          newUrl,
          message: same ? "Live link still the same — no change." : undefined,
        };
      }
    } catch (e) {
      outcome = {
        ...outcome,
        status: "error",
        message: e instanceof Error ? e.message : String(e),
      };
    }
    outcomes.push(outcome);
  }

  return outcomes;
}

export function buildHintsFromCatalog(
  catalog: Array<{ slug: string; name: string; nameMr: string }>,
): Map<string, string[]> {
  const hintsBySlug = new Map<string, string[]>();
  for (const j of catalog) {
    const nameTokens = j.name
      .replace(/jyotirlinga|temple|mandir/gi, "")
      .split(/[^A-Za-z\u00C0-\uFFFF]+/)
      .filter((t: string) => t.length >= 4);
    hintsBySlug.set(j.slug, [j.name, j.nameMr, ...nameTokens, ...DARSHAN_KEYWORDS]);
  }
  return hintsBySlug;
}

export type RefreshSource = "cron" | "manual";

export async function refreshAllLiveStreams(
  source: RefreshSource = "manual",
): Promise<RefreshOutcome[]> {
  const startedAt = new Date();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: channels, error } = await supabaseAdmin
    .from("darshan_channels")
    .select("slug, channel_url, last_video_id");
  if (error) throw new Error(error.message);

  const { data: links } = await supabaseAdmin.from("darshan_links").select("slug, youtube_url");
  const currentBySlug = new Map((links ?? []).map((r) => [r.slug, r.youtube_url]));

  const { jyotirlingas } = await import("@/data/jyotirlingas");
  const hintsBySlug = buildHintsFromCatalog(jyotirlingas);

  // Single planner shared by manual + auto refresh so they cannot diverge.
  const planned = await planRefresh(channels ?? [], currentBySlug, hintsBySlug, fetchHtml);

  const outcomes: RefreshOutcome[] = [];
  for (const p of planned) {
    let outcome = p;
    const ch = (channels ?? []).find((c) => c.slug === p.slug);

    if (p.status === "updated" && p.videoId) {
      const ok = await isEmbeddableLive(p.videoId);
      if (!ok) {
        outcome = { ...p, status: "error", message: "Video found but not embeddable." };
      } else {
        const newUrl = `https://www.youtube.com/watch?v=${p.videoId}`;
        const { error: upErr } = await supabaseAdmin
          .from("darshan_links")
          .upsert(
            { slug: p.slug, youtube_url: newUrl, updated_at: new Date().toISOString() },
            { onConflict: "slug" },
          );
        if (upErr) outcome = { ...p, status: "error", message: upErr.message };
      }
    }

    try {
      await supabaseAdmin
        .from("darshan_channels")
        .update({
          last_checked: new Date().toISOString(),
          last_status: outcome.status + (outcome.message ? `: ${outcome.message}` : ""),
          last_video_id: outcome.videoId ?? ch?.last_video_id ?? null,
        })
        .eq("slug", p.slug);
    } catch {
      /* ignore */
    }
    outcomes.push(outcome);
  }

  // Persist an audit log row for this run so admins can review what
  // happened, when, and which video link replaced which shrine. Best-effort.
  try {
    const finishedAt = new Date();
    const tally = {
      updated: outcomes.filter((o) => o.status === "updated").length,
      unchanged: outcomes.filter((o) => o.status === "unchanged").length,
      no_live: outcomes.filter((o) => o.status === "no_live").length,
      errors: outcomes.filter((o) => o.status === "error").length,
    };
    await supabaseAdmin.from("darshan_refresh_logs").insert({
      started_at: startedAt.toISOString(),
      finished_at: finishedAt.toISOString(),
      source,
      total: outcomes.length,
      updated: tally.updated,
      unchanged: tally.unchanged,
      no_live: tally.no_live,
      errors: tally.errors,
      outcomes: outcomes.map((o) => ({
        slug: o.slug,
        status: o.status,
        videoId: o.videoId ?? null,
        previous_url: o.previousUrl ?? null,
        new_url: o.newUrl ?? (o.videoId ? `https://www.youtube.com/watch?v=${o.videoId}` : null),
        youtube_url: o.videoId ? `https://www.youtube.com/watch?v=${o.videoId}` : null,
        message: o.message ?? null,
        channelUrl: o.channelUrl,
        checked_at: o.checkedAt ?? new Date().toISOString(),
      })),
    });
  } catch {
    /* logging failure must never break refresh */
  }

  return outcomes;
}
