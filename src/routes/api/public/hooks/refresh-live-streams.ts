import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/refresh-live-streams")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Prefer a dedicated server-only secret. Keep the legacy cron key
        // temporarily until the scheduler has been migrated to the new secret.
        const dedicatedSecret = process.env.REFRESH_LIVE_STREAMS_SECRET;
        const expected = dedicatedSecret || process.env.SUPABASE_PUBLISHABLE_KEY;
        const provided = dedicatedSecret
          ? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
          : request.headers.get("apikey") ??
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
