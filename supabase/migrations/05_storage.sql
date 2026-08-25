-- ====================================================================
-- RExchange Supabase Migration 05: Storage Buckets & Access Policies
-- ====================================================================

-- 1. Create Storage Buckets in Supabase Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. POLICIES FOR "listing-images" BUCKET
-- Public Read Policy
CREATE POLICY "Public read access for listing-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'listing-images');

-- Authenticated Users Upload Access for listing-images
CREATE POLICY "Authenticated users can upload listing images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listing-images');

-- Delete Policy for listing-images (Restricted to creator)
CREATE POLICY "Users can delete own listing images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'listing-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
);


-- 3. POLICIES FOR "avatars" BUCKET
-- Public Read Policy
CREATE POLICY "Public read access for user avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- User can write only to own avatar folder (avatars/<auth_uid>/*)
CREATE POLICY "Users can write to own avatar folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own avatar file"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own avatar file"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
