-- Tabela para armazenar tokens de integração Google OAuth
CREATE TABLE IF NOT EXISTS google_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  
  -- Tokens OAuth
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  
  -- Scopes autorizados
  scopes TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Email da conta Google
  google_email TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Configurações de serviços
  settings JSONB DEFAULT '{
    "gmail": {
      "enabled": true,
      "auto_import": true
    },
    "calendar": {
      "enabled": true,
      "sync_tasks": true
    },
    "sheets": {
      "enabled": true
    }
  }'::jsonb,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint único por usuário e workspace
  UNIQUE(user_id, workspace_id)
);

-- Índices para performance
CREATE INDEX idx_google_integrations_user ON google_integrations(user_id);
CREATE INDEX idx_google_integrations_workspace ON google_integrations(workspace_id);
CREATE INDEX idx_google_integrations_active ON google_integrations(is_active) WHERE is_active = true;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_google_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER google_integrations_updated_at
  BEFORE UPDATE ON google_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_google_integrations_updated_at();

-- RLS (Row Level Security)
ALTER TABLE google_integrations ENABLE ROW LEVEL SECURITY;

-- Policy: Usuário pode ver suas próprias integrações
CREATE POLICY "Users can view their own integrations"
  ON google_integrations FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Usuário pode inserir suas próprias integrações
CREATE POLICY "Users can insert their own integrations"
  ON google_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Usuário pode atualizar suas próprias integrações
CREATE POLICY "Users can update their own integrations"
  ON google_integrations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Usuário pode deletar suas próprias integrações
CREATE POLICY "Users can delete their own integrations"
  ON google_integrations FOR DELETE
  USING (auth.uid() = user_id);

-- Verificar
SELECT 'Tabela google_integrations criada com sucesso!' as status;
