import { createFileRoute } from "@tanstack/react-router";
import { ensureServerEnv, getServerEnv, getPublicSupabaseEnv } from "@/lib/server-env";
import { hasValidServiceRoleKey } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/debug/database")({
  server: {
    handlers: {
      GET: async () => {
        ensureServerEnv();

        // Detect runtime
        let runtime = "server";
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

        const { url: pubUrl, publishableKey } = getPublicSupabaseEnv();
        const serviceRoleKey = getServerEnv("SUPABASE_SERVICE_ROLE_KEY");
        const supabaseConfigured = Boolean(pubUrl && (publishableKey || serviceRoleKey));
        const hasServiceRoleKey = hasValidServiceRoleKey();

        let databaseReachable = false;
        let darshanChannelsTableReachable = false;
        let darshanChannelsCount = 0;
        let darshanLinksTableReachable = false;
        let darshanLinksCount = 0;
        let refreshLogTableReachable = false;
        let refreshLogCount = 0;

        try {
          const { supabaseServer, supabaseAdmin } =
            await import("@/integrations/supabase/client.server");
          // Use supabaseAdmin if service role key exists, otherwise supabaseServer for safe probe
          const probeClient = hasServiceRoleKey ? supabaseAdmin : supabaseServer;

          // 1. Check darshan_links table
          const { count: linkCount, error: linkErr } = await probeClient
            .from("darshan_links")
            .select("slug", { count: "exact", head: true });
          if (!linkErr) {
            databaseReachable = true;
            darshanLinksTableReachable = true;
            darshanLinksCount = linkCount ?? 0;
          }

          // 2. Check darshan_channels table
          const { count: chanCount, error: chanErr } = await probeClient
            .from("darshan_channels")
            .select("slug", { count: "exact", head: true });
          if (!chanErr) {
            databaseReachable = true;
            darshanChannelsTableReachable = true;
            darshanChannelsCount = chanCount ?? 0;
          }

          // 3. Check darshan_refresh_logs table
          const { count: logCount, error: logErr } = await probeClient
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .from("darshan_refresh_logs" as any)
            .select("id", { count: "exact", head: true });
          if (!logErr) {
            refreshLogTableReachable = true;
            refreshLogCount = logCount ?? 0;
          }
        } catch {
          databaseReachable = false;
        }

        let cronHandlerPresent = false;
        try {
          const serverModule = await import("@/server");
          const defaultExport = serverModule.default as
            { scheduled?: unknown; fetch?: unknown } | undefined;
          cronHandlerPresent = typeof defaultExport?.scheduled === "function";
        } catch {
          cronHandlerPresent = false;
        }

        return new Response(
          JSON.stringify(
            {
              runtime: runtime === "cloudflare" ? "cloudflare" : "server",
              supabaseConfigured,
              hasServiceRoleKey,
              databaseReachable,
              darshanChannelsTableReachable,
              darshanChannelsCount,
              darshanLinksTableReachable,
              darshanLinksCount,
              refreshLogTableReachable,
              refreshLogCount,
              cronHandlerPresent,
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
