-- Make youtube_url nullable in darshan_links table
ALTER TABLE public.darshan_links ALTER COLUMN youtube_url DROP NOT NULL;
