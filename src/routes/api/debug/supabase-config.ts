import { createFileRoute } from "@tanstack/react-router";
import { getPublicSupabaseEnv } from "@/lib/server-env";

export const Route = createFileRoute("/api/debug/supabase-config")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const publicEnv = getPublicSupabaseEnv();
        const configured = Boolean(publicEnv.url && publicEnv.publishableKey);

        let supabaseHost: string | null = null;
        if (publicEnv.url) {
          try {
            supabaseHost = new URL(publicEnv.url).hostname;
          } catch {
            supabaseHost = "invalid-url";
          }
        }

        const urlObj = new URL(request.url);
        const origin = urlObj.origin;

        // Detect runtime
        let runtime = "node";
        if (
          typeof globalThis !== "undefined" &&
          (globalThis as unknown as { WebSocketPair?: unknown }).WebSocketPair
        ) {
          runtime = "cloudflare";
        } else if (typeof process !== "undefined" && process.env?.CLOUDFLARE_WORKER) {
          runtime = "cloudflare";
        } else if (
          typeof (globalThis as unknown as { navigator?: { userAgent?: string } }).navigator
            ?.userAgent === "string" &&
          (
            globalThis as unknown as { navigator: { userAgent: string } }
          ).navigator.userAgent.includes("Cloudflare")
        ) {
          runtime = "cloudflare";
        }

        return new Response(
          JSON.stringify(
            {
              configured,
              supabaseHost,
              hasPublishableKey: Boolean(publicEnv.publishableKey),
              origin,
              runtime: runtime === "cloudflare" ? "cloudflare" : "server",
            },
            null,
            2,
          ),
          {
            status: 200,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store, no-cache, must-revalidate",
            },
          },
        );
      },
    },
  },
});
