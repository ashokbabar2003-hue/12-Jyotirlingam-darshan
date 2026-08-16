import { describe, it, expect } from "vitest";
import {
  buildCandidatePages,
  extractCanonicalVideoId,
  extractChannelId,
  findLiveCandidatesInHtml,
  findLiveVideoIdInHtml,
  pageLooksLive,
  resolveLiveVideoId,
  scoreLiveCandidate,
  type HtmlFetcher,
} from "@/lib/refresh-live.server";

const VID_A = "aaaaaaaaaaa".replace(/a/g, "A"); // AAAAAAAAAAA (11 chars)
const VID_B = "BBBBBBBBBBB";
const VID_C = "CCCCCCCCCCC";
const VID_DIRECT = "dQw4w9WgXcQ";
const CHAN = "UC" + "x".repeat(22);

function liveHtml(videoId: string, channelId = CHAN): string {
  return `
    <html><head>
      <link rel="canonical" href="https://www.youtube.com/watch?v=${videoId}">
      <meta property="og:url" content="https://www.youtube.com/watch?v=${videoId}">
      <meta itemprop="channelId" content="${channelId}">
    </head><body>
      <script>var ytInitial = {"videoId":"${videoId}","isLiveContent":true,"isLiveNow":true,
        "channelId":"${channelId}","badges":[{"style":"LIVE","label":"LIVE"}],
        "shortViewCountText":"1,234 watching now"};
      </script>
    </body></html>`;
}

function streamsHtml(items: Array<{ id: string; live: boolean }>, channelId = CHAN): string {
  // Mimic the JSON-blob shape the parser scans. The parser looks at the next
  // ~4000 chars after each videoId for a LIVE badge — pad each block with
  // filler so badges from later entries don't bleed into earlier windows.
  const PAD = "x".repeat(4200);
  const blocks = items
    .map(
      (it) =>
        `{"videoId":"${it.id}","title":"x"${
          it.live
            ? `,"badges":[{"style":"LIVE","label":"LIVE"}],"shortViewCountText":"42 watching now"`
            : `,"viewCountText":"100 views"`
        },"filler":"${PAD}"}`,
    )
    .join(",");
  return `<html><head><meta itemprop="channelId" content="${channelId}"></head>
    <body><script>var d = {"contents":[${blocks}]};</script></body></html>`;
}

const notFoundHtml = `<html><head><title>404</title></head><body>Not found</body></html>`;

describe("buildCandidatePages", () => {
  it("handles @handle URLs", () => {
    const r = buildCandidatePages("https://www.youtube.com/@SriSomnathTempleOfficial");
    expect(r.bases).toEqual(["https://www.youtube.com/@SriSomnathTempleOfficial"]);
    expect(r.channelId).toBeNull();
    expect(r.directVideoId).toBeNull();
  });

  it("strips /live, /streams, /videos suffixes", () => {
    for (const suffix of ["/live", "/streams", "/videos", "/featured"]) {
      const r = buildCandidatePages(`https://www.youtube.com/@TempleX${suffix}`);
      expect(r.bases).toEqual(["https://www.youtube.com/@TempleX"]);
    }
  });

  it("extracts channelId from /channel/UC… URLs", () => {
    const r = buildCandidatePages(`https://www.youtube.com/channel/${CHAN}`);
    expect(r.channelId).toBe(CHAN);
    expect(r.bases).toEqual([`https://www.youtube.com/channel/${CHAN}`]);
  });

  it("supports /c/ and /user/ vanity URLs", () => {
    const c = buildCandidatePages("https://www.youtube.com/c/MyTemple");
    expect(c.bases).toEqual(["https://www.youtube.com/c/MyTemple"]);
    const u = buildCandidatePages("https://www.youtube.com/user/legacyName");
    expect(u.bases).toEqual(["https://www.youtube.com/user/legacyName"]);
  });

  it("treats direct watch URLs as a direct video ID", () => {
    const r = buildCandidatePages(`https://www.youtube.com/watch?v=${VID_DIRECT}`);
    expect(r.directVideoId).toBe(VID_DIRECT);
  });

  it("treats /live/<id> URLs as a direct video ID", () => {
    const r = buildCandidatePages(`https://www.youtube.com/live/${VID_DIRECT}`);
    expect(r.directVideoId).toBe(VID_DIRECT);
  });

  it("treats youtu.be short links as a direct video ID", () => {
    const r = buildCandidatePages(`https://youtu.be/${VID_DIRECT}`);
    expect(r.directVideoId).toBe(VID_DIRECT);
  });

  it("ignores non-YouTube URLs", () => {
    const r = buildCandidatePages("https://example.com/@something");
    expect(r.bases).toEqual([]);
    expect(r.directVideoId).toBeNull();
    expect(r.channelId).toBeNull();
  });
});

describe("HTML extractors", () => {
  it("extractCanonicalVideoId reads <link rel=canonical>", () => {
    expect(extractCanonicalVideoId(liveHtml(VID_A))).toBe(VID_A);
  });

  it("extractChannelId finds UC IDs across patterns", () => {
    expect(extractChannelId(liveHtml(VID_A, CHAN))).toBe(CHAN);
    expect(extractChannelId(`"externalChannelId":"${CHAN}"`)).toBe(CHAN);
    expect(extractChannelId(`"browseId":"${CHAN}"`)).toBe(CHAN);
    expect(extractChannelId("nope")).toBeNull();
  });

  it("pageLooksLive detects live indicators", () => {
    expect(pageLooksLive(liveHtml(VID_A))).toBe(true);
    expect(pageLooksLive(notFoundHtml)).toBe(false);
  });

  it("findLiveVideoIdInHtml picks the LIVE-badged id, skipping VODs", () => {
    const html = streamsHtml([
      { id: VID_A, live: false },
      { id: VID_B, live: true },
      { id: VID_C, live: false },
    ]);
    expect(findLiveVideoIdInHtml(html)).toBe(VID_B);
  });
});

function makeFetcher(map: Record<string, string | null>): HtmlFetcher {
  return async (url: string) => (url in map ? map[url] : null);
}

describe("resolveLiveVideoId", () => {
  it("returns the direct video ID without fetching when given a watch URL", async () => {
    const calls: string[] = [];
    const fetcher: HtmlFetcher = async (u) => {
      calls.push(u);
      return null;
    };
    const id = await resolveLiveVideoId(`https://www.youtube.com/watch?v=${VID_DIRECT}`, fetcher);
    expect(id).toBe(VID_DIRECT);
    expect(calls).toEqual([]);
  });

  it("resolves @handle by probing /live and reading the canonical URL", async () => {
    const fetcher = makeFetcher({
      "https://www.youtube.com/@TempleX/live": liveHtml(VID_A),
    });
    const id = await resolveLiveVideoId("https://www.youtube.com/@TempleX", fetcher);
    expect(id).toBe(VID_A);
  });

  it("falls back to /streams when /live is not live", async () => {
    const fetcher = makeFetcher({
      "https://www.youtube.com/@TempleX/live": notFoundHtml,
      "https://www.youtube.com/@TempleX/streams": streamsHtml([
        { id: VID_A, live: false },
        { id: VID_B, live: true },
      ]),
    });
    const id = await resolveLiveVideoId("https://www.youtube.com/@TempleX", fetcher);
    expect(id).toBe(VID_B);
  });

  it("falls back to the channel home when /live and /streams have no live", async () => {
    const fetcher = makeFetcher({
      "https://www.youtube.com/c/MyTemple/live": notFoundHtml,
      "https://www.youtube.com/c/MyTemple/streams": notFoundHtml,
      "https://www.youtube.com/c/MyTemple": streamsHtml([{ id: VID_C, live: true }]),
    });
    const id = await resolveLiveVideoId("https://www.youtube.com/c/MyTemple", fetcher);
    expect(id).toBe(VID_C);
  });

  it("resolves /user/ legacy vanity URLs", async () => {
    const fetcher = makeFetcher({
      "https://www.youtube.com/user/oldName/live": liveHtml(VID_A),
    });
    const id = await resolveLiveVideoId("https://www.youtube.com/user/oldName", fetcher);
    expect(id).toBe(VID_A);
  });

  it("resolves /channel/UC… directly via /live", async () => {
    const fetcher = makeFetcher({
      [`https://www.youtube.com/channel/${CHAN}/live`]: liveHtml(VID_B, CHAN),
    });
    const id = await resolveLiveVideoId(`https://www.youtube.com/channel/${CHAN}`, fetcher);
    expect(id).toBe(VID_B);
  });

  it("uses the discovered channel ID as a last-resort fallback", async () => {
    // /live page exists for the handle and exposes the channel ID, but isn't itself live.
    // /streams and home have nothing live. Final hop hits /channel/UC…/live and finds it.
    const handleLive = `<html><head>
        <meta itemprop="channelId" content="${CHAN}">
      </head><body>not live right now</body></html>`;
    const fetcher = makeFetcher({
      "https://www.youtube.com/@TempleX/live": handleLive,
      "https://www.youtube.com/@TempleX/streams": notFoundHtml,
      "https://www.youtube.com/@TempleX": notFoundHtml,
      [`https://www.youtube.com/channel/${CHAN}/live`]: liveHtml(VID_C, CHAN),
    });
    const id = await resolveLiveVideoId("https://www.youtube.com/@TempleX", fetcher);
    expect(id).toBe(VID_C);
  });

  it("returns null when no source reveals an active live stream", async () => {
    const fetcher = makeFetcher({
      "https://www.youtube.com/@Quiet/live": notFoundHtml,
      "https://www.youtube.com/@Quiet/streams": notFoundHtml,
      "https://www.youtube.com/@Quiet": notFoundHtml,
    });
    const id = await resolveLiveVideoId("https://www.youtube.com/@Quiet", fetcher);
    expect(id).toBeNull();
  });

  it("returns null for non-YouTube channel URLs", async () => {
    const fetcher = makeFetcher({});
    const id = await resolveLiveVideoId("https://example.com/@nope", fetcher);
    expect(id).toBeNull();
  });
});

function titledLiveHtml(items: Array<{ id: string; title: string }>): string {
  const PAD = "x".repeat(4200);
  const blocks = items
    .map(
      (it) =>
        `{"videoId":"${it.id}","title":"${it.title}","badges":[{"style":"LIVE","label":"LIVE"}],"shortViewCountText":"42 watching now","filler":"${PAD}"}`,
    )
    .join(",");
  return `<html><body><script>var d = {"contents":[${blocks}]};</script></body></html>`;
}

describe("scoreLiveCandidate", () => {
  it("rewards shrine-name matches heavily and keyword matches lightly", () => {
    const hints = ["Somnath Jyotirlinga", "darshan", "aarti"];
    expect(scoreLiveCandidate("Somnath Live Darshan", hints)).toBeGreaterThan(
      scoreLiveCandidate("Random Aarti", hints),
    );
    expect(scoreLiveCandidate("Unrelated cooking video", hints)).toBe(0);
  });
});

describe("findLiveCandidatesInHtml", () => {
  it("extracts each live videoId with its title", () => {
    const html = titledLiveHtml([
      { id: "AAAAAAAAAAA", title: "Somnath Live Darshan" },
      { id: "BBBBBBBBBBB", title: "Mahakaleshwar Bhasma Aarti" },
    ]);
    const cands = findLiveCandidatesInHtml(html);
    expect(cands.map((c) => c.id)).toEqual(["AAAAAAAAAAA", "BBBBBBBBBBB"]);
    expect(cands[0].title).toMatch(/Somnath/);
  });
});

describe("resolveLiveVideoId with hints", () => {
  it("picks the candidate whose title matches the shrine hints", async () => {
    const fetcher = makeFetcher({
      "https://www.youtube.com/@Multi/live": notFoundHtml,
      "https://www.youtube.com/@Multi/streams": titledLiveHtml([
        { id: "AAAAAAAAAAA", title: "Random temple tour" },
        { id: "BBBBBBBBBBB", title: "Mahakaleshwar Live Darshan from Ujjain" },
        { id: "CCCCCCCCCCC", title: "Somnath Aarti" },
      ]),
    });
    const id = await resolveLiveVideoId("https://www.youtube.com/@Multi", fetcher, [
      "Mahakaleshwar Jyotirlinga",
      "darshan",
      "aarti",
    ]);
    expect(id).toBe("BBBBBBBBBBB");
  });

  it("returns null when no candidate matches the hints (avoids mix-ups)", async () => {
    const fetcher = makeFetcher({
      "https://www.youtube.com/@Multi/live": notFoundHtml,
      "https://www.youtube.com/@Multi/streams": titledLiveHtml([
        { id: "AAAAAAAAAAA", title: "Cooking show" },
        { id: "BBBBBBBBBBB", title: "Music concert" },
      ]),
      "https://www.youtube.com/@Multi": notFoundHtml,
    });
    const id = await resolveLiveVideoId("https://www.youtube.com/@Multi", fetcher, [
      "Somnath Jyotirlinga",
      "darshan",
    ]);
    expect(id).toBeNull();
  });
});
