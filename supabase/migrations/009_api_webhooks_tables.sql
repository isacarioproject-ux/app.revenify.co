-- Migration: API e Webhooks
-- Cria tabelas necessárias para API externa e Webhooks

-- Adiciona campo api_key na tabela integrations
ALTER TABLE integrations 
ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE;

-- Gera API key para integrações existentes
UPDATE integrations 
SET api_key = 'rev_' || encode(gen_random_bytes(24), 'hex')
WHERE api_key IS NULL;

-- Tabela de webhooks configurados
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'all', -- all, event.created, lead.created, revenue.attributed
  is_active BOOLEAN DEFAULT true,
  secret TEXT, -- para validação HMAC
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id, url, event_type)
);

-- Índices para webhooks
CREATE INDEX IF NOT EXISTS idx_webhooks_project ON webhooks(project_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(project_id, is_active);

-- Tabela de logs de webhooks
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  webhook_url TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB,
  status_code INTEGER,
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para buscar logs recentes
CREATE INDEX IF NOT EXISTS idx_webhook_logs_project_time ON webhook_logs(project_id, created_at DESC);

-- Limpar logs antigos (mais de 7 dias) automaticamente
CREATE OR REPLACE FUNCTION cleanup_old_webhook_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM webhook_logs WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- RLS para webhooks
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project webhooks"
  ON webhooks FOR SELECT
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own project webhooks"
  ON webhooks FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own project webhooks"
  ON webhooks FOR UPDATE
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own project webhooks"
  ON webhooks FOR DELETE
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- RLS para webhook_logs
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project webhook logs"
  ON webhook_logs FOR SELECT
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- Função para incrementar contagem de eventos
CREATE OR REPLACE FUNCTION increment_event_count(p_project_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE usage_stats 
  SET events_count = events_count + 1,
      updated_at = NOW()
  WHERE project_id = p_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar updated_at em webhooks
CREATE OR REPLACE FUNCTION update_webhooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER webhooks_updated_at
  BEFORE UPDATE ON webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_webhooks_updated_at();

-- Comentários
COMMENT ON TABLE webhooks IS 'Configurações de webhooks para notificações externas';
COMMENT ON TABLE webhook_logs IS 'Logs de tentativas de envio de webhooks';
COMMENT ON COLUMN integrations.api_key IS 'Chave de API para acesso externo';
