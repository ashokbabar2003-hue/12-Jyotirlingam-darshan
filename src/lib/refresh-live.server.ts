// Server-only helper: scans configured YouTube channels for an active live stream
// and updates `darshan_links` for each shrine. On any failure or when no live stream is active,
// the existing live link is left untouched.

import { validateYoutubeUrl } from "@/lib/youtube";
import { DEFAULT_CHANNELS } from "@/data/channels";

export { DEFAULT_CHANNELS };

export type TelemetryResultStatus =
  | "updated"
  | "unchanged"
  | "no_live"
  | "channel_not_found"
  | "channel_not_resolved"
  | "youtube_bot_interstitial"
  | "youtube_request_failed"
  | "youtube_rate_limited"
  | "database_update_failed"
  | "error";

export interface DiscoveryTelemetry {
  shrine: string;
  channelResolved: string | null;
  candidateCount: number;
  liveCandidateCount: number;
  selectedVideo: string | null;
  result: TelemetryResultStatus;
  reason: string;
}

export interface DetailedDiscoveryResult {
  videoId: string | null;
  channelResolved: string | null;
  candidateCount: number;
  liveCandidateCount: number;
  selectedVideo: string | null;
  reason: string;
}

export interface RefreshOutcome {
  slug: string;
  channelUrl: string;
  status: "updated" | "unchanged" | "no_live" | "error";
  message?: string;
  videoId?: string | null;
  previousUrl?: string | null;
  newUrl?: string | null;
  checkedAt?: string;
  telemetry?: DiscoveryTelemetry;
}

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;
const CHANNEL_ID_RE = /^UC[A-Za-z0-9_-]{22}$/;

// Primary crawler User-Agent to encourage clean server-rendered HTML
const CRAWLER_UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
// Fallback browser User-Agent when needed
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export interface FetchResponse {
  html: string | null;
  status: number;
  isBotInterstitial: boolean;
  isRateLimited: boolean;
  isNotFound: boolean;
  finalUrl?: string;
}

export async function fetchHtmlWithMeta(
  url: string,
  userAgent: string = CRAWLER_UA,
): Promise<FetchResponse> {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "user-agent": userAgent,
        "accept-language": "en-US,en;q=0.9,hi;q=0.8",
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(7000),
    });

    if (res.status === 404) {
      return {
        html: null,
        status: 404,
        isBotInterstitial: false,
        isRateLimited: false,
        isNotFound: true,
        finalUrl: res.url,
      };
    }

    if (res.status === 429) {
      return {
        html: null,
        status: 429,
        isBotInterstitial: false,
        isRateLimited: true,
        isNotFound: false,
        finalUrl: res.url,
      };
    }

    if (!res.ok) {
      return {
        html: null,
        status: res.status,
        isBotInterstitial: false,
        isRateLimited: false,
        isNotFound: false,
        finalUrl: res.url,
      };
    }

    const html = await res.text();

    const isBot =
      html.includes("Sign in to confirm you're not a bot") ||
      html.includes('"status":"LOGIN_REQUIRED"') ||
      html.includes('"reason":"LOGIN_REQUIRED"') ||
      html.includes("consent.youtube.com") ||
      html.includes("google.com/sorry/index");

    return {
      html,
      status: res.status,
      isBotInterstitial: isBot,
      isRateLimited: false,
      isNotFound: false,
      finalUrl: res.url,
    };
  } catch {
    return {
      html: null,
      status: 0,
      isBotInterstitial: false,
      isRateLimited: false,
      isNotFound: false,
    };
  }
}

async function fetchHtml(url: string): Promise<string | null> {
  const resp = await fetchHtmlWithMeta(url, CRAWLER_UA);
  if (resp.html && !resp.isBotInterstitial) return resp.html;
  if (resp.isBotInterstitial) {
    const retry = await fetchHtmlWithMeta(url, BROWSER_UA);
    if (retry.html && !retry.isBotInterstitial) return retry.html;
  }
  return resp.html;
}

export function extractCanonicalVideoId(html: string): string | null {
  const canon = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i);
  if (canon) {
    try {
      const u = new URL(canon[1]);
      const v = u.searchParams.get("v");
      if (v && VIDEO_ID_RE.test(v)) return v;
      const m = u.pathname.match(/\/(?:live|embed|shorts)\/([A-Za-z0-9_-]{11})/);
      if (m) return m[1];
    } catch {
      /* ignore */
    }
  }
  const og = html.match(/<meta[^>]+property="og:url"[^>]+content="([^"]+)"/i);
  if (og) {
    try {
      const u = new URL(og[1]);
      const v = u.searchParams.get("v");
      if (v && VIDEO_ID_RE.test(v)) return v;
      const m = u.pathname.match(/\/(?:live|embed|shorts)\/([A-Za-z0-9_-]{11})/);
      if (m) return m[1];
    } catch {
      /* ignore */
    }
  }
  const metaVid = html.match(/<meta[^>]+itemprop="videoId"[^>]+content="([A-Za-z0-9_-]{11})"/i);
  if (metaVid && VIDEO_ID_RE.test(metaVid[1])) {
    return metaVid[1];
  }
  return null;
}

export function extractChannelId(html: string): string | null {
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

export function extractTitleFromHtml(html: string): string {
  const og = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.[1];
  if (og && og.trim()) {
    return decodeHtmlEntities(og.trim());
  }
  const itemPropName = html.match(/<meta[^>]+itemprop="name"[^>]+content="([^"]+)"/i)?.[1];
  if (itemPropName && itemPropName.trim()) {
    return decodeHtmlEntities(itemPropName.trim());
  }
  const metaTitle = html.match(/<meta[^>]+name="title"[^>]+content="([^"]+)"/i)?.[1];
  if (metaTitle && metaTitle.trim()) {
    return decodeHtmlEntities(metaTitle.trim());
  }
  const titleTag = html.match(/<title>([^<]+)<\/title>/i)?.[1];
  if (titleTag) {
    return decodeHtmlEntities(titleTag.replace(/\s*-\s*YouTube\s*$/i, "").trim());
  }
  return "";
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

export interface LiveCandidate {
  id: string;
  title: string;
  channelId?: string | null;
}

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

    const sliceStart = Math.max(0, match.index - 1500);
    const detailWindow = html.slice(sliceStart, Math.min(html.length, match.index + 2000));
    const videoIdOffset = match.index - sliceStart;

    const title = extractTitleFromWindow(detailWindow, videoIdOffset) || extractTitleFromHtml(html);

    seen.add(id);
    out.push({
      id,
      title,
      channelId: extractCandidateChannelId(detailWindow),
    });
  }
  return out;
}

export function findLiveVideoIdInHtml(html: string): string | null {
  const cands = findLiveCandidatesInHtml(html);
  return cands.length > 0 ? cands[0].id : null;
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
    const id = detailWindow.slice(0, 200).match(/"videoId":"([A-Za-z0-9_-]{11})"/)?.[1] ?? null;
    const channelId = extractCandidateChannelId(detailWindow);
    const isLive = /"isLive":true/.test(detailWindow) || /"isLiveContent":true/.test(detailWindow);
    if (id && VIDEO_ID_RE.test(id) && isLive) {
      const windowTitle = extractTitleFromWindow(detailWindow);
      const pageTitle = extractTitleFromHtml(html);
      return {
        id,
        title: windowTitle || pageTitle,
        channelId,
      };
    }
  }

  if (pageLooksLive(html)) {
    const canon = extractCanonicalVideoId(html);
    if (canon) {
      const match = findLiveCandidatesInHtml(html).find((c) => c.id === canon);
      const htmlTitle = extractTitleFromHtml(html);
      const title =
        match?.title && match.title.length > 0
          ? match.title
          : htmlTitle || extractTitleFromWindow(html.slice(0, 12000));
      return {
        id: canon,
        title,
        channelId: match?.channelId ?? extractCandidateChannelId(html) ?? extractChannelId(html),
      };
    }

    const pageChannelId = extractChannelId(html);
    const candidates = findLiveCandidatesInHtml(html);
    for (const c of candidates) {
      if (pageChannelId && c.channelId && c.channelId !== pageChannelId) continue;
      return c;
    }
  }

  return null;
}

function extractTitleFromWindow(window: string, videoIdOffset: number = -1): string {
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

function isSpecificHint(hint: string): boolean {
  const hl = hint.trim().toLowerCase();
  if (!hl) return false;
  if (WEAK_HINT_SET.has(hl)) return false;
  return hl.length >= 4;
}

export function scoreLiveCandidate(title: string, hints: string[]): number {
  if (!title) return 0;
  const lower = title.toLowerCase();
  let score = 0;
  for (const hint of hints) {
    const h = hint.trim();
    if (!h) continue;
    const hl = h.toLowerCase();
    if (lower.includes(hl)) {
      score += hl.length >= 6 ? 10 : 3;
    }
  }
  return score;
}

export function hasSpecificHintMatch(title: string, hints: string[]): boolean {
  if (!title) return false;
  const lower = title.toLowerCase();
  for (const h of hints) {
    if (!isSpecificHint(h)) continue;
    const hl = h.trim().toLowerCase();
    if (lower.includes(hl)) return true;
    for (const token of hl.split(/[^a-z0-9\u00C0-\uFFFF]+/)) {
      if (token.length >= 4 && !WEAK_HINT_SET.has(token) && lower.includes(token)) return true;
    }
  }
  return false;
}

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

async function isEmbeddableLive(videoId: string): Promise<boolean> {
  const oembed = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  try {
    const r = await fetch(oembed, { method: "GET", headers: { "user-agent": CRAWLER_UA } });
    if (!r.ok) return false;
    const body = await r.json().catch(() => null);
    return !!(body && typeof body === "object");
  } catch {
    return false;
  }
}

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
 * Core discovery function: searches a channel's /live, /streams, and home pages
 * for an active livestream broadcast.
 */
export async function resolveLiveVideoIdDetails(
  channelUrl: string,
  fetcher: HtmlFetcher = fetchHtml,
  hints: string[] = [],
  shrineSlug: string = "",
): Promise<DetailedDiscoveryResult> {
  if (!channelUrl || !channelUrl.trim()) {
    return {
      videoId: null,
      channelResolved: null,
      candidateCount: 0,
      liveCandidateCount: 0,
      selectedVideo: null,
      reason:
        shrineSlug === "bhimashankar"
          ? "No official YouTube channel exists for Bhimashankar Devasthan"
          : "No channel URL configured for shrine",
    };
  }

  const { bases, directVideoId, channelId: initialChannelId } = buildCandidatePages(channelUrl);
  let channelId = initialChannelId;

  if (directVideoId) {
    return {
      videoId: directVideoId,
      channelResolved: channelId,
      candidateCount: 1,
      liveCandidateCount: 1,
      selectedVideo: directVideoId,
      reason: "Direct watch or embed video URL provided",
    };
  }

  if (bases.length === 0 && !channelId) {
    return {
      videoId: null,
      channelResolved: null,
      candidateCount: 0,
      liveCandidateCount: 0,
      selectedVideo: null,
      reason: "Invalid or unrecognized YouTube channel URL format",
    };
  }

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

  let totalLiveFound = 0;
  let hasBotInterstitial = false;
  let pageFetched = false;

  const probeUrl = async (url: string): Promise<string | null> => {
    const html = await fetcher(url);
    if (!html) return null;

    const isBot =
      html.includes("Sign in to confirm you're not a bot") ||
      html.includes('"status":"LOGIN_REQUIRED"') ||
      html.includes('"reason":"LOGIN_REQUIRED"') ||
      html.includes("consent.youtube.com") ||
      html.includes("google.com/sorry/index");

    if (isBot) {
      hasBotInterstitial = true;
      return null;
    }

    pageFetched = true;
    return html;
  };

  // 1) Probe /live (canonical active broadcast)
  for (const base of bases) {
    const html = await probeUrl(`${base}/live`);
    if (!html) continue;

    if (!channelId) {
      const cid = extractChannelId(html);
      if (cid) channelId = cid;
    }

    const primary = extractPrimaryLiveCandidate(html);
    if (primary) {
      totalLiveFound++;
      collect([primary]);

      if (hints.length > 0) {
        const score = scoreLiveCandidate(primary.title, hints);
        if (score > 0 && hasSpecificHintMatch(primary.title, hints)) {
          return {
            videoId: primary.id,
            channelResolved: channelId,
            candidateCount: allCandidates.length,
            liveCandidateCount: totalLiveFound,
            selectedVideo: primary.id,
            reason: `Canonical live stream matched shrine hints (score: ${score})`,
          };
        }
      }
    }
  }

  // 2) Probe /streams (current & upcoming live tab)
  for (const base of bases) {
    const html = await probeUrl(`${base}/streams`);
    if (!html) continue;

    if (!channelId) {
      const cid = extractChannelId(html);
      if (cid) channelId = cid;
    }

    const streamsCands = findLiveCandidatesInHtml(html);
    totalLiveFound += streamsCands.length;
    collect(streamsCands);
  }

  // 3) Probe channel home page
  for (const base of bases) {
    const html = await probeUrl(base);
    if (!html) continue;

    if (!channelId) {
      const cid = extractChannelId(html);
      if (cid) channelId = cid;
    }

    const homeCands = findLiveCandidatesInHtml(html);
    totalLiveFound += homeCands.length;
    collect(homeCands);
  }

  // 4) Fallback to /channel/UC.../live when channel ID is discovered
  if (allCandidates.length === 0 && channelId) {
    const html = await probeUrl(`https://www.youtube.com/channel/${channelId}/live`);
    if (html && pageLooksLive(html)) {
      const primary = extractPrimaryLiveCandidate(html);
      if (primary) {
        totalLiveFound++;
        collect([primary]);
      }
    }
  }

  // Determine outcome when no live candidates found
  if (allCandidates.length === 0) {
    if (hasBotInterstitial) {
      return {
        videoId: null,
        channelResolved: channelId,
        candidateCount: 0,
        liveCandidateCount: 0,
        selectedVideo: null,
        reason: "YouTube returned bot detection / LOGIN_REQUIRED interstitial shell",
      };
    }

    if (!pageFetched) {
      return {
        videoId: null,
        channelResolved: channelId,
        candidateCount: 0,
        liveCandidateCount: 0,
        selectedVideo: null,
        reason: "Channel returned 404 or is unreachable",
      };
    }

    return {
      videoId: null,
      channelResolved: channelId,
      candidateCount: 0,
      liveCandidateCount: 0,
      selectedVideo: null,
      reason: "Channel is valid and resolved, but no active live broadcast currently exists",
    };
  }

  // Select best candidate
  if (allCandidates.length === 1 && hints.length === 0) {
    const candidate = allCandidates[0];
    return {
      videoId: candidate.id,
      channelResolved: channelId,
      candidateCount: 1,
      liveCandidateCount: totalLiveFound,
      selectedVideo: candidate.id,
      reason: `Verified official live stream on channel: "${candidate.title.slice(0, 50)}"`,
    };
  }

  // If hints provided, score all candidates and pick highest scoring
  if (hints.length > 0) {
    let bestCandidate: { id: string; title: string; score: number } | null = null;
    for (const c of allCandidates) {
      const s = scoreLiveCandidate(c.title, hints);
      if (s > 0 && (!bestCandidate || s > bestCandidate.score)) {
        bestCandidate = { id: c.id, title: c.title, score: s };
      }
    }
    if (bestCandidate) {
      return {
        videoId: bestCandidate.id,
        channelResolved: channelId,
        candidateCount: allCandidates.length,
        liveCandidateCount: totalLiveFound,
        selectedVideo: bestCandidate.id,
        reason: `Matched candidate based on shrine hints (score: ${bestCandidate.score})`,
      };
    }

    if (!channelHandleMatchesHints(channelUrl, hints)) {
      return {
        videoId: null,
        channelResolved: channelId,
        candidateCount: allCandidates.length,
        liveCandidateCount: totalLiveFound,
        selectedVideo: null,
        reason:
          "Active live streams found on channel, but none matched the shrine's devotional hints",
      };
    }
  }

  const selected = allCandidates[0];
  return {
    videoId: selected.id,
    channelResolved: channelId,
    candidateCount: allCandidates.length,
    liveCandidateCount: totalLiveFound,
    selectedVideo: selected.id,
    reason: `Selected live candidate on channel: "${selected.title.slice(0, 50)}"`,
  };
}

export async function resolveLiveVideoId(
  channelUrl: string,
  fetcher: HtmlFetcher = fetchHtml,
  hints: string[] = [],
): Promise<string | null> {
  const res = await resolveLiveVideoIdDetails(channelUrl, fetcher, hints);
  return res.videoId;
}

export { DARSHAN_KEYWORDS };

export interface PlanChannel {
  slug: string;
  channel_url: string;
  last_video_id?: string | null;
}

export function buildHintsFromCatalog(
  catalog: Array<{ slug: string; name: string }>,
): Map<string, string[]> {
  const hintsBySlug = new Map<string, string[]>();
  for (const j of catalog) {
    const nameTokens = j.name
      .replace(/jyotirlinga|temple|mandir/gi, "")
      .split(/[^A-Za-z\u00C0-\uFFFF]+/)
      .filter((t: string) => t.length >= 4);
    hintsBySlug.set(j.slug, [j.name, ...nameTokens, ...DARSHAN_KEYWORDS]);
  }
  return hintsBySlug;
}

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
      const discovery = await resolveLiveVideoIdDetails(channelUrl, fetcher, hints, slug);
      const videoId = discovery.videoId;

      let resultStatus: TelemetryResultStatus = "no_live";

      if (!videoId) {
        const isError =
          discovery.reason.includes("404") ||
          discovery.reason.includes("unreachable") ||
          discovery.reason.includes("bot detection") ||
          discovery.reason.includes("Invalid");

        resultStatus = isError
          ? discovery.reason.includes("bot detection")
            ? "youtube_bot_interstitial"
            : discovery.reason.includes("404")
              ? "channel_not_found"
              : "error"
          : "no_live";

        outcome = {
          ...outcome,
          status: isError ? "error" : "no_live",
          newUrl: previousUrl,
          message: `${discovery.reason}. Previous link preserved.`,
        };
      } else if (claimedVideoIds.has(videoId)) {
        resultStatus = "no_live";
        outcome = {
          ...outcome,
          status: "no_live",
          newUrl: previousUrl,
          message: `Video ${videoId} already assigned to another shrine this run; previous link preserved.`,
          videoId,
        };
      } else {
        const newUrl = `https://www.youtube.com/watch?v=${videoId}`;
        claimedVideoIds.add(videoId);
        const same = previousUrl === newUrl;
        resultStatus = same ? "unchanged" : "updated";
        outcome = {
          ...outcome,
          status: same ? "unchanged" : "updated",
          videoId,
          newUrl,
          message: same
            ? "Live stream still the same — no change."
            : "New active live broadcast found and selected.",
        };
      }

      const telemetry: DiscoveryTelemetry = {
        shrine: slug,
        channelResolved: discovery.channelResolved,
        candidateCount: discovery.candidateCount,
        liveCandidateCount: discovery.liveCandidateCount,
        selectedVideo: discovery.selectedVideo,
        result: resultStatus,
        reason: discovery.reason,
      };
      outcome.telemetry = telemetry;
      console.log("[Darshan Discovery Telemetry]", telemetry);
    } catch (e) {
      outcome = {
        ...outcome,
        status: "error",
        newUrl: previousUrl,
        message: e instanceof Error ? e.message : String(e),
        telemetry: {
          shrine: slug,
          channelResolved: null,
          candidateCount: 0,
          liveCandidateCount: 0,
          selectedVideo: null,
          result: "error",
          reason: e instanceof Error ? e.message : String(e),
        },
      };
    }
    outcomes.push(outcome);
  }

  return outcomes;
}

export type RefreshSource = "cron" | "manual";

export async function refreshAllLiveStreams(
  source: RefreshSource = "manual",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient?: any,
): Promise<RefreshOutcome[]> {
  const res = await refreshAllLiveStreamsInternal(source, supabaseClient);
  return res.outcomes;
}

async function refreshAllLiveStreamsInternal(
  source: RefreshSource = "manual",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient?: any,
): Promise<{
  outcomes: RefreshOutcome[];
  logInserted: boolean;
  logError: string | null;
  startedAt: string;
  finishedAt: string;
}> {
  const startedAt = new Date();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const sb = supabaseClient ?? supabaseAdmin;

  // 1. Immediately create a refresh-run log record so a log is NEVER missing even if timeouts occur
  const logId = crypto.randomUUID();
  let logInserted = false;
  let logError: string | null = null;

  const initialPayload = {
    id: logId,
    started_at: startedAt.toISOString(),
    finished_at: startedAt.toISOString(),
    source,
    total: 0,
    updated: 0,
    unchanged: 0,
    no_live: 0,
    errors: 0,
    outcomes: [],
  };

  try {
    const { error: insertErr } = await sb.from("darshan_refresh_logs").insert(initialPayload);
    if (insertErr) {
      logError = insertErr.message;
      if (sb !== supabaseAdmin) {
        const { error: adminErr } = await supabaseAdmin
          .from("darshan_refresh_logs")
          .insert(initialPayload);
        if (!adminErr) {
          logInserted = true;
          logError = null;
        }
      }
    } else {
      logInserted = true;
    }
  } catch (initErr) {
    logError = initErr instanceof Error ? initErr.message : String(initErr);
    try {
      const { error: adminErr } = await supabaseAdmin
        .from("darshan_refresh_logs")
        .insert(initialPayload);
      if (!adminErr) {
        logInserted = true;
        logError = null;
      }
    } catch {
      /* ignore */
    }
  }

  let dbChannels: PlanChannel[] = [];
  const { data: channelsData, error: chanErr } = await sb
    .from("darshan_channels")
    .select("slug, channel_url, last_video_id");

  if (chanErr) {
    console.error("[Darshan Refresh Error]", {
      stage: "database",
      message: chanErr.message,
    });
    if (sb !== supabaseAdmin) {
      const { data: adminChan } = await supabaseAdmin
        .from("darshan_channels")
        .select("slug, channel_url, last_video_id");
      if (adminChan) dbChannels = adminChan;
    }
  } else if (channelsData) {
    dbChannels = channelsData;
  }

  const channelMap = new Map<string, PlanChannel>();
  for (const [slug, url] of Object.entries(DEFAULT_CHANNELS)) {
    channelMap.set(slug, { slug, channel_url: url });
  }
  for (const ch of dbChannels) {
    if (ch.channel_url !== undefined && ch.channel_url !== null) {
      channelMap.set(ch.slug, {
        slug: ch.slug,
        channel_url: ch.channel_url.trim(),
        last_video_id: ch.last_video_id,
      });
    }
  }
  const effectiveChannels = Array.from(channelMap.values());

  const { data: links } = await sb.from("darshan_links").select("slug, youtube_url");
  const currentBySlug = new Map(
    (links ?? []).map((r: { slug: string; youtube_url: string | null }) => [r.slug, r.youtube_url]),
  );

  const { jyotirlingas } = await import("@/data/jyotirlingas");
  const hintsBySlug = buildHintsFromCatalog(jyotirlingas);

  const outcomes: RefreshOutcome[] = [];

  const persistLog = async (finalOutcomes: RefreshOutcome[]) => {
    const tally = {
      updated: finalOutcomes.filter((o) => o.status === "updated").length,
      unchanged: finalOutcomes.filter((o) => o.status === "unchanged").length,
      no_live: finalOutcomes.filter((o) => o.status === "no_live").length,
      errors: finalOutcomes.filter((o) => o.status === "error").length,
    };
    const now = new Date().toISOString();
    const updatePayload = {
      finished_at: now,
      total: Math.max(finalOutcomes.length, effectiveChannels.length),
      updated: tally.updated,
      unchanged: tally.unchanged,
      no_live: tally.no_live,
      errors: tally.errors,
      outcomes: finalOutcomes.map((o) => ({
        slug: o.slug,
        status: o.status,
        videoId: o.videoId ?? null,
        previous_url: o.previousUrl ?? null,
        new_url: o.newUrl ?? null,
        youtube_url: o.videoId ? `https://www.youtube.com/watch?v=${o.videoId}` : null,
        message: o.message ?? null,
        channelUrl: o.channelUrl,
        checked_at: o.checkedAt ?? now,
        telemetry: o.telemetry ?? null,
      })),
    };

    try {
      let { error: updateErr } = await sb
        .from("darshan_refresh_logs")
        .update(updatePayload)
        .eq("id", logId);

      if (updateErr && sb !== supabaseAdmin) {
        const { error: adminErr } = await supabaseAdmin
          .from("darshan_refresh_logs")
          .update(updatePayload)
          .eq("id", logId);
        updateErr = adminErr;
      }

      if (updateErr) {
        const fullRow = {
          id: logId,
          started_at: startedAt.toISOString(),
          source,
          ...updatePayload,
        };
        const { error: upsertErr } = await supabaseAdmin
          .from("darshan_refresh_logs")
          .upsert(fullRow, { onConflict: "id" });
        if (!upsertErr) {
          logInserted = true;
          logError = null;
        } else {
          logError = upsertErr.message;
        }
      } else {
        logInserted = true;
        logError = null;
      }
    } catch (err) {
      logError = err instanceof Error ? err.message : String(err);
      try {
        const fullRow = {
          id: logId,
          started_at: startedAt.toISOString(),
          source,
          ...updatePayload,
        };
        await supabaseAdmin.from("darshan_refresh_logs").upsert(fullRow, { onConflict: "id" });
        logInserted = true;
        logError = null;
      } catch {
        /* ignore */
      }
    }
  };

  try {
    const planned = await planRefresh(effectiveChannels, currentBySlug, hintsBySlug, fetchHtml);

    for (const p of planned) {
      let outcome = p;
      const ch = effectiveChannels.find((c) => c.slug === p.slug);

      try {
        if (p.status === "updated" && p.videoId) {
          const ok = await isEmbeddableLive(p.videoId);
          if (!ok) {
            outcome = {
              ...p,
              status: "error",
              newUrl: p.previousUrl,
              message: "Video found but not embeddable. Previous link kept.",
            };
          } else {
            const newUrl = `https://www.youtube.com/watch?v=${p.videoId}`;
            let { data: updatedRows, error: upErr } = await sb
              .from("darshan_links")
              .upsert(
                { slug: p.slug, youtube_url: newUrl, updated_at: new Date().toISOString() },
                { onConflict: "slug" },
              )
              .select("slug, youtube_url");

            if (upErr && sb !== supabaseAdmin) {
              const adminRes = await supabaseAdmin
                .from("darshan_links")
                .upsert(
                  { slug: p.slug, youtube_url: newUrl, updated_at: new Date().toISOString() },
                  { onConflict: "slug" },
                )
                .select("slug, youtube_url");
              updatedRows = adminRes.data;
              upErr = adminRes.error;
            }

            const rowsAffected = updatedRows?.length ?? 0;
            if (upErr || rowsAffected === 0) {
              console.error("[Darshan Link Update Error]", {
                shrine: p.slug,
                targetFound: false,
                rowsAffected,
                result: "database_update_failed",
                error: upErr?.message,
              });
              outcome = {
                ...p,
                status: "error",
                newUrl: p.previousUrl,
                message:
                  upErr?.message || "Database update affected 0 rows (no target row or RLS denied)",
              };
            } else {
              console.log("[Darshan Link Update]", {
                shrine: p.slug,
                targetFound: true,
                targetRowType: "primary",
                previousVideoIdPresent: Boolean(p.previousUrl),
                newVideoIdPresent: true,
                rowsAffected,
                result: "updated",
              });
            }
          }
        } else if (p.status === "unchanged") {
          console.log("[Darshan Link Unchanged]", {
            shrine: p.slug,
            targetFound: true,
            targetRowType: "primary",
            currentVideoIdPresent: Boolean(p.videoId),
            result: "unchanged",
          });
        } else {
          console.log("[Darshan Link Preserved]", {
            shrine: p.slug,
            status: p.status,
            preservedUrl: p.previousUrl,
            reason: p.telemetry?.reason,
          });
        }
      } catch (shrineDbErr) {
        const errorMsg = shrineDbErr instanceof Error ? shrineDbErr.message : String(shrineDbErr);
        console.error("[Darshan Link Update Exception]", {
          shrine: p.slug,
          error: errorMsg,
        });
        outcome = {
          ...p,
          status: "error",
          newUrl: p.previousUrl,
          message: `Database update exception: ${errorMsg}`,
        };
      }

      try {
        const { error: chanErr } = await sb.from("darshan_channels").upsert(
          {
            slug: p.slug,
            channel_url: p.channelUrl,
            last_checked: new Date().toISOString(),
            last_status: outcome.status + (outcome.message ? `: ${outcome.message}` : ""),
            last_video_id: outcome.videoId ?? ch?.last_video_id ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "slug" },
        );
        if (chanErr && sb !== supabaseAdmin) {
          await supabaseAdmin.from("darshan_channels").upsert(
            {
              slug: p.slug,
              channel_url: p.channelUrl,
              last_checked: new Date().toISOString(),
              last_status: outcome.status + (outcome.message ? `: ${outcome.message}` : ""),
              last_video_id: outcome.videoId ?? ch?.last_video_id ?? null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "slug" },
          );
        }
      } catch {
        /* ignore channel metadata write failure */
      }
      outcomes.push(outcome);
    }
  } catch (planErr) {
    const errorMsg = planErr instanceof Error ? planErr.message : String(planErr);
    console.error("[Darshan Refresh Fatal Error in Planning]", { error: errorMsg });
    for (const ch of effectiveChannels) {
      if (!outcomes.some((o) => o.slug === ch.slug)) {
        outcomes.push({
          slug: ch.slug,
          status: "error",
          channelUrl: ch.channel_url,
          message: `Refresh planning failed: ${errorMsg}`,
          checkedAt: new Date().toISOString(),
        });
      }
    }
  } finally {
    // 2. Persist log outcome state incrementally and on completion/failure
    await persistLog(outcomes);
  }

  const finishedAt = new Date();
  const tally = {
    updated: outcomes.filter((o) => o.status === "updated").length,
    unchanged: outcomes.filter((o) => o.status === "unchanged").length,
    no_live: outcomes.filter((o) => o.status === "no_live").length,
    errors: outcomes.filter((o) => o.status === "error").length,
  };

  console.log("[Darshan Refresh Completed]", {
    source,
    shrineCount: outcomes.length,
    updatedCount: tally.updated,
    unchangedCount: tally.unchanged,
    noLiveCount: tally.no_live,
    failedCount: tally.errors,
    logInserted,
    logError,
  });

  return {
    outcomes,
    logInserted,
    logError,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
  };
}

export interface RefreshExecutionSummary {
  success: boolean;
  ok: boolean;
  source: RefreshSource;
  startedAt: string;
  finishedAt: string;
  total: number;
  updatedCount: number;
  unchangedCount: number;
  noLiveCount: number;
  errorCount: number;
  logInserted: boolean;
  logError: string | null;
  outcomes: RefreshOutcome[];
}

export async function refreshAllLiveStreamsDetailed(
  source: RefreshSource = "manual",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient?: any,
): Promise<RefreshExecutionSummary> {
  const result = await refreshAllLiveStreamsInternal(source, supabaseClient);
  const outcomes = result.outcomes;
  const updatedCount = outcomes.filter((o) => o.status === "updated").length;
  const unchangedCount = outcomes.filter((o) => o.status === "unchanged").length;
  const noLiveCount = outcomes.filter((o) => o.status === "no_live").length;
  const errorCount = outcomes.filter((o) => o.status === "error").length;

  return {
    success: result.logInserted,
    ok: result.logInserted && errorCount === 0,
    source,
    startedAt: result.startedAt,
    finishedAt: result.finishedAt,
    total: outcomes.length,
    updatedCount,
    unchangedCount,
    noLiveCount,
    errorCount,
    logInserted: result.logInserted,
    logError: result.logError,
    outcomes,
  };
}
