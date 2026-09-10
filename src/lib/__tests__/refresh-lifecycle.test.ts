import { describe, it, expect, vi } from "vitest";
import {
  CANONICAL_SHRINE_SLUGS,
  buildHintsFromCatalog,
  planRefresh,
  type PlanChannel,
  type RefreshOutcome,
  type HtmlFetcher,
} from "@/lib/refresh-live.server";

describe("Refresh Lifecycle & 12-Outcome Invariant Tests", () => {
  const catalog = CANONICAL_SHRINE_SLUGS.map((slug) => ({
    slug,
    name: `${slug.replace(/-/g, " ")} Jyotirlinga`,
  }));
  const hints = buildHintsFromCatalog(catalog);

  it("1. CANONICAL_SHRINE_SLUGS contains exactly 12 unique shrines", () => {
    expect(CANONICAL_SHRINE_SLUGS).toHaveLength(12);
    const uniqueSlugs = new Set(CANONICAL_SHRINE_SLUGS);
    expect(uniqueSlugs.size).toBe(12);
  });

  it("2. Planning produces exactly 12 outcomes when all 12 channels are provided", async () => {
    const channels: PlanChannel[] = CANONICAL_SHRINE_SLUGS.map((slug) => ({
      slug,
      channel_url: `https://www.youtube.com/@${slug}Official`,
    }));
    const currentBySlug = new Map<string, string | null>();
    const fetcher: HtmlFetcher = async () => null;

    const outcomes = await planRefresh(channels, currentBySlug, hints, fetcher);
    expect(outcomes).toHaveLength(12);
    const outcomeSlugs = new Set(outcomes.map((o) => o.slug));
    expect(outcomeSlugs.size).toBe(12);
    for (const slug of CANONICAL_SHRINE_SLUGS) {
      expect(outcomeSlugs.has(slug)).toBe(true);
    }
  });

  it("3. Outcome counts strictly sum to 12 across all outcome types", async () => {
    const channels: PlanChannel[] = CANONICAL_SHRINE_SLUGS.map((slug) => ({
      slug,
      channel_url:
        slug === "somnath"
          ? "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          : slug === "mallikarjuna"
            ? "https://www.youtube.com/@Unreachable404"
            : `https://www.youtube.com/@${slug}Official`,
    }));

    const currentBySlug = new Map<string, string | null>([
      ["mahakaleshwar", "https://www.youtube.com/watch?v=MAH12345678"],
    ]);

    const fetcher: HtmlFetcher = async (url) => {
      if (url.includes("Unreachable404")) return null;
      if (url.includes("mahakaleshwar")) {
        return `<html><body><link rel="canonical" href="https://www.youtube.com/watch?v=MAH12345678"><script>var yt = {"videoId":"MAH12345678","isLiveContent":true,"isLiveNow":true,"badges":[{"style":"LIVE","label":"LIVE"}],"shortViewCountText":"100 watching"};</script></body></html>`;
      }
      return `<html><body><title>Idle Channel</title></body></html>`;
    };

    const outcomes = await planRefresh(channels, currentBySlug, hints, fetcher);

    const updated = outcomes.filter((o) => o.status === "updated").length;
    const unchanged = outcomes.filter((o) => o.status === "unchanged").length;
    const noLive = outcomes.filter((o) => o.status === "no_live").length;
    const errors = outcomes.filter((o) => o.status === "error").length;

    expect(outcomes).toHaveLength(12);
    expect(updated + unchanged + noLive + errors).toBe(12);
    expect(updated).toBeGreaterThanOrEqual(1); // somnath direct watch
    expect(unchanged).toBeGreaterThanOrEqual(1); // mahakaleshwar same id
    expect(errors).toBeGreaterThanOrEqual(1); // mallikarjuna 404
  });

  it("4. Handles missing channel definitions by flagging error and preserving remaining shrines", async () => {
    // Only 6 channels configured in database
    const partialChannels: PlanChannel[] = CANONICAL_SHRINE_SLUGS.slice(0, 6).map((slug) => ({
      slug,
      channel_url: `https://www.youtube.com/@${slug}Official`,
    }));

    // Pad to 12 effective channels with fallback empty strings as done in executeRefreshRun
    const channelMap = new Map<string, PlanChannel>();
    for (const slug of CANONICAL_SHRINE_SLUGS) {
      channelMap.set(slug, { slug, channel_url: "" });
    }
    for (const ch of partialChannels) {
      channelMap.set(ch.slug, ch);
    }
    const effectiveChannels = CANONICAL_SHRINE_SLUGS.map((slug) => channelMap.get(slug)!);

    const currentBySlug = new Map<string, string | null>();
    const fetcher: HtmlFetcher = async () => null;

    const outcomes = await planRefresh(effectiveChannels, currentBySlug, hints, fetcher);

    expect(outcomes).toHaveLength(12);
    const unconfigured = outcomes.filter((o) => !o.channelUrl || o.status === "error");
    expect(unconfigured.length).toBeGreaterThanOrEqual(6);
  });

  it("5. Telemetry payload is captured on all outcomes", async () => {
    const channels: PlanChannel[] = [
      { slug: "somnath", channel_url: "https://www.youtube.com/watch?v=TESTVID1234" },
    ];
    const currentBySlug = new Map<string, string | null>();
    const fetcher: HtmlFetcher = async () => null;

    const outcomes = await planRefresh(channels, currentBySlug, hints, fetcher);
    expect(outcomes[0].telemetry).toBeDefined();
    expect(outcomes[0].telemetry?.shrine).toBe("somnath");
    expect(outcomes[0].telemetry?.result).toBe("updated");
  });

  it("6. Prevents cross-contamination: multiple shrines cannot steal the same stream", async () => {
    const channels: PlanChannel[] = [
      { slug: "somnath", channel_url: "https://www.youtube.com/@Somnath" },
      { slug: "mahakaleshwar", channel_url: "https://www.youtube.com/@Mahakal" },
    ];
    const currentBySlug = new Map<string, string | null>();
    const fetcher: HtmlFetcher = async (url) => {
      // Both channels advertise the exact same video ID
      return `<html><body><link rel="canonical" href="https://www.youtube.com/watch?v=SHAREDVID123"><script>var yt = {"videoId":"SHAREDVID123","isLiveContent":true,"isLiveNow":true,"badges":[{"style":"LIVE","label":"LIVE"}],"shortViewCountText":"50 watching"};</script></body></html>`;
    };

    const outcomes = await planRefresh(channels, currentBySlug, hints, fetcher);
    const assignedIds = outcomes
      .filter((o) => o.status === "updated" || o.status === "unchanged")
      .map((o) => o.videoId);

    // Only one shrine gets the video; the second is prevented from colliding
    const uniqueAssigned = new Set(assignedIds);
    expect(uniqueAssigned.size).toBe(assignedIds.length);
  });
});
