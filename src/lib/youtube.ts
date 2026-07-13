export type YoutubeValidation =
  | {
      ok: true;
      embedUrl: string;
      videoId: string | null;
      kind: "video" | "live" | "shorts" | "channel-live";
    }
  | { ok: false; reason: string };

export function validateYoutubeUrl(
  url: string | null | undefined,
  opts?: { autoplay?: boolean; mute?: boolean; loop?: boolean },
): YoutubeValidation {
  const raw = (url ?? "").trim();
  if (!raw) return { ok: false, reason: "No link provided yet." };
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return {
      ok: false,
      reason: "That doesn't look like a valid URL. Include https:// and the full YouTube link.",
    };
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    return { ok: false, reason: "Use an https:// YouTube link." };
  }
  try {
    const host = u.hostname.replace(/^www\./, "");
    const isYouTube =
      host === "youtu.be" ||
      host === "youtube.com" ||
      host.endsWith(".youtube.com") ||
      host === "youtube-nocookie.com" ||
      host.endsWith(".youtube-nocookie.com");
    if (!isYouTube) {
      return {
        ok: false,
        reason: `Only YouTube links can be embedded (got "${host}"). Paste a youtube.com or youtu.be URL.`,
      };
    }

    const idOk = (id: string) => /^[A-Za-z0-9_-]{11}$/.test(id);
    let embedBase: string | null = null;
    let videoId: string | null = null;
    let kind: "video" | "live" | "shorts" | "channel-live" = "video";

    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      if (!id) return { ok: false, reason: "Missing video ID after youtu.be/." };
      if (!idOk(id))
        return { ok: false, reason: "youtu.be video ID looks malformed (need 11 characters)." };
      embedBase = `https://www.youtube.com/embed/${id}`;
      videoId = id;
    } else if (u.pathname === "/watch") {
      const id = u.searchParams.get("v");
      if (!id) return { ok: false, reason: "Missing the ?v=… video ID on the watch URL." };
      if (!idOk(id))
        return { ok: false, reason: "The ?v=… video ID looks malformed (need 11 characters)." };
      embedBase = `https://www.youtube.com/embed/${id}`;
      videoId = id;
    } else if (u.pathname.startsWith("/embed/")) {
      const id = u.pathname.split("/")[2];
      if (!id) return { ok: false, reason: "Missing video ID after /embed/." };
      embedBase = `https://www.youtube.com/embed/${id}`;
      videoId = id;
    } else if (u.pathname.startsWith("/live/")) {
      const id = u.pathname.split("/")[2];
      if (!id) return { ok: false, reason: "Missing video ID after /live/." };
      embedBase = `https://www.youtube.com/embed/${id}`;
      videoId = id;
      kind = "live";
    } else if (u.pathname.startsWith("/shorts/")) {
      const id = u.pathname.split("/")[2];
      if (!id) return { ok: false, reason: "Missing video ID after /shorts/." };
      embedBase = `https://www.youtube.com/embed/${id}`;
      videoId = id;
      kind = "shorts";
    } else {
      const m = u.pathname.match(/^\/channel\/([^/]+)\/live\/?$/);
      if (m) {
        embedBase = `https://www.youtube.com/embed/live_stream?channel=${m[1]}`;
        kind = "channel-live";
      } else if (
        u.pathname.startsWith("/@") ||
        u.pathname.startsWith("/c/") ||
        u.pathname.startsWith("/user/")
      ) {
        return {
          ok: false,
          reason:
            "Channel handles (e.g. /@name) can't be embedded directly. Open the live video and paste its URL, or use youtube.com/channel/UC…/live.",
        };
      } else if (u.pathname.startsWith("/playlist")) {
        return {
          ok: false,
          reason: "Playlist links aren't embeddable here — paste a single video URL.",
        };
      } else {
        return {
          ok: false,
          reason:
            "Unrecognized YouTube URL. Use watch?v=…, youtu.be/…, /live/…, /shorts/…, or channel/UC…/live.",
        };
      }
    }

    if (videoId && !idOk(videoId)) {
      return {
        ok: false,
        reason: "The video ID looks malformed (expected 11 characters of letters, digits, _ or -).",
      };
    }

    const out = new URL(embedBase!);
    if (opts?.autoplay) out.searchParams.set("autoplay", "1");
    if (opts?.mute) out.searchParams.set("mute", "1");
    if (opts?.loop && videoId) {
      // YouTube requires both loop=1 and playlist=<id> to loop a single video.
      out.searchParams.set("loop", "1");
      out.searchParams.set("playlist", videoId);
    }
    return { ok: true, embedUrl: out.toString(), videoId, kind };
  } catch {
    return { ok: false, reason: "Could not parse that YouTube link." };
  }
}

export function toEmbedUrl(
  url: string | null | undefined,
  opts?: { autoplay?: boolean; mute?: boolean; loop?: boolean },
): string | null {
  const r = validateYoutubeUrl(url, opts);
  return r.ok ? r.embedUrl : null;
}
