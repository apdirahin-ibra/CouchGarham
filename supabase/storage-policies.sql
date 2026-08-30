-- Supabase Storage Buckets & Policies for Best Official App
-- Buckets: 'club-gallery' (Team photos)
--          'club-voice' (Coach voice announcements)
--
-- Security Model:
-- - Writes & Deletions: Strictly restricted to backend Server Functions via SUPABASE_SERVICE_ROLE_KEY behind Admin authorization.
-- - Reads: Configurable between Public Read (standard team feed) or Private Restricted with Signed URLs.

-- 1. Provision Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('club-gallery', 'club-gallery', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('club-voice', 'club-voice', true, 10485760, ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage RLS Policies (Enable RLS on storage.objects if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Read Access Policies
-- Mode A: Public Read Access (default team feed)
DROP POLICY IF EXISTS "Public Read Access for Club Gallery" ON storage.objects;
CREATE POLICY "Public Read Access for Club Gallery"
ON storage.objects FOR SELECT
USING (bucket_id = 'club-gallery');

DROP POLICY IF EXISTS "Public Read Access for Club Voice" ON storage.objects;
CREATE POLICY "Public Read Access for Club Voice"
ON storage.objects FOR SELECT
USING (bucket_id = 'club-voice');

-- 4. Server-Side Service Role Full Access (uploads, updates, deletes restricted to backend service role)
DROP POLICY IF EXISTS "Service Role Full Access for Club Gallery" ON storage.objects;
CREATE POLICY "Service Role Full Access for Club Gallery"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'club-gallery')
WITH CHECK (bucket_id = 'club-gallery');

DROP POLICY IF EXISTS "Service Role Full Access for Club Voice" ON storage.objects;
CREATE POLICY "Service Role Full Access for Club Voice"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'club-voice')
WITH CHECK (bucket_id = 'club-voice');
