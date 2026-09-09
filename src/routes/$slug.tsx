import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getJyotirlinga } from "@/data/jyotirlingas";
import { ShrineDetail } from "@/components/shrine/ShrineDetail";

export const Route = createFileRoute("/$slug")({
  loader: ({ params }) => {
    const jl = getJyotirlinga(params.slug);
    if (!jl) throw notFound();
    return { jl };
  },
  head: ({ loaderData, params }) => {
    const jl = loaderData?.jl;
    if (!jl) return {};
    const canonicalUrl = `https://12jyotirlingadarshan.online/${params.slug}`;
    return {
      links: [{ rel: "canonical", href: canonicalUrl }],
      meta: [
        { title: `${jl.name} Jyotirlinga — Live Darshan & Stories` },
        { name: "description", content: jl.description },
        { property: "og:title", content: `${jl.name} Jyotirlinga` },
        { property: "og:description", content: jl.significance },
        { property: "og:image", content: jl.image },
        { property: "og:url", content: canonicalUrl },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: `${jl.name} Jyotirlinga` },
        { name: "twitter:description", content: jl.significance },
        { name: "twitter:image", content: jl.image },
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
  component: ShrineDetailPage,
});

function ShrineDetailPage() {
  const { jl } = Route.useLoaderData();
  return <ShrineDetail jl={jl} />;
}
