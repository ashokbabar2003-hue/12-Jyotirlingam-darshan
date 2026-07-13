
-- Restrict has_role EXECUTE to authenticated only (RLS evaluator needs it); revoke from anon/public.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- handle_new_user is a trigger; no one needs direct EXECUTE.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Lock down user_roles writes: only admins (or service_role bypass) may mutate.
CREATE POLICY "Admins manage user_roles - insert"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage user_roles - update"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage user_roles - delete"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage: prevent users from overwriting files in other users' folders in darshan-gallery.
CREATE POLICY "Users can update own darshan-gallery files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'darshan-gallery'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'darshan-gallery'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
