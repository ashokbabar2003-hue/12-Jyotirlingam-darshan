
-- Restrict SECURITY DEFINER functions: revoke from PUBLIC/anon, grant only where needed
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- handle_new_user is only invoked by the auth trigger (owned by supabase_auth_admin); no direct callers.

-- Restrict profiles SELECT to authenticated users
DROP POLICY IF EXISTS "Profiles are publicly viewable" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);
