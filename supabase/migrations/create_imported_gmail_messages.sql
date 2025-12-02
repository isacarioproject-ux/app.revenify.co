-- Tabela para rastrear emails já importados (evitar duplicatas)
CREATE TABLE IF NOT EXISTS imported_gmail_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  
  -- ID único do email no Gmail
  gmail_message_id TEXT NOT NULL,
  
  -- ID da transação criada
  transaction_id UUID REFERENCES finance_transactions(id) ON DELETE SET NULL,
  
  -- Dados do email
  from_email TEXT,
  subject TEXT,
  received_date TIMESTAMPTZ,
  
  -- Dados extraídos
  amount DECIMAL(10,2),
  due_date DATE,
  category TEXT,
  
  -- PDF anexado
  attachment_url TEXT,
  
  -- Metadados
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  imported_by UUID REFERENCES auth.users(id),
  
  -- Constraint único
  UNIQUE(workspace_id, gmail_message_id)
);

-- Índices
CREATE INDEX idx_imported_gmail_workspace ON imported_gmail_messages(workspace_id);
CREATE INDEX idx_imported_gmail_message_id ON imported_gmail_messages(gmail_message_id);
CREATE INDEX idx_imported_gmail_transaction ON imported_gmail_messages(transaction_id);

-- RLS
ALTER TABLE imported_gmail_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their workspace imported messages"
  ON imported_gmail_messages FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN workspace_members wm ON wm.workspace_id = w.id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert imported messages"
  ON imported_gmail_messages FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN workspace_members wm ON wm.workspace_id = w.id
      WHERE wm.user_id = auth.uid()
    )
  );

-- Verificar
SELECT 'Tabela imported_gmail_messages criada com sucesso!' as status;
