import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { setCloudflareRuntimeEnv } from "./lib/server-env";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      if (env) {
        setCloudflareRuntimeEnv(env);
      }
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },

  async scheduled(
    controller: unknown,
    env: unknown,
    ctx: { waitUntil?: (p: Promise<unknown>) => void },
  ) {
    try {
      if (env) {
        setCloudflareRuntimeEnv(env);
      }
      const runCron = async () => {
        try {
          console.log("[Worker Scheduled Cron] Starting live darshan refresh...");
          const { refreshAllLiveStreams } = await import("./lib/refresh-live.server");
          const outcomes = await refreshAllLiveStreams("cron");
          console.log(
            `[Worker Scheduled Cron] Completed refresh: ${outcomes.length} shrines checked.`,
          );
        } catch (cronErr) {
          console.error("[Worker Scheduled Cron Error]:", cronErr);
        }
      };

      if (ctx && typeof ctx.waitUntil === "function") {
        ctx.waitUntil(runCron());
      } else {
        await runCron();
      }
    } catch (error) {
      console.error("[Worker Scheduled Handler Error]:", error);
    }
  },
};
