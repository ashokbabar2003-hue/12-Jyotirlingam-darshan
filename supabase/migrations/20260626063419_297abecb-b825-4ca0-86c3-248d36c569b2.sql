
CREATE TABLE public.darshan_channels (
  slug TEXT PRIMARY KEY,
  channel_url TEXT NOT NULL,
  last_checked TIMESTAMPTZ,
  last_status TEXT,
  last_video_id TEXT,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.darshan_channels TO authenticated;
GRANT ALL ON public.darshan_channels TO service_role;

ALTER TABLE public.darshan_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read channels"
  ON public.darshan_channels FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage channels"
  ON public.darshan_channels FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
