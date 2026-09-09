-- Allow authenticated admins to update refresh logs so runs can transition from running to completed
GRANT SELECT, INSERT, UPDATE ON public.darshan_refresh_logs TO authenticated;
GRANT ALL ON public.darshan_refresh_logs TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'darshan_refresh_logs' AND policyname = 'Admins can update refresh logs'
  ) THEN
    CREATE POLICY "Admins can update refresh logs"
      ON public.darshan_refresh_logs FOR UPDATE
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'::app_role))
      WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;
