-- Migration: Criar tabela project_documents
-- Data: 2024-11-20
-- Descrição: Tabela para armazenar DOCUMENTOS dentro de cada PROJETO

-- Criar tabela project_documents
CREATE TABLE IF NOT EXISTS project_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  
  -- Informações do documento
  name TEXT NOT NULL,
  description TEXT,
  
  -- Status (usa os mesmos do projeto)
  status TEXT CHECK (status IN ('Planejamento', 'Em andamento', 'Concluído', 'Pausado', 'Cancelado')),
  
  -- Compartilhamento
  is_private BOOLEAN DEFAULT false,
  shared_with TEXT[] DEFAULT '{}',
  
  -- Vinculação com documentos financeiros
  finance_doc_count INTEGER DEFAULT 0,
  
  -- Datas
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_project_documents_project_id ON project_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_user_id ON project_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_workspace_id ON project_documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_status ON project_documents(status);
CREATE INDEX IF NOT EXISTS idx_project_documents_created_at ON project_documents(created_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_project_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_documents_updated_at
  BEFORE UPDATE ON project_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_project_documents_updated_at();

-- RLS (Row Level Security)
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Usuário pode ver seus próprios documentos
CREATE POLICY "Users can view own project documents"
  ON project_documents FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Usuário pode criar documentos em seus projetos
CREATE POLICY "Users can create project documents"
  ON project_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Usuário pode atualizar seus próprios documentos
CREATE POLICY "Users can update own project documents"
  ON project_documents FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Usuário pode deletar seus próprios documentos
CREATE POLICY "Users can delete own project documents"
  ON project_documents FOR DELETE
  USING (auth.uid() = user_id);

-- Comentários para documentação
COMMENT ON TABLE project_documents IS 'Documentos/itens dentro de cada projeto. Um projeto pode ter milhares de documentos.';
COMMENT ON COLUMN project_documents.project_id IS 'Projeto pai ao qual este documento pertence';
COMMENT ON COLUMN project_documents.name IS 'Nome do documento';
COMMENT ON COLUMN project_documents.status IS 'Status do documento (mesmo enum dos projetos)';
COMMENT ON COLUMN project_documents.finance_doc_count IS 'Quantidade de documentos financeiros vinculados';

-- Verificar se a tabela foi criada
SELECT 
  table_name,
  column_name,
  data_type 
FROM information_schema.columns 
WHERE table_name = 'project_documents'
ORDER BY ordinal_position;
