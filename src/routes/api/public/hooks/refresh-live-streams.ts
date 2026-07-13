import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/refresh-live-streams")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Verify caller using the Supabase publishable/anon key (provided by pg_cron).
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        const provided =
          request.headers.get("apikey") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!expected || !provided || provided !== expected) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }

        try {
          const { refreshAllLiveStreams } = await import("@/lib/refresh-live.server");
          const outcomes = await refreshAllLiveStreams("cron");
          return new Response(JSON.stringify({ ok: true, count: outcomes.length, outcomes }), {
            headers: { "content-type": "application/json" },
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("refresh-live-streams failed", msg);
          // Return 200 so pg_cron doesn't retry-storm; existing links untouched.
          return new Response(JSON.stringify({ ok: false, error: msg }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});
