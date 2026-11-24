export type StreamStatus = "live" | "unverified" | "recorded" | "none";
export function matchesVerifiedVideo(url: string | null | undefined, id: string | undefined): boolean {
  if (!url || !id) return false;
  try {
    const u = new URL(url);
    if (!["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtube-nocookie.com"].includes(u.hostname)) return false;
    const video = u.hostname === "youtu.be" ? u.pathname.slice(1).split("/")[0] : u.searchParams.get("v") ?? u.pathname.match(/^\/(?:embed|live)\/([A-Za-z0-9_-]{11})$/)?.[1];
    return video === id;
  } catch { return false; }
}
export function effectiveStreamStatus(liveUrl: string | null, defaultUrl: string | null, verified: boolean, reported?: { liveUrl: string | null; defaultUrl: string | null; status: StreamStatus }): StreamStatus {
  if (reported && reported.liveUrl === liveUrl && reported.defaultUrl === defaultUrl && (reported.status === "none" || reported.status === "recorded")) return reported.status;
  return liveUrl ? verified ? "live" : "unverified" : defaultUrl ? "recorded" : "none";
}
