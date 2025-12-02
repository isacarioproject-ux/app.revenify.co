-- Migration: Adicionar project_id à tabela finance_documents
-- Data: 2024-11-20
-- Descrição: Permite vincular documentos financeiros a projetos específicos

-- Adicionar coluna project_id
ALTER TABLE finance_documents 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_finance_documents_project_id 
ON finance_documents(project_id);

-- Comentário para documentação
COMMENT ON COLUMN finance_documents.project_id IS 'Vincula o documento financeiro a um projeto específico';

-- Verificar se a migration foi aplicada
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'finance_documents' 
  AND column_name = 'project_id';
