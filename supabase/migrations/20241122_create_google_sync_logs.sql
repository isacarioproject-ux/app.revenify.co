-- Tabela para rastrear todas as sincronizações do Google
-- Útil para debugging, analytics e monitoring

CREATE TABLE IF NOT EXISTS google_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Qual serviço foi usado
  service TEXT NOT NULL CHECK (service IN ('gmail', 'calendar', 'sheets', 'drive')),
  
  -- Qual operação foi realizada
  operation TEXT NOT NULL CHECK (operation IN (
    'auto_import',      -- Importação automática (cron)
    'manual_import',    -- Importação manual (usuário clicou)
    'sync',             -- Sincronização
    'export',           -- Exportação
    'webhook'           -- Processamento de webhook
  )),
  
  -- Status da operação
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  
  -- Metadados (JSON flexível)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Mensagem de erro (se houver)
  error_message TEXT,
  
  -- Duração em milissegundos
  duration_ms INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_google_sync_logs_user ON google_sync_logs(user_id);
CREATE INDEX idx_google_sync_logs_workspace ON google_sync_logs(workspace_id);
CREATE INDEX idx_google_sync_logs_service ON google_sync_logs(service);
CREATE INDEX idx_google_sync_logs_status ON google_sync_logs(status);
CREATE INDEX idx_google_sync_logs_created ON google_sync_logs(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_google_sync_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER google_sync_logs_updated_at
  BEFORE UPDATE ON google_sync_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_google_sync_logs_updated_at();

-- RLS (Row Level Security)
ALTER TABLE google_sync_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Usuário pode ver seus próprios logs
CREATE POLICY "Users can view their own sync logs"
  ON google_sync_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Sistema pode inserir logs (service_role only)
CREATE POLICY "Service role can insert sync logs"
  ON google_sync_logs FOR INSERT
  WITH CHECK (true);

-- Comentários para documentação
COMMENT ON TABLE google_sync_logs IS 'Rastreia todas as operações de sincronização do Google';
COMMENT ON COLUMN google_sync_logs.metadata IS 'Dados flexíveis específicos de cada operação';
COMMENT ON COLUMN google_sync_logs.duration_ms IS 'Duração da operação em milissegundos';

-- View para analytics (últimos 7 dias)
CREATE OR REPLACE VIEW google_sync_stats AS
SELECT 
  service,
  operation,
  COUNT(*) as total_operations,
  COUNT(*) FILTER (WHERE status = 'success') as success_count,
  COUNT(*) FILTER (WHERE status = 'error') as error_count,
  ROUND(AVG(duration_ms)) as avg_duration_ms,
  MAX(created_at) as last_sync_at
FROM google_sync_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY service, operation
ORDER BY total_operations DESC;

-- Verificar
SELECT 'Tabela google_sync_logs criada com sucesso!' as status;
