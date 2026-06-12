-- Audio bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio', 'audio', false);

CREATE POLICY "audio: owner upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "audio: owner read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "audio: owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Videos bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', false);

CREATE POLICY "videos: owner upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "videos: owner read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "videos: owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
