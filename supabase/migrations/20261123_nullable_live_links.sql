-- Run on production Supabase before deploying nullable live-link code.
-- Only primary live links may be NULL; recorded fallback links remain untouched.
alter table public.darshan_links
  alter column youtube_url drop not null;
-- Existing live URLs are deliberately not cleared by this migration.
