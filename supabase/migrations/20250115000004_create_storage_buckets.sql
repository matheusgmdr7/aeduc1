-- Criar bucket para documentos de usuários
-- Este bucket armazena documentos de identificação, comprovantes de residência,
-- assinaturas e fichas cadastrais dos associados

-- Criar o bucket 'user-documents' se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-documents',
  'user-documents',
  true, -- Bucket público para permitir acesso às URLs públicas
  52428800, -- Limite de 50MB por arquivo
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir que usuários autenticados façam upload de documentos
CREATE POLICY "Usuários autenticados podem fazer upload de documentos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-documents');

-- Política para permitir que usuários autenticados leiam documentos
CREATE POLICY "Usuários autenticados podem ler documentos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'user-documents');

-- Política para permitir que usuários autenticados atualizem documentos
CREATE POLICY "Usuários autenticados podem atualizar documentos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'user-documents')
WITH CHECK (bucket_id = 'user-documents');

-- Política para permitir que usuários autenticados excluam documentos
CREATE POLICY "Usuários autenticados podem excluir documentos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'user-documents');

-- Política para permitir que admins gerenciem todos os documentos
CREATE POLICY "Admins podem gerenciar todos os documentos"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (is_admin = true OR role = 'admin')
  )
)
WITH CHECK (
  bucket_id = 'user-documents' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (is_admin = true OR role = 'admin')
  )
);

-- Política para permitir leitura pública de arquivos (já que o bucket é público)
-- Isso permite que as URLs públicas funcionem sem autenticação
CREATE POLICY "Leitura pública de arquivos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'user-documents');

