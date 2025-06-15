
-- Remove políticas existentes (caso existam) e cria novas
DROP POLICY IF EXISTS "Public read access for assistance photos" ON storage.objects;
DROP POLICY IF EXISTS "Public upload access for assistance photos" ON storage.objects;
DROP POLICY IF EXISTS "Public update access for assistance photos" ON storage.objects;
DROP POLICY IF EXISTS "Public delete access for assistance photos" ON storage.objects;

-- Define políticas de segurança para o bucket existente
-- Permite que qualquer pessoa veja as fotos (necessário para as mostrar na aplicação)
CREATE POLICY "Public read access for assistance photos"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'assistance-photos');

-- Permite que qualquer pessoa (incluindo fornecedores via token) faça upload de fotos
CREATE POLICY "Public upload access for assistance photos"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'assistance-photos');

-- Permite que qualquer pessoa atualize ficheiros (útil para certas operações)
CREATE POLICY "Public update access for assistance photos"
ON storage.objects FOR UPDATE
TO anon
USING (bucket_id = 'assistance-photos');

-- Permite que qualquer pessoa apague ficheiros
CREATE POLICY "Public delete access for assistance photos"
ON storage.objects FOR DELETE
TO anon
USING (bucket_id = 'assistance-photos');
