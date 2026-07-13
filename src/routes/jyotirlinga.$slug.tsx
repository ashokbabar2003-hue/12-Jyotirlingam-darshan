import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, MapPin, Play, Images, BookHeart } from "lucide-react";
import { getJyotirlinga, jyotirlingas, getLocalized } from "@/data/jyotirlingas";
import { getApprovedGallery, getApprovedStories, getDarshanLinks } from "@/lib/darshan.functions";
import { validateYoutubeUrl } from "@/lib/youtube";
import { DarshanTile } from "@/components/darshan-tile";
import { StotramCompanion } from "@/components/stotram-companion";
import { useLanguage, toLocalDigits, type Lang } from "@/hooks/use-language";

type DetailStrings = {
  back: string;
  counter: (n: string, total: string) => string;
  watchLive: string;
  liveDarshan: string;
  aboutPrefix: string;
};

const DETAIL_STRINGS: Record<Lang, DetailStrings> = {
  en: {
    back: "All Jyotirlingas",
    counter: (n, total) => `Jyotirlinga ${n} of ${total}`,
    watchLive: "Watch Live Darshan",
    liveDarshan: "Live Darshan",
    aboutPrefix: "About",
  },
  mr: {
    back: "सर्व ज्योतिर्लिंगे",
    counter: (n, total) => `ज्योतिर्लिंग ${n} / ${total}`,
    watchLive: "थेट दर्शन पाहा",
    liveDarshan: "थेट दर्शन",
    aboutPrefix: "विषयी",
  },
  hi: {
    back: "सभी ज्योतिर्लिंग",
    counter: (n, total) => `ज्योतिर्लिंग ${n} / ${total}`,
    watchLive: "लाइव दर्शन देखें",
    liveDarshan: "लाइव दर्शन",
    aboutPrefix: "के बारे में",
  },
  gu: {
    back: "બધાં જ્યોતિર્લિંગ",
    counter: (n, total) => `જ્યોતિર્લિંગ ${n} / ${total}`,
    watchLive: "જીવંત દર્શન જુઓ",
    liveDarshan: "જીવંત દર્શન",
    aboutPrefix: "વિશે",
  },
  te: {
    back: "అన్ని జ్యోతిర్లింగాలు",
    counter: (n, total) => `జ్యోతిర్లింగ ${n} / ${total}`,
    watchLive: "ప్రత్యక్ష దర్శనం చూడండి",
    liveDarshan: "ప్రత్యక్ష దర్శనం",
    aboutPrefix: "గురించి",
  },
  ta: {
    back: "அனைத்து ஜோதிர்லிங்கங்கள்",
    counter: (n, total) => `ஜோதிர்லிங்கம் ${n} / ${total}`,
    watchLive: "நேரடி தரிசனத்தை காண",
    liveDarshan: "நேரடி தரிசனம்",
    aboutPrefix: "பற்றி",
  },
};
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SubmitGalleryDialog } from "@/components/submit-gallery-dialog";
import { SubmitStoryDialog } from "@/components/submit-story-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/jyotirlinga/$slug")({
  loader: ({ params }) => {
    const jl = getJyotirlinga(params.slug);
    if (!jl) throw notFound();
    return { jl };
  },
  head: ({ loaderData }) => {
    const jl = loaderData?.jl;
    if (!jl) return {};
    return {
      meta: [
        { title: `${jl.name} Jyotirlinga — Live Darshan & Stories` },
        { name: "description", content: jl.description },
        { property: "og:title", content: `${jl.name} Jyotirlinga` },
        { property: "og:description", content: jl.significance },
        { property: "og:image", content: jl.image },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-2xl text-foreground">Shrine not found</h1>
      <Link to="/" className="mt-4 inline-block text-primary underline">
        Back to all Jyotirlingas
      </Link>
    </div>
  ),
  errorComponent: () => (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-2xl text-foreground">Could not load this shrine</h1>
      <Link to="/" className="mt-4 inline-block text-primary underline">
        Back to all Jyotirlingas
      </Link>
    </div>
  ),
  component: Detail,
});

function Detail() {
  const { jl } = Route.useLoaderData();
  const { lang, isEn, isMr, fontClass } = useLanguage();
  const galleryFn = useServerFn(getApprovedGallery);
  const storiesFn = useServerFn(getApprovedStories);
  const linksFn = useServerFn(getDarshanLinks);
  const [openPhoto, setOpenPhoto] = useState<null | {
    url: string;
    caption: string | null;
    note: string | null;
    author: string;
  }>(null);

  const gallery = useQuery({
    queryKey: ["gallery", jl.slug],
    queryFn: () => galleryFn({ data: { slug: jl.slug } }),
  });
  const stories = useQuery({
    queryKey: ["stories", jl.slug],
    queryFn: () => storiesFn({ data: { slug: jl.slug } }),
  });
  const links = useQuery({
    queryKey: ["darshan-links"],
    queryFn: () => linksFn(),
    staleTime: 60_000,
  });

  const liveRaw = links.data?.[jl.slug] ?? jl.youtubeUrl;
  const defaultRaw = links.data?.[`${jl.slug}__default`] ?? jl.defaultYoutubeUrl;
  const liveCheck = validateYoutubeUrl(liveRaw, { autoplay: true, mute: true, loop: true });
  const defaultCheck = validateYoutubeUrl(defaultRaw, {
    autoplay: true,
    mute: true,
    loop: true,
  });
  const liveUrl = liveCheck.ok ? liveCheck.embedUrl : null;
  const defaultUrl = defaultCheck.ok ? defaultCheck.embedUrl : null;
  const hasAnyEmbed = !!(liveUrl || defaultUrl);

  const loc = getLocalized(jl, lang);
  const { name: displayName, location: displayLocation, state: displayState } = loc;

  return (
    <div>
      <StotramCompanion slug={jl.slug} shrineName={displayName} />
      <section className="relative">
        <img
          src={jl.image}
          alt={`${jl.name} Jyotirlinga temple`}
          width={1920}
          height={1080}
          referrerPolicy="no-referrer"
          className="absolute inset-0 size-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 to-background" />
        <div className="relative mx-auto max-w-4xl px-4 py-20">
          <Link
            to="/"
            className={cn(
              "inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground",
              fontClass,
            )}
          >
            <ArrowLeft className="size-4" /> {DETAIL_STRINGS[lang].back}
          </Link>
          <p
            className={cn(
              "mt-6 text-sm uppercase tracking-[0.25em] text-accent",
              isEn ? "font-display" : cn("normal-case tracking-normal", fontClass),
            )}
          >
            {DETAIL_STRINGS[lang].counter(toLocalDigits(jl.number, lang), toLocalDigits(12, lang))}
          </p>
          <h1
            className={cn(
              "mt-2 text-4xl font-bold text-foreground sm:text-5xl",
              isEn ? "font-display" : fontClass,
            )}
          >
            {displayName}
          </h1>
          <p
            className={cn("mt-3 flex items-center gap-1 text-sm text-muted-foreground", fontClass)}
          >
            <MapPin className="size-4" /> {displayLocation}, {displayState} · {jl.river}
          </p>
          {!hasAnyEmbed && (
            <Button asChild variant="hero" className="mt-6" size="lg">
              <a href={liveRaw} target="_blank" rel="noopener noreferrer">
                <Play className="size-4" />{" "}
                <span className={fontClass}>{DETAIL_STRINGS[lang].watchLive}</span>
              </a>
            </Button>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-16 px-4 py-12">
        {hasAnyEmbed && (
          <section className="rounded-xl border border-border/60 bg-card p-4 shadow-elegant">
            <h2
              className={cn(
                "mb-3 flex items-center gap-2 text-2xl text-foreground",
                isEn ? "font-display" : fontClass,
              )}
            >
              <Play className="size-5 text-primary" /> {DETAIL_STRINGS[lang].liveDarshan}
            </h2>
            <div className="overflow-hidden rounded-lg">
              <DarshanTile
                title={`${jl.name} live darshan`}
                liveUrl={liveUrl}
                defaultUrl={defaultUrl}
              />
            </div>
          </section>
        )}

        <section className="rounded-xl border border-border/60 bg-card p-6 shadow-elegant">
          <h2 className={cn("text-2xl text-foreground", isEn ? "font-display" : fontClass)}>
            {isMr ? (
              <>{jl.deity} विषयी</>
            ) : (
              <>
                {DETAIL_STRINGS[lang].aboutPrefix} {jl.deity}
              </>
            )}
          </h2>
          <p className="mt-3 text-muted-foreground">{jl.description}</p>
          <p className="mt-4 border-l-2 border-primary pl-4 text-foreground/90 italic">
            {jl.significance}
          </p>
        </section>

        <section>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-display text-2xl text-foreground">
              <Images className="size-5 text-primary" /> Sacred Gallery
            </h2>
            <SubmitGalleryDialog slug={jl.slug} />
          </div>
          {gallery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading darshan…</p>
          ) : gallery.data && gallery.data.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {gallery.data.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() =>
                    g.url &&
                    setOpenPhoto({
                      url: g.url,
                      caption: g.caption,
                      note: g.note,
                      author: g.author_name,
                    })
                  }
                  className="group overflow-hidden rounded-lg border border-border/60 bg-card text-left transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {g.url && (
                    <img
                      src={g.url}
                      alt={g.caption ?? `Photo of ${jl.name} by ${g.author_name}`}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="aspect-square w-full object-cover transition-opacity group-hover:opacity-90"
                    />
                  )}
                  <div className="p-2 text-xs text-muted-foreground">
                    {g.caption && <span className="block text-foreground">{g.caption}</span>}
                    {g.note && (
                      <span className="mt-0.5 line-clamp-2 block italic text-muted-foreground/90">
                        {g.note}
                      </span>
                    )}
                    <span className="mt-1 block">— {g.author_name}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
              No photos yet. Be the first devotee to share a darshan photo.
            </p>
          )}
        </section>

        <section>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-display text-2xl text-foreground">
              <BookHeart className="size-5 text-primary" /> Devotee Stories
            </h2>
            <SubmitStoryDialog slug={jl.slug} />
          </div>
          {stories.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading stories…</p>
          ) : stories.data && stories.data.length > 0 ? (
            <div className="space-y-4">
              {stories.data.map((s) => (
                <article
                  key={s.id}
                  className="rounded-xl border border-border/60 bg-card p-5 shadow-elegant"
                >
                  <h3 className="font-display text-lg text-foreground">{s.title}</h3>
                  <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{s.body}</p>
                  <p className="mt-3 text-xs text-accent">— {s.author_name}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
              No stories yet. Share the feeling of your darshan at {jl.name}.
            </p>
          )}
        </section>
      </div>

      <Dialog open={!!openPhoto} onOpenChange={(o) => !o && setOpenPhoto(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {openPhoto?.caption || `Darshan by ${openPhoto?.author ?? "a devotee"}`}
            </DialogTitle>
          </DialogHeader>
          {openPhoto?.url && (
            <img
              src={openPhoto.url}
              alt={openPhoto.caption ?? `Darshan photo by ${openPhoto.author}`}
              referrerPolicy="no-referrer"
              className="max-h-[70vh] w-full rounded-lg object-contain"
            />
          )}
          {openPhoto?.note && (
            <p className="whitespace-pre-line text-sm text-muted-foreground">{openPhoto.note}</p>
          )}
          <p className="text-xs text-accent">— {openPhoto?.author}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const _routes = jyotirlingas;
