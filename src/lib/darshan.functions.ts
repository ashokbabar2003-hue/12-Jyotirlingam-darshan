import { createServerFn } from "@tanstack/react-start";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUCKET = "darshan-gallery";
const SIGNED_TTL = 60 * 60 * 24 * 7; // 7 days

function publicClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export interface GalleryItem {
  id: string;
  caption: string | null;
  note: string | null;
  author_name: string;
  url: string | null;
  created_at: string;
}

export interface StoryItem {
  id: string;
  title: string;
  body: string;
  author_name: string;
  created_at: string;
}

export const getApprovedGallery = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }): Promise<GalleryItem[]> => {
    const sb = publicClient();
    const { data: rows, error } = await sb
      .from("gallery_images")
      .select("id, caption, note, author_name, image_url, created_at")
      .eq("jyotirlinga_slug", data.slug)
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    if (error || !rows) return [];

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const paths = rows.map((r) => r.image_url);
    const { data: signed } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrls(paths, SIGNED_TTL);
    const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
    return rows.map((r) => ({
      id: r.id,
      caption: r.caption,
      note: r.note ?? null,
      author_name: r.author_name,
      created_at: r.created_at,
      url: urlByPath.get(r.image_url) ?? null,
    }));
  });

export const getApprovedStories = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }): Promise<StoryItem[]> => {
    const sb = publicClient();
    const { data: rows, error } = await sb
      .from("stories")
      .select("id, title, body, author_name, created_at")
      .eq("jyotirlinga_slug", data.slug)
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    if (error || !rows) return [];
    return rows;
  });

async function authorName(supabase: SupabaseClient<Database>, userId: string): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();
  return data?.display_name ?? "Devotee";
}

export const submitStory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        slug: z.string().min(1),
        title: z.string().trim().min(2).max(120),
        body: z.string().trim().min(10).max(3000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const name = await authorName(context.supabase, context.userId);
    const { error } = await context.supabase.from("stories").insert({
      jyotirlinga_slug: data.slug,
      title: data.title,
      body: data.body,
      author_name: name,
      user_id: context.userId,
      status: "pending",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const submitGalleryImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        slug: z.string().min(1),
        path: z.string().min(1),
        caption: z.string().trim().max(200).optional(),
        note: z.string().trim().max(3000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    if (!data.path.startsWith(`${context.userId}/`)) throw new Error("Invalid file path");
    const name = await authorName(context.supabase, context.userId);
    const { error } = await context.supabase.from("gallery_images").insert({
      jyotirlinga_slug: data.slug,
      image_url: data.path,
      caption: data.caption ?? null,
      note: data.note ?? null,
      author_name: name,
      user_id: context.userId,
      status: "pending",
    });
    if (error) throw new Error(error.message);

    // Best-effort: notify admins via the database email queue (no-op until email is set up).
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: admins } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      const ids = (admins ?? []).map((a) => a.user_id);
      if (ids.length > 0) {
        const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
        const emails = (list?.users ?? [])
          .filter((u) => ids.includes(u.id) && !!u.email)
          .map((u) => u.email as string);
        for (const to of emails) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await supabaseAdmin.rpc("enqueue_email" as any, {
            queue_name: "transactional_emails",
            payload: {
              template_name: "gallery-submission",
              recipient_email: to,
              subject: `New darshan photo pending review — ${data.slug}`,
              html: `<p>A devotee (${name}) submitted a new photo for <b>${data.slug}</b>. Open the Manage page to review and approve.</p>`,
              text: `A devotee (${name}) submitted a new photo for ${data.slug}. Open the Manage page to review and approve.`,
            },
          });
        }
      }
    } catch {
      // Email infrastructure may not be configured yet — submission still succeeds.
    }

    return { ok: true };
  });

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if ((context as { isLocalAdmin?: boolean }).isLocalAdmin) {
      return { roles: ["admin"] };
    }
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    return { roles: (data ?? []).map((r) => r.role as string) };
  });

export const bootstrapAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if ((context as { isLocalAdmin?: boolean }).isLocalAdmin) {
      return { granted: true };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) return { granted: false, reason: "Admin already exists" };
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) throw new Error(error.message);
    return { granted: true };
  });

async function assertAdmin(context: {
  supabase: SupabaseClient<Database>;
  userId: string;
  isLocalAdmin?: boolean;
}) {
  if (context.isLocalAdmin) return;
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden");
}

export const getModerationQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [galleryRes, storiesRes] = await Promise.all([
      supabaseAdmin
        .from("gallery_images")
        .select("id, jyotirlinga_slug, caption, note, author_name, image_url, created_at, status")
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("stories")
        .select("id, jyotirlinga_slug, title, body, author_name, created_at, status")
        .order("created_at", { ascending: false }),
    ]);
    const gRows = galleryRes.data ?? [];
    const { data: signed } = await supabaseAdmin.storage.from(BUCKET).createSignedUrls(
      gRows.map((r) => r.image_url),
      SIGNED_TTL,
    );
    const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
    return {
      gallery: gRows.map((r) => ({
        id: r.id,
        slug: r.jyotirlinga_slug,
        caption: r.caption,
        note: r.note ?? null,
        author_name: r.author_name,
        created_at: r.created_at,
        status: r.status,
        url: urlByPath.get(r.image_url) ?? null,
      })),
      stories: (storiesRes.data ?? []).map((r) => ({
        id: r.id,
        slug: r.jyotirlinga_slug,
        title: r.title,
        body: r.body,
        author_name: r.author_name,
        created_at: r.created_at,
        status: r.status,
      })),
    };
  });

export const moderate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        type: z.enum(["gallery", "story"]),
        id: z.string().uuid(),
        action: z.enum(["approve", "reject"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const table = data.type === "gallery" ? "gallery_images" : "stories";
    if (data.action === "approve") {
      const { error } = await context.supabase
        .from(table)
        .update({ status: "approved" })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      if (data.type === "gallery") {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: row } = await supabaseAdmin
          .from("gallery_images")
          .select("image_url")
          .eq("id", data.id)
          .maybeSingle();
        if (row?.image_url) await supabaseAdmin.storage.from(BUCKET).remove([row.image_url]);
      }
      const { error } = await context.supabase.from(table).delete().eq("id", data.id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const getDarshanLinks = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data } = await sb.from("darshan_links").select("slug, youtube_url");
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.slug] = row.youtube_url;
  return map;
});

export const setDarshanLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        slug: z.string().min(1),
        youtube_url: z.string().trim().url().max(500),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("darshan_links").upsert(
      {
        slug: data.slug,
        youtube_url: data.youtube_url,
        updated_by: context.userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export interface DarshanChannel {
  slug: string;
  channel_url: string;
  last_checked: string | null;
  last_status: string | null;
  last_video_id: string | null;
}

export const getDarshanChannels = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DarshanChannel[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("darshan_channels")
      .select("slug, channel_url, last_checked, last_status, last_video_id");
    return (data ?? []) as DarshanChannel[];
  });

export const setDarshanChannel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        slug: z.string().min(1),
        channel_url: z.string().trim().url().max(500),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("darshan_channels").upsert(
      {
        slug: data.slug,
        channel_url: data.channel_url,
        updated_by: context.userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteDarshanChannel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("darshan_channels").delete().eq("slug", data.slug);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const refreshLiveStreamsNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { refreshAllLiveStreams } = await import("@/lib/refresh-live.server");
    const outcomes = await refreshAllLiveStreams("manual");
    return { ok: true, outcomes };
  });

export interface RefreshLogRow {
  id: string;
  started_at: string;
  finished_at: string;
  source: string;
  total: number;
  updated: number;
  unchanged: number;
  no_live: number;
  errors: number;
  outcomes: Array<{
    slug: string;
    status: string;
    videoId: string | null;
    youtube_url: string | null;
    previous_url: string | null;
    new_url: string | null;
    message: string | null;
    channelUrl: string;
    checked_at: string;
  }>;
}

export const getRefreshLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RefreshLogRow[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("darshan_refresh_logs" as any)
      .select(
        "id, started_at, finished_at, source, total, updated, unchanged, no_live, errors, outcomes",
      )
      .order("started_at", { ascending: false })
      .limit(30);
    return (data ?? []) as unknown as RefreshLogRow[];
  });
