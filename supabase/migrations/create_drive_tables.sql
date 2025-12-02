-- =====================================================
-- Google Drive Integration Tables
-- =====================================================

-- Arquivos do Drive vinculados a projetos
CREATE TABLE IF NOT EXISTS project_drive_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  drive_file_id TEXT NOT NULL,
  drive_file_name TEXT NOT NULL,
  drive_file_type TEXT,
  drive_file_size BIGINT,
  drive_file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_project_drive_files_project ON project_drive_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_drive_files_workspace ON project_drive_files(workspace_id);
CREATE INDEX IF NOT EXISTS idx_project_drive_files_user ON project_drive_files(user_id);
CREATE INDEX IF NOT EXISTS idx_project_drive_files_drive_id ON project_drive_files(drive_file_id);

-- RLS
ALTER TABLE project_drive_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view project files from their workspaces"
  ON project_drive_files FOR SELECT
  USING (workspace_id IN (
    SELECT id FROM workspaces WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert project files in their workspaces"
  ON project_drive_files FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT id FROM workspaces WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update project files in their workspaces"
  ON project_drive_files FOR UPDATE
  USING (workspace_id IN (
    SELECT id FROM workspaces WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete project files in their workspaces"
  ON project_drive_files FOR DELETE
  USING (workspace_id IN (
    SELECT id FROM workspaces WHERE user_id = auth.uid()
  ));

-- =====================================================
-- Anexos do Drive em tasks
-- =====================================================

CREATE TABLE IF NOT EXISTS task_drive_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  drive_file_id TEXT NOT NULL,
  drive_file_name TEXT NOT NULL,
  drive_file_type TEXT,
  drive_file_size BIGINT,
  drive_file_url TEXT,
  attached_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_task_drive_attachments_task ON task_drive_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_drive_attachments_workspace ON task_drive_attachments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_task_drive_attachments_user ON task_drive_attachments(user_id);

-- RLS
ALTER TABLE task_drive_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view task attachments from their workspaces"
  ON task_drive_attachments FOR SELECT
  USING (workspace_id IN (
    SELECT id FROM workspaces WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert task attachments in their workspaces"
  ON task_drive_attachments FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT id FROM workspaces WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete task attachments in their workspaces"
  ON task_drive_attachments FOR DELETE
  USING (workspace_id IN (
    SELECT id FROM workspaces WHERE user_id = auth.uid()
  ));

-- =====================================================
-- Comprovantes do Drive em transações
-- =====================================================

CREATE TABLE IF NOT EXISTS transaction_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  drive_file_id TEXT NOT NULL,
  drive_file_name TEXT NOT NULL,
  drive_file_url TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_transaction_receipts_transaction ON transaction_receipts(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_receipts_workspace ON transaction_receipts(workspace_id);

-- RLS
ALTER TABLE transaction_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view receipts from their workspaces"
  ON transaction_receipts FOR SELECT
  USING (workspace_id IN (
    SELECT id FROM workspaces WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert receipts in their workspaces"
  ON transaction_receipts FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT id FROM workspaces WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete receipts in their workspaces"
  ON transaction_receipts FOR DELETE
  USING (workspace_id IN (
    SELECT id FROM workspaces WHERE user_id = auth.uid()
  ));

-- =====================================================
-- Trigger para updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_project_drive_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_drive_files_updated_at
  BEFORE UPDATE ON project_drive_files
  FOR EACH ROW
  EXECUTE FUNCTION update_project_drive_files_updated_at();

-- =====================================================
-- Column para sync de documentos com Drive
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'drive_file_id'
  ) THEN
    ALTER TABLE documents ADD COLUMN drive_file_id TEXT;
    ALTER TABLE documents ADD COLUMN drive_synced_at TIMESTAMPTZ;
    ALTER TABLE documents ADD COLUMN drive_sync_enabled BOOLEAN DEFAULT false;
    
    CREATE INDEX IF NOT EXISTS idx_documents_drive_file_id ON documents(drive_file_id);
  END IF;
END $$;

-- =====================================================
-- View para contar anexos por task
-- =====================================================

CREATE OR REPLACE VIEW task_attachment_counts AS
SELECT 
  task_id,
  COUNT(*) as attachments_count
FROM task_drive_attachments
GROUP BY task_id;
