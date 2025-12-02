-- Criar bucket para documentos financeiros (PDFs de boletos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('finance-documents', 'finance-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir upload de arquivos (apenas para usuários autenticados)
CREATE POLICY "Users can upload finance documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'finance-documents' 
  AND auth.uid() IS NOT NULL
);

-- Política para permitir visualização de arquivos
CREATE POLICY "Users can view finance documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'finance-documents');

-- Política para permitir deletar seus próprios arquivos
CREATE POLICY "Users can delete their own finance documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'finance-documents' 
  AND auth.uid() IS NOT NULL
);

-- Verificar
SELECT 'Bucket finance-documents criado com sucesso!' as status;
