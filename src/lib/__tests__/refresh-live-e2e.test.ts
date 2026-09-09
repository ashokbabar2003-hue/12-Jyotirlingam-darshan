import { describe, it, expect } from "vitest";
import {
  buildHintsFromCatalog,
  planRefresh,
  type HtmlFetcher,
  type PlanChannel,
  type RefreshOutcome,
} from "@/lib/refresh-live.server";

// Minimal fake catalog covering 3 shrines.
const catalog = [
  { slug: "somnath", name: "Somnath Jyotirlinga" },
  { slug: "mahakaleshwar", name: "Mahakaleshwar Jyotirlinga" },
  { slug: "kashi", name: "Kashi Vishwanath" },
];

const channels: PlanChannel[] = [
  { slug: "somnath", channel_url: "https://www.youtube.com/@SomnathOfficial" },
  { slug: "mahakaleshwar", channel_url: "https://www.youtube.com/@MahakalOfficial" },
  { slug: "kashi", channel_url: "https://www.youtube.com/@KashiOfficial" },
];

// Each "streams" page advertises multiple live streams; the correct one for
// each shrine is the title containing the shrine name, plus one shared
// generic "Live darshan" stream that loosely matches every shrine — exactly
// the cross-mixing failure mode this test guards against.
function streamsPage(titles: Array<{ id: string; title: string }>): string {
  const PAD = "x".repeat(4200);
  const blocks = titles
    .map(
      (t) =>
        `{"videoId":"${t.id}","title":"${t.title}","badges":[{"style":"LIVE","label":"LIVE"}],"shortViewCountText":"42 watching now","filler":"${PAD}"}`,
    )
    .join(",");
  return `<html><body><script>var d = {"contents":[${blocks}]};</script></body></html>`;
}

const notFound = `<html><head><title>404</title></head><body>Not found</body></html>`;
const SHARED_GENERIC = { id: "GGGGGGGGGGG", title: "Live darshan from a temple" };

function makeFetcher(): HtmlFetcher {
  const map: Record<string, string> = {
    "https://www.youtube.com/@SomnathOfficial/live": notFound,
    "https://www.youtube.com/@SomnathOfficial/streams": streamsPage([
      SHARED_GENERIC,
      { id: "SOMSOMSOMSO", title: "Somnath Jyotirlinga Live Aarti" },
    ]),
    "https://www.youtube.com/@MahakalOfficial/live": notFound,
    "https://www.youtube.com/@MahakalOfficial/streams": streamsPage([
      SHARED_GENERIC,
      { id: "MAHMAHMAHMA", title: "Mahakaleshwar Bhasma Aarti Live Darshan" },
    ]),
    "https://www.youtube.com/@KashiOfficial/live": notFound,
    "https://www.youtube.com/@KashiOfficial/streams": streamsPage([
      SHARED_GENERIC,
      { id: "KASKASKASKA", title: "Kashi Vishwanath Live Darshan" },
    ]),
  };
  return async (url) => (url in map ? map[url] : null);
}

describe("end-to-end refresh: manual + auto share the planner", () => {
  const hintsBySlug = buildHintsFromCatalog(catalog);
  const currentBySlug = new Map<string, string | null>();

  function summarise(outcomes: RefreshOutcome[]) {
    return outcomes
      .map((o) => `${o.slug}=${o.videoId ?? "-"}`)
      .sort()
      .join("|");
  }

  it("auto and manual runs produce the same shrine→videoId mapping", async () => {
    const fetcher = makeFetcher();
    // "auto" run — simulates the pg_cron hook.
    const autoRun = await planRefresh(channels, currentBySlug, hintsBySlug, fetcher);
    // "manual" run — simulates an admin pressing Refresh now immediately after.
    const manualRun = await planRefresh(channels, currentBySlug, hintsBySlug, fetcher);

    expect(summarise(autoRun)).toBe(summarise(manualRun));
  });

  it("never assigns the same videoId to more than one shrine in a single run", async () => {
    const fetcher = makeFetcher();
    for (const run of [
      await planRefresh(channels, currentBySlug, hintsBySlug, fetcher),
      await planRefresh(channels, currentBySlug, hintsBySlug, fetcher),
    ]) {
      const assigned = run
        .filter((o) => o.status === "updated" || o.status === "unchanged")
        .map((o) => o.videoId);
      const unique = new Set(assigned);
      expect(unique.size).toBe(assigned.length);
    }
  });

  it("matches each shrine to its own correctly-titled stream, not the shared generic", async () => {
    const fetcher = makeFetcher();
    const run = await planRefresh(channels, currentBySlug, hintsBySlug, fetcher);
    const byslug = Object.fromEntries(run.map((o) => [o.slug, o.videoId]));
    expect(byslug.somnath).toBe("SOMSOMSOMSO");
    expect(byslug.mahakaleshwar).toBe("MAHMAHMAHMA");
    expect(byslug.kashi).toBe("KASKASKASKA");
    // The shared generic must not have leaked into any shrine.
    expect(Object.values(byslug)).not.toContain(SHARED_GENERIC.id);
  });

  it("verifies 12 canonical shrines invariant and error isolation in planning", async () => {
    const { CANONICAL_SHRINE_SLUGS } = await import("@/lib/refresh-live.server");
    expect(CANONICAL_SHRINE_SLUGS).toHaveLength(12);

    const all12Channels: PlanChannel[] = CANONICAL_SHRINE_SLUGS.map((slug) => ({
      slug,
      channel_url:
        slug === "bhimashankar"
          ? "https://www.youtube.com/@Invalid404Channel"
          : `https://www.youtube.com/@${slug}Official`,
    }));

    const mockFetcher: HtmlFetcher = async (url) => {
      if (url.includes("Invalid404Channel")) {
        return null;
      }
      return streamsPage([{ id: `VID_${url.slice(24, 30)}`, title: `Live Darshan` }]);
    };

    const fullCatalog = CANONICAL_SHRINE_SLUGS.map((slug) => ({
      slug,
      name: `${slug} Jyotirlinga`,
    }));
    const fullHints = buildHintsFromCatalog(fullCatalog);

    const outcomes = await planRefresh(all12Channels, currentBySlug, fullHints, mockFetcher);

    expect(outcomes).toHaveLength(12);
    const outcomeSlugs = new Set(outcomes.map((o) => o.slug));
    expect(outcomeSlugs.size).toBe(12);
    for (const slug of CANONICAL_SHRINE_SLUGS) {
      expect(outcomeSlugs.has(slug)).toBe(true);
    }

    const updated = outcomes.filter((o) => o.status === "updated").length;
    const unchanged = outcomes.filter((o) => o.status === "unchanged").length;
    const noLive = outcomes.filter((o) => o.status === "no_live").length;
    const errors = outcomes.filter((o) => o.status === "error").length;

    expect(updated + unchanged + noLive + errors).toBe(12);
    // Bhimashankar (404) resulted in error, other 11 proceeded successfully
    expect(errors).toBeGreaterThanOrEqual(1);
    const bhim = outcomes.find((o) => o.slug === "bhimashankar");
    expect(bhim?.status).toBe("error");
  });
});
