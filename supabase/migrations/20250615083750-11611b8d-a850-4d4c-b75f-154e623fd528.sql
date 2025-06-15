
-- Tornar o bucket assistance-photos público
UPDATE storage.buckets 
SET public = true 
WHERE id = 'assistance-photos';

-- Verificar se as políticas de acesso estão corretas (estas já devem existir)
-- Se não existirem, serão criadas

-- Política para leitura pública
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

-- Política para upload de fotos
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

-- Política para eliminar fotos
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

-- Política para atualizar fotos
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
