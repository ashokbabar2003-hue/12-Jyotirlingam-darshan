import { describe, expect, it } from "vitest";
import { planRefresh, resolveLiveVideoIdDetails, type HtmlFetcher } from "./refresh-live.server";

const channel = { slug: "somnath", channel_url: "https://www.youtube.com/@SomnathTemple" };
const previous = "https://www.youtube.com/watch?v=abcdefghijk";
const current = new Map([[channel.slug, previous]]);
const hints = new Map([[channel.slug, ["Somnath", "Jyotirlinga"]]]);
const validPage = "<html><head><title>Somnath Temple</title></head><body>No active livestream</body></html>";

describe("Phase 1: protect primary links from inconclusive discovery", () => {
  it("preserves the link when only one of two probes succeeds", async () => {
    const fetcher: HtmlFetcher = async (url) => url.endsWith("/live") ? validPage : null;
    const [result] = await planRefresh([channel], current, hints, fetcher, new Set(), 2);
    expect(result.status).toBe("error");
    expect(result.newUrl).toBe(previous);
    expect(result.message).toContain("Verification incomplete");
  });

  it("clears the link only after both channel pages are successfully checked with no live candidates", async () => {
    const fetcher: HtmlFetcher = async () => validPage;
    const [result] = await planRefresh([channel], current, hints, fetcher, new Set(), 2);
    expect(result.status).toBe("no_live");
    expect(result.telemetry?.reason).toContain("both checked channel pages");
  });

  it("preserves the link when YouTube cannot be reached", async () => {
    const fetcher: HtmlFetcher = async () => null;
    const [result] = await planRefresh([channel], current, hints, fetcher, new Set(), 2);
    expect(result.status).toBe("error");
    expect(result.newUrl).toBe(previous);
  });

  it("preserves the link when a bot interstitial blocks discovery", async () => {
    const fetcher: HtmlFetcher = async () => "Sign in to confirm you're not a bot";
    const [result] = await planRefresh([channel], current, hints, fetcher, new Set(), 2);
    expect(result.status).toBe("error");
    expect(result.newUrl).toBe(previous);
  });

  it("preserves the link when the discovery request budget throws", async () => {
    const fetcher: HtmlFetcher = async () => { throw new Error("YouTube discovery request budget exhausted"); };
    const [result] = await planRefresh([channel], current, hints, fetcher, new Set(), 2);
    expect(result.status).toBe("error");
    expect(result.newUrl).toBe(previous);
  });

  it("exposes explicit discovery state for incomplete versus completed scans", async () => {
    const incomplete = await resolveLiveVideoIdDetails(channel.channel_url, async () => null, [], channel.slug, 2);
    const complete = await resolveLiveVideoIdDetails(channel.channel_url, async () => validPage, [], channel.slug, 2);
    expect(incomplete.discoveryState).toBe("verification_error");
    expect(complete.discoveryState).toBe("confirmed_no_live");
  });
});
