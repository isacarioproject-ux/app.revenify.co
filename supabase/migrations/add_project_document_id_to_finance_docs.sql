-- Adicionar coluna project_document_id para vincular finance_documents aos documentos de projeto
ALTER TABLE finance_documents
ADD COLUMN IF NOT EXISTS project_document_id UUID REFERENCES project_documents(id) ON DELETE SET NULL;

-- Remover a constraint antiga de project_id se existir (vamos manter ambos por enquanto para migração)
-- project_id continua existindo para referência ao projeto pai

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_finance_documents_project_document_id 
ON finance_documents(project_document_id);

-- Atualizar RLS policies
DROP POLICY IF EXISTS "Users can view own finance documents" ON finance_documents;
CREATE POLICY "Users can view own finance documents"
ON finance_documents FOR SELECT
USING (
  auth.uid() = user_id
);

DROP POLICY IF EXISTS "Users can insert own finance documents" ON finance_documents;
CREATE POLICY "Users can insert own finance documents"
ON finance_documents FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

DROP POLICY IF EXISTS "Users can update own finance documents" ON finance_documents;
CREATE POLICY "Users can update own finance documents"
ON finance_documents FOR UPDATE
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
);

DROP POLICY IF EXISTS "Users can delete own finance documents" ON finance_documents;
CREATE POLICY "Users can delete own finance documents"
ON finance_documents FOR DELETE
USING (
  auth.uid() = user_id
);
