
CREATE POLICY "Members upload own gallery files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'darshan-gallery' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Members read own gallery files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'darshan-gallery' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Members delete own gallery files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'darshan-gallery' AND (storage.foldername(name))[1] = auth.uid()::text);
