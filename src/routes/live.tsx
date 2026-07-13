import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MapPin, ArrowLeft, Radio } from "lucide-react";
import { useCallback, useState } from "react";
import { z } from "zod";
import { jyotirlingas, getLocalized } from "@/data/jyotirlingas";
import { getDarshanLinks } from "@/lib/darshan.functions";
import { validateYoutubeUrl } from "@/lib/youtube";
import { DarshanTile, type DarshanStatus } from "@/components/darshan-tile";
import { useLanguage, toLocalDigits } from "@/hooks/use-language";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  slugs: z.string().optional(),
});

function defaultKey(slug: string) {
  return `${slug}__default`;
}

export const Route = createFileRoute("/live")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Live Darshan — 12 Jyotirlinga" },
      {
        name: "description",
        content: "Watch the live darshan of your selected Jyotirlinga shrines.",
      },
    ],
  }),
  component: LivePage,
});

function LivePage() {
  const { slugs } = Route.useSearch();
  const { lang, isEn, fontClass } = useLanguage();
  const linksFn = useServerFn(getDarshanLinks);
  const links = useQuery({
    queryKey: ["darshan-links"],
    queryFn: () => linksFn(),
    staleTime: 60_000,
  });

  const [statuses, setStatuses] = useState<Record<string, DarshanStatus>>({});
  const [liveOnly, setLiveOnly] = useState(false);
  const setStatus = useCallback((slug: string, s: DarshanStatus) => {
    setStatuses((prev) => (prev[slug] === s ? prev : { ...prev, [slug]: s }));
  }, []);

  const selectedSlugs: string[] = (slugs ?? "")
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);
  const list = selectedSlugs.length
    ? jyotirlingas.filter((j) => selectedSlugs.includes(j.slug))
    : jyotirlingas;
  const liveCount = list.filter((j) => statuses[j.slug] === "live").length;

  const gridCols =
    list.length === 1
      ? "grid-cols-1"
      : list.length === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : list.length === 3
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Home
        </Link>
        <h1
          className={cn(
            "text-xl font-semibold text-foreground sm:text-2xl",
            isEn ? "font-display" : fontClass,
          )}
        >
          {list.length === jyotirlingas.length
            ? "All 12 Live Darshan"
            : `${list.length} Selected Live Darshan`}
        </h1>
      </div>
      <div className="mb-4 flex items-center justify-end">
        <button
          type="button"
          onClick={() => setLiveOnly((v) => !v)}
          aria-pressed={liveOnly}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
            liveOnly
              ? "border-red-600 bg-red-600 text-white hover:bg-red-600/90"
              : "border-border/60 bg-card text-foreground hover:bg-card/70",
          )}
        >
          <Radio className="size-3.5" />
          {liveOnly ? "Showing LIVE only" : "Only LIVE"}
          {liveCount > 0 ? ` (${liveCount})` : ""}
        </button>
      </div>
      <div className={cn("grid gap-4", gridCols)}>
        {list.map((j) => {
          const liveRaw = links.data?.[j.slug] ?? j.youtubeUrl;
          const defaultRaw = links.data?.[defaultKey(j.slug)] ?? j.defaultYoutubeUrl;
          const liveCheck = validateYoutubeUrl(liveRaw, {
            autoplay: true,
            mute: true,
            loop: true,
          });
          const defaultCheck = validateYoutubeUrl(defaultRaw, {
            autoplay: true,
            mute: true,
            loop: true,
          });
          const liveUrl = liveCheck.ok ? liveCheck.embedUrl : null;
          const defaultUrl = defaultCheck.ok ? defaultCheck.embedUrl : null;
          const loc = getLocalized(j, lang);
          const hidden = liveOnly && statuses[j.slug] !== "live";
          return (
            <div
              key={j.slug}
              className={cn(
                "overflow-hidden rounded-xl border border-border/60 bg-card shadow-elegant",
                hidden && "hidden",
              )}
            >
              <DarshanTile
                title={`${j.name} live darshan`}
                liveUrl={liveUrl}
                defaultUrl={defaultUrl}
                onStatusChange={(s) => setStatus(j.slug, s)}
              />

              <div className="flex items-center justify-between gap-2 p-3">
                <div>
                  <h3
                    className={cn(
                      "text-sm font-semibold text-foreground",
                      isEn ? "font-display" : cn("text-base", fontClass),
                    )}
                  >
                    {toLocalDigits(j.number, lang)}. {loc.name}
                  </h3>
                  <p
                    className={cn(
                      "flex items-center gap-1 text-[11px] text-muted-foreground",
                      !isEn && cn("text-xs", fontClass),
                    )}
                  >
                    <MapPin className="size-3" /> {loc.location}, {loc.state}
                  </p>
                </div>
                <Link
                  to="/jyotirlinga/$slug"
                  params={{ slug: j.slug }}
                  className={cn(
                    "rounded-md bg-gradient-aarti px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow-glow",
                    !isEn && cn("text-xs", fontClass),
                  )}
                >
                  Open
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
