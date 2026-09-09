import { validateYoutubeUrl } from "./youtube";

export interface DarshanStreamResolution {
  /** Valid embed URL for the primary live link, or null if missing or invalid */
  liveUrl: string | null;
  /** Valid embed URL for the fallback link, or null if missing or invalid */
  defaultUrl: string | null;
  /** The URL that should play according to precedence rules */
  activeUrl: string | null;
  /** Initial/canonical status: "live" | "recorded" | "none" */
  status: "live" | "recorded" | "none";
  /** Raw primary URL used */
  rawPrimary: string | null;
  /** Raw fallback URL used */
  rawFallback: string | null;
}

export function defaultKey(slug: string): string {
  return `${slug}__default`;
}

/**
 * Resolves the streams for a shrine according to strict canonical precedence:
 * 1. Valid current primary live link (from darshan_links[slug])
 * 2. Fallback darshan_links[slug__default]
 * 3. Static shrine default from catalog (defaultYoutubeUrl or youtubeUrl)
 *
 * A valid current primary live link MUST NOT be downgraded to fallback merely
 * because both links exist, the page reloaded, or iframe has not loaded yet.
 */
export function resolveShrineStreams(
  target: string | { slug: string; youtubeUrl?: string; defaultYoutubeUrl?: string },
  linksData?: Record<string, string> | null,
  catalogShrine?: { youtubeUrl?: string; defaultYoutubeUrl?: string } | null,
  opts: { autoplay?: boolean; mute?: boolean; loop?: boolean } = {
    autoplay: true,
    mute: true,
    loop: true,
  },
): DarshanStreamResolution {
  const slug = typeof target === "string" ? target : target.slug;
  const shrine = typeof target === "string" ? catalogShrine : target;

  // 1. Primary stream: DB primary link if present in DB map; otherwise static catalog live URL
  const hasDbPrimary = linksData ? slug in linksData : false;
  const dbPrimary = linksData?.[slug]?.trim();
  const rawPrimary = hasDbPrimary ? dbPrimary || null : shrine?.youtubeUrl?.trim() || null;

  // 2. Fallback stream: DB default link if present in DB map; otherwise static catalog default URL
  const hasDbFallback = linksData ? defaultKey(slug) in linksData : false;
  const dbFallback = linksData?.[defaultKey(slug)]?.trim();
  const rawFallback = hasDbFallback
    ? dbFallback || null
    : shrine?.defaultYoutubeUrl?.trim() || shrine?.youtubeUrl?.trim() || null;

  const liveCheck = rawPrimary ? validateYoutubeUrl(rawPrimary, opts) : null;
  const liveUrl = liveCheck?.ok ? liveCheck.embedUrl : null;

  const fallbackCheck = rawFallback ? validateYoutubeUrl(rawFallback, opts) : null;
  const defaultUrl = fallbackCheck?.ok ? fallbackCheck.embedUrl : null;

  const activeUrl = liveUrl ?? defaultUrl ?? null;
  const status: "live" | "recorded" | "none" = liveUrl ? "live" : defaultUrl ? "recorded" : "none";

  return {
    liveUrl,
    defaultUrl,
    activeUrl,
    status,
    rawPrimary,
    rawFallback,
  };
}

/**
 * Resolves streams for an array of shrines in a single pass.
 */
export function resolveAllShrineStreams(
  shrines: Array<{ slug: string; youtubeUrl?: string; defaultYoutubeUrl?: string }>,
  linksData?: Record<string, string> | null,
  opts?: { autoplay?: boolean; mute?: boolean; loop?: boolean },
): Record<string, DarshanStreamResolution> {
  const map: Record<string, DarshanStreamResolution> = {};
  for (const s of shrines) {
    map[s.slug] = resolveShrineStreams(s.slug, linksData, s, opts);
  }
  return map;
}
