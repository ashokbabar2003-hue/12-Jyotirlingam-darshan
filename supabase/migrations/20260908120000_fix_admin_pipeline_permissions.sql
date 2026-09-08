-- Fix permissions and RLS policies for admin live refresh pipeline

-- 1. darshan_channels table privileges and policies
GRANT ALL ON public.darshan_channels TO authenticated;
GRANT SELECT ON public.darshan_channels TO anon;
GRANT ALL ON public.darshan_channels TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'darshan_channels' AND policyname = 'Channels are publicly viewable'
  ) THEN
    CREATE POLICY "Channels are publicly viewable"
      ON public.darshan_channels FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- 2. darshan_links table privileges
GRANT ALL ON public.darshan_links TO authenticated;
GRANT ALL ON public.darshan_links TO service_role;

-- 3. darshan_refresh_logs table privileges and policies
GRANT SELECT, INSERT ON public.darshan_refresh_logs TO authenticated;
GRANT ALL ON public.darshan_refresh_logs TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'darshan_refresh_logs' AND policyname = 'Admins can insert refresh logs'
  ) THEN
    CREATE POLICY "Admins can insert refresh logs"
      ON public.darshan_refresh_logs FOR INSERT
      TO authenticated
      WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- 4. Safe bootstrap_admin function
CREATE OR REPLACE FUNCTION public.bootstrap_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count INT;
BEGIN
  SELECT count(*) INTO admin_count FROM public.user_roles WHERE role = 'admin'::app_role;
  IF admin_count = 0 AND auth.uid() IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin'::app_role);
    RETURN true;
  END IF;
  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.bootstrap_admin() TO authenticated;
