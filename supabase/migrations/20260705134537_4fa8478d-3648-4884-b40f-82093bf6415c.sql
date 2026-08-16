
CREATE POLICY "Audio assets are publicly readable"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'audio-assets');
