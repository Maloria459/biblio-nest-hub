
-- Add avatar_url and banner_url columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url text;

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create profile-banners storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-banners', 'profile-banners', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for avatars bucket
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- RLS for profile-banners bucket
CREATE POLICY "Users can upload their own banner"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-banners' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own banner"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-banners' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own banner"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-banners' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view banners"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-banners');
