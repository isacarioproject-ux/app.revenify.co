-- =====================================================
-- Fix RLS policies for project_drive_files
-- Permitir workspace_id NULL para modo pessoal
-- Melhorar políticas para incluir membros do workspace
-- =====================================================

-- 1. Permitir workspace_id NULL
ALTER TABLE project_drive_files 
  ALTER COLUMN workspace_id DROP NOT NULL;

-- 2. Remover políticas antigas
DROP POLICY IF EXISTS "Users can view project files from their workspaces" ON project_drive_files;
DROP POLICY IF EXISTS "Users can insert project files in their workspaces" ON project_drive_files;
DROP POLICY IF EXISTS "Users can update project files in their workspaces" ON project_drive_files;
DROP POLICY IF EXISTS "Users can delete project files in their workspaces" ON project_drive_files;

-- 3. Criar novas políticas corrigidas

-- SELECT: Pode ver se é o próprio usuário OU se é membro do workspace
CREATE POLICY "project_drive_files_select"
  ON project_drive_files FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- INSERT: Pode inserir se é o próprio usuário OU se é membro do workspace
CREATE POLICY "project_drive_files_insert"
  ON project_drive_files FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      workspace_id IS NULL
      OR
      workspace_id IN (
        SELECT workspace_id FROM workspace_members 
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- UPDATE: Pode atualizar se é o próprio usuário OU se é admin/owner do workspace
CREATE POLICY "project_drive_files_update"
  ON project_drive_files FOR UPDATE
  USING (
    user_id = auth.uid()
    OR
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner', 'admin')
    )
  );

-- DELETE: Pode deletar se é o próprio usuário OU se é admin/owner do workspace
CREATE POLICY "project_drive_files_delete"
  ON project_drive_files FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- Mesma correção para task_drive_attachments
-- =====================================================

ALTER TABLE task_drive_attachments 
  ALTER COLUMN workspace_id DROP NOT NULL;

DROP POLICY IF EXISTS "Users can view task attachments from their workspaces" ON task_drive_attachments;
DROP POLICY IF EXISTS "Users can insert task attachments in their workspaces" ON task_drive_attachments;
DROP POLICY IF EXISTS "Users can delete task attachments in their workspaces" ON task_drive_attachments;

CREATE POLICY "task_drive_attachments_select"
  ON task_drive_attachments FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "task_drive_attachments_insert"
  ON task_drive_attachments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      workspace_id IS NULL
      OR
      workspace_id IN (
        SELECT workspace_id FROM workspace_members 
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

CREATE POLICY "task_drive_attachments_delete"
  ON task_drive_attachments FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- Mesma correção para transaction_receipts
-- =====================================================

ALTER TABLE transaction_receipts 
  ALTER COLUMN workspace_id DROP NOT NULL;

DROP POLICY IF EXISTS "Users can view receipts from their workspaces" ON transaction_receipts;
DROP POLICY IF EXISTS "Users can insert receipts in their workspaces" ON transaction_receipts;
DROP POLICY IF EXISTS "Users can delete receipts in their workspaces" ON transaction_receipts;

-- Adicionar coluna user_id se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transaction_receipts' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE transaction_receipts ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

CREATE POLICY "transaction_receipts_select"
  ON transaction_receipts FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "transaction_receipts_insert"
  ON transaction_receipts FOR INSERT
  WITH CHECK (
    (user_id IS NULL OR user_id = auth.uid())
    AND (
      workspace_id IS NULL
      OR
      workspace_id IN (
        SELECT workspace_id FROM workspace_members 
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

CREATE POLICY "transaction_receipts_delete"
  ON transaction_receipts FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner', 'admin')
    )
  );
