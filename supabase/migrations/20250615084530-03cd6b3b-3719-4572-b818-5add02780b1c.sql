
-- Ensure the "assistance-photos" bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('assistance-photos', 'assistance-photos', true, 5242880, ARRAY['image/*'])
ON CONFLICT (id) DO NOTHING;

-- Create public read access policy if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Public read access for assistance-photos'
    ) THEN
        CREATE POLICY "Public read access for assistance-photos"
        ON storage.objects FOR SELECT
        USING ( bucket_id = 'assistance-photos' );
    END IF;
END
$$;

-- Create insert (upload) policy if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can upload photos'
    ) THEN
        CREATE POLICY "Users can upload photos"
        ON storage.objects FOR INSERT
        WITH CHECK ( bucket_id = 'assistance-photos' );
    END IF;
END
$$;

-- Create delete policy if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can delete photos'
    ) THEN
        CREATE POLICY "Users can delete photos"
        ON storage.objects FOR DELETE
        USING ( bucket_id = 'assistance-photos' );
    END IF;
END
$$;

-- Create update policy if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can update photos'
    ) THEN
        CREATE POLICY "Users can update photos"
        ON storage.objects FOR UPDATE
        USING ( bucket_id = 'assistance-photos' );
    END IF;
END
$$;
