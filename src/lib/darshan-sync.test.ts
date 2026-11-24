import { describe, it, expect } from "vitest";
import { matchesVerifiedVideo, effectiveStreamStatus } from "./darshan-sync";
const id = "abcdefghijk";
const live = "https://www.youtube.com/embed/" + id;
const next = "https://www.youtube.com/embed/lmnopqrstuv";
const fallback = "https://www.youtube.com/embed/12345678901";
describe("Darshan synchronization", () => {
  it("matches the actual embedded video", () => expect(matchesVerifiedVideo(live + "?autoplay=1", id)).toBe(true));
  it("rejects stale verification for a changed video", () => expect(matchesVerifiedVideo(next, id)).toBe(false));
  it("rejects missing and foreign URLs", () => {
    expect(matchesVerifiedVideo(null, id)).toBe(false);
    expect(matchesVerifiedVideo("https://example.com/embed/" + id, id)).toBe(false);
  });
  it("recovers LIVE from an old unverified report", () => expect(effectiveStreamStatus(live, fallback, true, {liveUrl: live, defaultUrl: fallback, status: "unverified"})).toBe("live"));
  it("downgrades expired verification", () => expect(effectiveStreamStatus(live, fallback, false)).toBe("unverified"));
  it("uses recorded fallback when primary is cleared", () => expect(effectiveStreamStatus(null, fallback, false)).toBe("recorded"));
  it("excludes failed players despite verification", () => expect(effectiveStreamStatus(live, fallback, true, {liveUrl: live, defaultUrl: fallback, status: "recorded"})).toBe("recorded"));
  it("ignores a previous video's failure", () => expect(effectiveStreamStatus(next, fallback, true, {liveUrl: live, defaultUrl: fallback, status: "none"})).toBe("live"));
  it("shows none when both URLs are absent", () => expect(effectiveStreamStatus(null, null, false)).toBe("none"));
});
