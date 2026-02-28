
-- Create the book-covers storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('book-covers', 'book-covers', true);

-- RLS: anyone can read (public bucket)
CREATE POLICY "Public read book covers" ON storage.objects FOR SELECT USING (bucket_id = 'book-covers');

-- RLS: authenticated users upload to their own folder
CREATE POLICY "Users upload own covers" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'book-covers' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: users can delete their own covers
CREATE POLICY "Users delete own covers" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'book-covers' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: users can update their own covers
CREATE POLICY "Users update own covers" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'book-covers' AND (storage.foldername(name))[1] = auth.uid()::text);
