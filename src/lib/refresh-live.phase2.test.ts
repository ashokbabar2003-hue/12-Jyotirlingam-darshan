import { describe, expect, it } from "vitest";
import { findLiveCandidatesInHtml, resolveLiveVideoIdDetails, planRefresh } from "./refresh-live.server";

const id = "abcdefghijk";
const other = "lmnopqrstuv";
const hints = ["Somnath", "darshan", "Jyotirlinga"];
const channel = "https://www.youtube.com/@SomnathTemple";
const watch = (details: object, broadcast: object = {}) => JSON.stringify({ videoDetails: { videoId: id, title: "Somnath Darshan", ...details }, microformat: { liveBroadcastDetails: broadcast } });
const renderer = (videoId: string, title: string, active: boolean, extra: object = {}) => ({ videoRenderer: { videoId, title: { simpleText: title }, badges: active ? [{ metadataBadgeRenderer: { style: "BADGE_STYLE_TYPE_LIVE_NOW" } }] : [], ...extra } });

describe("Phase 2 active broadcast and shrine validation", () => {
  it("accepts a direct active shrine-matched broadcast within the budget", async () => {
    let calls = 0;
    const result = await resolveLiveVideoIdDetails("https://www.youtube.com/watch?v=" + id, async () => { calls++; return watch({ isLive: true }); }, hints, "somnath", 2);
    expect(result.videoId).toBe(id);
    expect(calls).toBe(1);
  });
  it.each([
    watch({ isLiveContent: true }),
    watch({ isLive: true }, { endTimestamp: "2026-01-01T00:00:00Z" }),
    watch({ isLive: true, isUpcoming: true }),
    watch({ isLive: true, title: "Other temple live darshan" }),
    watch({ isLive: true, videoId: other }),
  ])("rejects unverified direct video metadata: %s", async (html) => {
    const result = await resolveLiveVideoIdDetails("https://www.youtube.com/watch?v=" + id, async () => html, hints, "somnath", 2);
    expect(result.videoId).toBeNull();
    expect(result.discoveryState).toBe("verification_error");
  });
  it("does not borrow a neighboring video's LIVE badge", () => {
    const html = JSON.stringify([renderer(id, "Somnath recorded", false), renderer(other, "Other live", true)]);
    expect(findLiveCandidatesInHtml(html).map(c => c.id)).toEqual([other]);
  });
  it("excludes upcoming renderers even if a live badge is present", () => {
    expect(findLiveCandidatesInHtml(JSON.stringify(renderer(id, "Somnath", true, { upcomingEventData: {} })))).toEqual([]);
  });
  it("rejects generic title matches on a shrine-named channel", async () => {
    const html = JSON.stringify(renderer(id, "Live darshan Jyotirlinga", true));
    const result = await resolveLiveVideoIdDetails(channel, async () => html, hints, "somnath", 2);
    expect(result.videoId).toBeNull();
  });
  it("selects the matching live renderer within two requests", async () => {
    let calls = 0;
    const html = JSON.stringify([renderer(id, "Other live darshan", true), renderer(other, "Somnath live darshan", true)]);
    const result = await resolveLiveVideoIdDetails(channel, async () => { calls++; return html; }, hints, "somnath", 2);
    expect(result.videoId).toBe(other);
    expect(calls).toBe(2);
  });
  it("preserves existing link on duplicate assignment", async () => {
    const previous = "https://www.youtube.com/watch?v=" + other;
    const [result] = await planRefresh([{ slug: "somnath", channel_url: channel }], new Map([["somnath", previous]]), new Map([["somnath", hints]]), async () => watch({ isLive: true }), new Set([id]), 2);
    expect(result.status).toBe("error");
    expect(result.newUrl).toBe(previous);
  });
});
