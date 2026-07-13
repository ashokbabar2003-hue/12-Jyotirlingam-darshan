
-- Add optional note to gallery photos
ALTER TABLE public.gallery_images ADD COLUMN IF NOT EXISTS note text;

-- Admin-editable live darshan links per jyotirlinga
CREATE TABLE IF NOT EXISTS public.darshan_links (
  slug text PRIMARY KEY,
  youtube_url text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.darshan_links TO anon, authenticated;
GRANT ALL ON public.darshan_links TO service_role;

ALTER TABLE public.darshan_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Darshan links are public"
  ON public.darshan_links FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage darshan links insert"
  ON public.darshan_links FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage darshan links update"
  ON public.darshan_links FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage darshan links delete"
  ON public.darshan_links FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
