-- =============================================
-- TABELAS COMPLETAS PARA JORNADA DO CLIENTE
-- Execute no Supabase SQL Editor
-- =============================================

-- 1. ADICIONAR visitor_id na tabela EVENTS
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS visitor_id TEXT;
CREATE INDEX IF NOT EXISTS idx_events_visitor_id ON public.events(visitor_id);

-- =============================================
-- TABELA: touchpoints (Multi-touch Attribution)
-- =============================================
CREATE TABLE IF NOT EXISTS public.touchpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  source_id UUID REFERENCES public.sources(id),
  touchpoint_type TEXT DEFAULT 'visit',
  touchpoint_order INTEGER DEFAULT 1,
  page_url TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  device_type TEXT,
  browser TEXT,
  country_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.touchpoints ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own touchpoints" ON public.touchpoints 
  FOR SELECT USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service can insert touchpoints" ON public.touchpoints 
  FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_touchpoints_project_id ON public.touchpoints(project_id);
CREATE INDEX IF NOT EXISTS idx_touchpoints_visitor_id ON public.touchpoints(visitor_id);
CREATE INDEX IF NOT EXISTS idx_touchpoints_session_id ON public.touchpoints(session_id);
CREATE INDEX IF NOT EXISTS idx_touchpoints_created_at ON public.touchpoints(created_at);

-- =============================================
-- TABELA: payments (Revenue Tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  visitor_id TEXT,
  session_id TEXT,
  source_id UUID REFERENCES public.sources(id),
  stripe_payment_id TEXT,
  stripe_customer_id TEXT,
  customer_email TEXT,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own payments" ON public.payments 
  FOR SELECT USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service can insert payments" ON public.payments 
  FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_payments_project_id ON public.payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_visitor_id ON public.payments(visitor_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at);

-- =============================================
-- TABELA: integrations (Stripe Connect)
-- =============================================
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'stripe',
  stripe_account_id TEXT,
  stripe_access_token TEXT,
  stripe_refresh_token TEXT,
  stripe_livemode BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, provider)
);

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own integrations" ON public.integrations 
  FOR SELECT USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own integrations" ON public.integrations 
  FOR INSERT WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own integrations" ON public.integrations 
  FOR UPDATE USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own integrations" ON public.integrations 
  FOR DELETE USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_integrations_project_id ON public.integrations(project_id);

-- =============================================
-- TABELA: consent_logs (GDPR/LGPD)
-- =============================================
CREATE TABLE IF NOT EXISTS public.consent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  consent_given BOOLEAN NOT NULL,
  consent_type TEXT DEFAULT 'analytics',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own consent_logs" ON public.consent_logs 
  FOR SELECT USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service can insert consent_logs" ON public.consent_logs 
  FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_consent_logs_project_id ON public.consent_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_visitor_id ON public.consent_logs(visitor_id);

-- =============================================
-- HABILITAR REALTIME
-- =============================================
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.touchpoints;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================
-- VERIFICAR
-- =============================================
SELECT 'Tabelas criadas com sucesso!' as status;

SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('touchpoints', 'payments', 'integrations', 'consent_logs')
ORDER BY table_name;
