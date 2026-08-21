CREATE POLICY "reports_read_own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'security-reports' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "reports_insert_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'security-reports' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "reports_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'security-reports' AND auth.uid()::text = (storage.foldername(name))[1]);