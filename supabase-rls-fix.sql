-- =====================================================
-- EXECUTE ESTE SQL NO SUPABASE DASHBOARD > SQL EDITOR
-- Para corrigir os erros 404/406 no console
-- =====================================================

-- 1. Create webhooks table if not exists
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id)
);

-- 2. Enable RLS on webhooks
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- 3. RLS policy for webhooks
DROP POLICY IF EXISTS "Users can manage their project webhooks" ON webhooks;
CREATE POLICY "Users can manage their project webhooks" ON webhooks 
  FOR ALL 
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())) 
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- 4. Fix RLS for sso_configs
DROP POLICY IF EXISTS "Users can manage their own SSO config" ON sso_configs;
CREATE POLICY "Users can manage their own SSO config" ON sso_configs 
  FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- 5. Fix RLS for integrations
DROP POLICY IF EXISTS "Users can manage their project integrations" ON integrations;
CREATE POLICY "Users can manage their project integrations" ON integrations 
  FOR ALL 
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())) 
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- 6. Create revenue_attributions table for Revenue Attribution API
CREATE TABLE IF NOT EXISTS revenue_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  transaction_id TEXT,
  source TEXT,
  medium TEXT,
  campaign TEXT,
  first_touch_source TEXT,
  first_touch_medium TEXT,
  first_touch_campaign TEXT,
  last_touch_source TEXT,
  last_touch_medium TEXT,
  last_touch_campaign TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Enable RLS on revenue_attributions
ALTER TABLE revenue_attributions ENABLE ROW LEVEL SECURITY;

-- 8. RLS policy for revenue_attributions
DROP POLICY IF EXISTS "Users can manage their project revenue attributions" ON revenue_attributions;
CREATE POLICY "Users can manage their project revenue attributions" ON revenue_attributions 
  FOR ALL 
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())) 
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- 9. Create webhook_logs table for logging webhook dispatches
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

-- 10. Enable RLS on webhook_logs
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- 11. RLS policy for webhook_logs
DROP POLICY IF EXISTS "Users can view their project webhook logs" ON webhook_logs;
CREATE POLICY "Users can view their project webhook logs" ON webhook_logs 
  FOR SELECT 
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- 12. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_revenue_attributions_project ON revenue_attributions(project_id);
CREATE INDEX IF NOT EXISTS idx_revenue_attributions_visitor ON revenue_attributions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_project ON webhook_logs(project_id);

-- 13. Add new columns to short_links for Password Protection, A/B Testing, and Geo Targeting
ALTER TABLE short_links ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE short_links ADD COLUMN IF NOT EXISTS ab_test_enabled BOOLEAN DEFAULT false;
ALTER TABLE short_links ADD COLUMN IF NOT EXISTS ab_test_url TEXT;
ALTER TABLE short_links ADD COLUMN IF NOT EXISTS ab_test_split INTEGER DEFAULT 50;
ALTER TABLE short_links ADD COLUMN IF NOT EXISTS geo_targeting JSONB;

-- =====================================================
-- APÓS EXECUTAR, RECARREGUE A PÁGINA (Ctrl+F5)
-- Os erros 404/406 devem desaparecer
-- =====================================================
