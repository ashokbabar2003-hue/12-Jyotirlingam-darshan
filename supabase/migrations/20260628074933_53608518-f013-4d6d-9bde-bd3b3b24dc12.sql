
CREATE TABLE public.darshan_refresh_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL,
  total int NOT NULL DEFAULT 0,
  updated int NOT NULL DEFAULT 0,
  unchanged int NOT NULL DEFAULT 0,
  no_live int NOT NULL DEFAULT 0,
  errors int NOT NULL DEFAULT 0,
  outcomes jsonb NOT NULL DEFAULT '[]'::jsonb
);
GRANT SELECT ON public.darshan_refresh_logs TO authenticated;
GRANT ALL ON public.darshan_refresh_logs TO service_role;
ALTER TABLE public.darshan_refresh_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read refresh logs"
  ON public.darshan_refresh_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX darshan_refresh_logs_started_at_idx
  ON public.darshan_refresh_logs (started_at DESC);
