-- Supabase Storage Buckets & Policies for Best Official App
-- Buckets: 'club-gallery' (public read, service-role write)
--          'club-voice' (public read, service-role write)

-- 1. Create buckets if they do not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('club-gallery', 'club-gallery', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('club-voice', 'club-voice', true, 10485760, ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage RLS Policies
-- Public Read Access for Gallery Photos
CREATE POLICY "Public Read Access for Club Gallery"
ON storage.objects FOR SELECT
USING (bucket_id = 'club-gallery');

-- Public Read Access for Coach Voice Announcements
CREATE POLICY "Public Read Access for Club Voice"
ON storage.objects FOR SELECT
USING (bucket_id = 'club-voice');

-- Server-Side Service Role Full Access (uploads, updates, deletes are restricted to backend service role)
CREATE POLICY "Service Role Full Access for Club Gallery"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'club-gallery')
WITH CHECK (bucket_id = 'club-gallery');

CREATE POLICY "Service Role Full Access for Club Voice"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'club-voice')
WITH CHECK (bucket_id = 'club-voice');
