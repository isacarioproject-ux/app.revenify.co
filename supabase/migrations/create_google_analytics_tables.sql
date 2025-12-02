-- ============================================
-- GOOGLE ANALYTICS - TABELAS E FUNÇÕES
-- ============================================

-- 1. Tabela de Logs de Sincronização
CREATE TABLE IF NOT EXISTS google_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  service TEXT NOT NULL CHECK (service IN ('gmail', 'calendar', 'sheets', 'drive')),
  operation TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_google_sync_logs_workspace 
  ON google_sync_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_google_sync_logs_created 
  ON google_sync_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_google_sync_logs_service 
  ON google_sync_logs(service);

-- 2. Tabela de Estatísticas Agregadas
CREATE TABLE IF NOT EXISTS google_sync_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  service TEXT NOT NULL,
  operation TEXT NOT NULL,
  total_operations INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  avg_duration_ms NUMERIC DEFAULT 0,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice único para evitar duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS idx_google_sync_stats_unique 
  ON google_sync_stats(workspace_id, service, operation);

-- 3. Função para Atualizar Estatísticas
CREATE OR REPLACE FUNCTION refresh_google_sync_stats()
RETURNS void AS $$
BEGIN
  -- Limpar stats antigas (opcional)
  -- DELETE FROM google_sync_stats;

  -- Inserir/atualizar stats baseado nos logs
  INSERT INTO google_sync_stats (
    workspace_id, 
    service, 
    operation,
    total_operations, 
    success_count, 
    error_count,
    avg_duration_ms, 
    last_sync_at
  )
  SELECT 
    workspace_id,
    service,
    operation,
    COUNT(*) as total_operations,
    COUNT(*) FILTER (WHERE status = 'success') as success_count,
    COUNT(*) FILTER (WHERE status = 'error') as error_count,
    ROUND(AVG(duration_ms)::numeric, 0) as avg_duration_ms,
    MAX(created_at) as last_sync_at
  FROM google_sync_logs
  WHERE workspace_id IS NOT NULL
  GROUP BY workspace_id, service, operation
  ON CONFLICT (workspace_id, service, operation) 
  DO UPDATE SET
    total_operations = EXCLUDED.total_operations,
    success_count = EXCLUDED.success_count,
    error_count = EXCLUDED.error_count,
    avg_duration_ms = EXCLUDED.avg_duration_ms,
    last_sync_at = EXCLUDED.last_sync_at,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RLS (Row Level Security)
ALTER TABLE google_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_sync_stats ENABLE ROW LEVEL SECURITY;

-- Policy para Logs: usuários podem ver logs do seu workspace
DROP POLICY IF EXISTS "Users can view logs from their workspace" ON google_sync_logs;
CREATE POLICY "Users can view logs from their workspace"
  ON google_sync_logs FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy para Logs: serviços podem inserir logs
DROP POLICY IF EXISTS "Services can insert logs" ON google_sync_logs;
CREATE POLICY "Services can insert logs"
  ON google_sync_logs FOR INSERT
  WITH CHECK (true);

-- Policy para Stats: usuários podem ver stats do seu workspace
DROP POLICY IF EXISTS "Users can view stats from their workspace" ON google_sync_stats;
CREATE POLICY "Users can view stats from their workspace"
  ON google_sync_stats FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- 5. Trigger para atualizar stats automaticamente (opcional)
CREATE OR REPLACE FUNCTION trigger_update_google_sync_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar stats quando novo log é inserido
  PERFORM refresh_google_sync_stats();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_update_google_sync_stats ON google_sync_logs;
CREATE TRIGGER auto_update_google_sync_stats
  AFTER INSERT ON google_sync_logs
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_update_google_sync_stats();

-- 6. Inserir dados de exemplo (para teste)
DO $$
DECLARE
  v_workspace_id UUID;
  v_user_id UUID;
BEGIN
  -- Pegar primeiro workspace
  SELECT id INTO v_workspace_id FROM workspaces LIMIT 1;
  -- Pegar usuário atual (se possível)
  SELECT auth.uid() INTO v_user_id;

  -- Se não encontrar workspace, criar um de teste
  IF v_workspace_id IS NULL THEN
    RAISE NOTICE 'Nenhum workspace encontrado. Pule os dados de exemplo.';
  ELSE
    -- Inserir logs de exemplo
    INSERT INTO google_sync_logs (workspace_id, user_id, service, operation, status, duration_ms, created_at)
    VALUES 
      (v_workspace_id, v_user_id, 'gmail', 'sync', 'success', 150, NOW() - INTERVAL '1 day'),
      (v_workspace_id, v_user_id, 'gmail', 'sync', 'success', 180, NOW() - INTERVAL '2 days'),
      (v_workspace_id, v_user_id, 'gmail', 'sync', 'error', 350, NOW() - INTERVAL '3 days'),
      (v_workspace_id, v_user_id, 'calendar', 'fetch', 'success', 200, NOW() - INTERVAL '1 day'),
      (v_workspace_id, v_user_id, 'calendar', 'fetch', 'success', 220, NOW() - INTERVAL '2 days'),
      (v_workspace_id, v_user_id, 'sheets', 'export', 'success', 300, NOW() - INTERVAL '1 day'),
      (v_workspace_id, v_user_id, 'sheets', 'export', 'error', 450, NOW() - INTERVAL '4 days'),
      (v_workspace_id, v_user_id, 'drive', 'sync', 'success', 500, NOW() - INTERVAL '2 days')
    ON CONFLICT DO NOTHING;

    -- Atualizar stats
    PERFORM refresh_google_sync_stats();

    RAISE NOTICE 'Dados de exemplo inseridos com sucesso!';
  END IF;
END $$;

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar se as tabelas foram criadas
DO $$
BEGIN
  RAISE NOTICE '✅ Tabelas criadas:';
  RAISE NOTICE '  - google_sync_logs: % registros', (SELECT COUNT(*) FROM google_sync_logs);
  RAISE NOTICE '  - google_sync_stats: % registros', (SELECT COUNT(*) FROM google_sync_stats);
END $$;
