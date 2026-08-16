import { useEffect, useRef, useState } from "react";

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
  className,
  onStatusChange,
}: {
  title: string;
  liveUrl: string | null;
  defaultUrl: string | null;
  className?: string;
  onStatusChange?: (status: DarshanStatus) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    setUsingFallback(false);
  }, [liveUrl]);

  const initialSrc = liveUrl ?? defaultUrl;
  const status: DarshanStatus = usingFallback
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

    let onloadFired = false;
    const onLoad = () => {
      onloadFired = true;
      addListener();
      setTimeout(addListener, 500);
      setTimeout(addListener, 1500);
    };
    iframe.addEventListener("load", onLoad);
    if (iframe.contentDocument?.readyState === "complete") onLoad();

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
      if (data?.event === "onError" || data?.info?.errorCode != null) {
        if (!usingFallback && liveUrl && defaultUrl) setUsingFallback(true);
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

    const safety = window.setTimeout(() => {
      if (!onloadFired && liveUrl && defaultUrl && !usingFallback) {
        setUsingFallback(true);
      }
    }, 8000);

    return () => {
      iframe.removeEventListener("load", onLoad);
      window.removeEventListener("message", handler);
      window.clearTimeout(safety);
      try {
        post("stopVideo");
      } catch {
        /* ignore */
      }
    };
  }, [liveUrl, defaultUrl, usingFallback, title]);

  const src = usingFallback ? withJsApi(defaultUrl) : withJsApi(initialSrc);

  return (
    <div className={`relative aspect-video w-full bg-black ${className ?? ""}`}>
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
            loading="lazy"
            className="absolute inset-0 size-full"
          />
          {usingFallback ? (
            <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              Recorded
            </span>
          ) : liveUrl ? (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              <span className="size-1.5 rounded-full bg-white animate-pulse" />
              Live
            </span>
          ) : null}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-3 text-center text-xs text-muted-foreground">
          Live link not configured yet.
        </div>
      )}
    </div>
  );
}
