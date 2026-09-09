import { useEffect, useRef, useState } from "react";
import { Flame, Play, Radio } from "lucide-react";

/**
 * Renders a YouTube iframe with the live URL, auto-falling back to a default
 * URL if the live one errors (unavailable / embedding disabled / etc.).
 * Auto-replays when a video ends.
 *
 * `liveUrl` and `defaultUrl` should already be embed URLs (e.g. from
 * `validateYoutubeUrl(..., { autoplay: true, mute: true, loop: true })`).
 */
export type DarshanStatus = "live" | "recorded" | "none";

export function DarshanTile({
  title,
  liveUrl,
  defaultUrl,
  fallbackImage,
  shrineName,
  className,
  priority = false,
  onStatusChange,
}: {
  title: string;
  liveUrl: string | null;
  defaultUrl: string | null;
  fallbackImage?: string;
  shrineName?: string;
  className?: string;
  priority?: boolean;
  onStatusChange?: (status: DarshanStatus) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [streamError, setStreamError] = useState(false);

  useEffect(() => {
    setUsingFallback(false);
    setStreamError(false);
  }, [liveUrl, defaultUrl]);

  const initialSrc = liveUrl ?? defaultUrl;
  const status: DarshanStatus = streamError
    ? "none"
    : usingFallback
      ? defaultUrl
        ? "recorded"
        : "none"
      : liveUrl
        ? "live"
        : defaultUrl
          ? "recorded"
          : "none";

  useEffect(() => {
    const handle = setTimeout(() => {
      onStatusChange?.(status);
    }, 0);
    return () => clearTimeout(handle);
  }, [status, onStatusChange]);

  const withJsApi = (url: string | null) => {
    if (!url) return null;
    try {
      const u = new URL(url);
      u.searchParams.set("enablejsapi", "1");
      return u.toString();
    } catch {
      return url;
    }
  };

  function post(func: string, args: unknown[] = []) {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args }),
      "*",
    );
  }

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    function addListener() {
      iframe?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: title }), "*");
    }

    const onLoad = () => {
      addListener();
      setTimeout(addListener, 500);
      setTimeout(addListener, 1500);
    };
    iframe.addEventListener("load", onLoad);

    function handler(ev: MessageEvent) {
      if (ev.source !== iframe?.contentWindow) return;
      if (typeof ev.data !== "string") return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any;
      try {
        data = JSON.parse(ev.data);
      } catch {
        return;
      }

      // ONLY trigger fallback if YouTube explicitly reports an unrecoverable embed failure
      // Fatal codes: 2 (invalid param), 5 (HTML5 error), 100 (not found/removed), 101/150 (embedding disallowed)
      if (data?.event === "onError") {
        const rawCode =
          typeof data?.info === "number"
            ? data.info
            : typeof data?.data === "number"
              ? data.data
              : Number(data?.info);
        if ([2, 5, 100, 101, 150].includes(rawCode)) {
          if (!usingFallback && liveUrl && defaultUrl) {
            setUsingFallback(true);
          } else {
            setStreamError(true);
          }
        }
      }

      const state = data?.event === "onStateChange" ? data?.info : data?.info?.playerState;
      if (state === 0) {
        try {
          post("playVideo");
        } catch {
          /* ignore */
        }
      }
    }
    window.addEventListener("message", handler);

    return () => {
      iframe.removeEventListener("load", onLoad);
      window.removeEventListener("message", handler);
      try {
        post("stopVideo");
      } catch {
        /* ignore */
      }
    };
  }, [liveUrl, defaultUrl, usingFallback, title]);

  const activeEmbedUrl = usingFallback ? defaultUrl : initialSrc;
  const src = streamError ? null : withJsApi(activeEmbedUrl);

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden bg-neutral-950 select-none ${className ?? ""}`}
    >
      {/* 1. Underlying Authentic Shrine Image Backdrop (ensures zero black box flash during load or unavailable streams) */}
      {fallbackImage && (
        <img
          src={fallbackImage}
          alt={title}
          referrerPolicy="no-referrer"
          className="absolute inset-0 size-full object-cover object-center"
        />
      )}

      {/* Atmospheric dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30" />

      {/* 2. YouTube Iframe Player (if active stream exists) */}
      {src ? (
        <>
          <iframe
            ref={iframeRef}
            key={src}
            src={src}
            title={title}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            loading={priority ? "eager" : "lazy"}
            className="absolute inset-0 size-full"
          />
          {status === "live" ? (
            <span className="pointer-events-none absolute left-2.5 top-2.5 z-10 inline-flex items-center gap-1.5 rounded bg-red-600/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
              <span className="size-1.5 rounded-full bg-white animate-pulse" />
              Live
            </span>
          ) : status === "recorded" ? (
            <span className="pointer-events-none absolute left-2.5 top-2.5 z-10 inline-flex items-center gap-1 rounded bg-black/75 px-2 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur-xs border border-white/10">
              Recorded Darshan
            </span>
          ) : null}
        </>
      ) : (
        /* 3. Dignified Devotional Fallback State (No blank black void) */
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 text-center">
          <div className="flex size-11 items-center justify-center rounded-full border border-primary/40 bg-black/60 shadow-lg backdrop-blur-md mb-2">
            <Flame className="size-5 text-primary diya-flicker" />
          </div>
          {shrineName && (
            <h4 className="font-display text-sm font-semibold text-white sm:text-base drop-shadow-md">
              {shrineName}
            </h4>
          )}
          <p className="mt-1 text-xs text-white/80 max-w-xs drop-shadow-sm font-medium">
            Sacred Sanctum Presence
          </p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/50 px-2.5 py-0.5 text-[10px] font-medium text-amber-300 backdrop-blur-sm">
            <span className="size-1.5 rounded-full bg-amber-400" />
            Continuous Darshan Circuit
          </span>
        </div>
      )}
    </div>
  );
}
