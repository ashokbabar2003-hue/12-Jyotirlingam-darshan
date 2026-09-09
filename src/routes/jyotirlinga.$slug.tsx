import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/jyotirlinga/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$slug",
      params: { slug: params.slug },
      statusCode: 301,
    });
  },
  component: () => null,
});
