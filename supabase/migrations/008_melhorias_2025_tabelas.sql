-- =============================================
-- MELHORIAS 2025 - TABELAS BASE
-- Execute no Supabase SQL Editor
-- =============================================

-- 1. CAMPOS ADICIONAIS EM PROJECTS
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS events_count_current_month INTEGER DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS short_links_count INTEGER DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS last_reset_at TIMESTAMPTZ DEFAULT NOW();

-- 2. TABELA: plan_limits
CREATE TABLE IF NOT EXISTS public.plan_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name TEXT NOT NULL UNIQUE,
  events_per_month INTEGER NOT NULL,
  short_links_limit INTEGER NOT NULL,
  projects_limit INTEGER NOT NULL,
  ai_messages_limit INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir limites padrão
INSERT INTO public.plan_limits (plan_name, events_per_month, short_links_limit, projects_limit, ai_messages_limit)
VALUES
  ('free', 10000, 25, 1, 10),
  ('starter', 100000, 100, 3, 50),
  ('pro', 500000, 500, 10, 200),
  ('business', 2000000, 2000, 50, 1000)
ON CONFLICT (plan_name) DO NOTHING;

-- 3. TABELA: usage_history
CREATE TABLE IF NOT EXISTS public.usage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  events_count INTEGER DEFAULT 0,
  short_links_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, month_year)
);

CREATE INDEX IF NOT EXISTS idx_usage_history_project ON public.usage_history(project_id, month_year DESC);

-- 4. TABELA: short_links
CREATE TABLE IF NOT EXISTS public.short_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  short_code TEXT NOT NULL UNIQUE,
  destination_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  source_id UUID REFERENCES public.sources(id) ON DELETE SET NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  password_hash TEXT,
  clicks_count INTEGER DEFAULT 0,
  unique_clicks_count INTEGER DEFAULT 0,
  last_clicked_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own short_links" ON public.short_links 
  FOR SELECT USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert short_links" ON public.short_links 
  FOR INSERT WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own short_links" ON public.short_links 
  FOR UPDATE USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own short_links" ON public.short_links 
  FOR DELETE USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_short_links_project ON public.short_links(project_id);
CREATE INDEX IF NOT EXISTS idx_short_links_code ON public.short_links(short_code);

-- 5. TABELA: short_link_clicks
CREATE TABLE IF NOT EXISTS public.short_link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_link_id UUID NOT NULL REFERENCES public.short_links(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  country_code TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_short_link_clicks_link ON public.short_link_clicks(short_link_id);
CREATE INDEX IF NOT EXISTS idx_short_link_clicks_created ON public.short_link_clicks(created_at);

-- 6. TABELA: utm_templates
CREATE TABLE IF NOT EXISTS public.utm_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  utm_source TEXT NOT NULL,
  utm_medium TEXT NOT NULL,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  referral_url TEXT,
  times_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.utm_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own templates" ON public.utm_templates 
  FOR SELECT USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert templates" ON public.utm_templates 
  FOR INSERT WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own templates" ON public.utm_templates 
  FOR UPDATE USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own templates" ON public.utm_templates 
  FOR DELETE USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_utm_templates_project ON public.utm_templates(project_id);

-- 7. TABELAS AI ASSISTANT
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own ai_conversations" ON public.ai_conversations 
  FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert ai_conversations" ON public.ai_conversations 
  FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_project ON public.ai_conversations(project_id);

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON public.ai_messages(conversation_id);

CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  messages_count INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON public.ai_usage(user_id, month_year);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function: Reset mensal
CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.usage_history (project_id, month_year, events_count, short_links_count)
  SELECT 
    id,
    TO_CHAR(NOW() - INTERVAL '1 month', 'YYYY-MM'),
    events_count_current_month,
    short_links_count
  FROM public.projects
  WHERE events_count_current_month > 0;

  UPDATE public.projects
  SET events_count_current_month = 0,
      last_reset_at = NOW();
END;
$$;

-- Function: Check usage limits
CREATE OR REPLACE FUNCTION public.check_usage_limits(p_project_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_project RECORD;
  v_subscription RECORD;
  v_limits RECORD;
  v_projects_count INTEGER;
BEGIN
  SELECT * INTO v_project FROM public.projects WHERE id = p_project_id;
  
  SELECT * INTO v_subscription FROM public.subscriptions WHERE user_id = v_project.user_id;
  
  SELECT * INTO v_limits FROM public.plan_limits WHERE plan_name = COALESCE(v_subscription.plan, 'free');
  
  SELECT COUNT(*) INTO v_projects_count FROM public.projects WHERE user_id = v_project.user_id;

  RETURN json_build_object(
    'events', json_build_object(
      'used', COALESCE(v_project.events_count_current_month, 0),
      'limit', COALESCE(v_limits.events_per_month, 10000),
      'percentage', ROUND((COALESCE(v_project.events_count_current_month, 0)::FLOAT / NULLIF(v_limits.events_per_month, 0)::FLOAT) * 100, 1),
      'exceeded', COALESCE(v_project.events_count_current_month, 0) >= COALESCE(v_limits.events_per_month, 10000)
    ),
    'short_links', json_build_object(
      'used', COALESCE(v_project.short_links_count, 0),
      'limit', COALESCE(v_limits.short_links_limit, 25),
      'percentage', ROUND((COALESCE(v_project.short_links_count, 0)::FLOAT / NULLIF(v_limits.short_links_limit, 0)::FLOAT) * 100, 1),
      'exceeded', COALESCE(v_project.short_links_count, 0) >= COALESCE(v_limits.short_links_limit, 25)
    ),
    'projects', json_build_object(
      'used', v_projects_count,
      'limit', COALESCE(v_limits.projects_limit, 1),
      'exceeded', v_projects_count >= COALESCE(v_limits.projects_limit, 1)
    ),
    'plan', COALESCE(v_subscription.plan, 'free')
  );
END;
$$;

-- Function: Generate short code
CREATE OR REPLACE FUNCTION public.generate_short_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := substr(md5(random()::text), 1, 7);
    SELECT EXISTS(SELECT 1 FROM public.short_links WHERE short_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger: Increment events counter
CREATE OR REPLACE FUNCTION public.increment_events_counter()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.projects
  SET events_count_current_month = COALESCE(events_count_current_month, 0) + 1
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_increment_events_counter ON public.events;
CREATE TRIGGER trigger_increment_events_counter
AFTER INSERT ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.increment_events_counter();

-- Trigger: Increment short links counter
CREATE OR REPLACE FUNCTION public.increment_short_links_counter()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.projects
  SET short_links_count = COALESCE(short_links_count, 0) + 1
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_increment_short_links ON public.short_links;
CREATE TRIGGER trigger_increment_short_links
AFTER INSERT ON public.short_links
FOR EACH ROW
EXECUTE FUNCTION public.increment_short_links_counter();

-- Trigger: Increment click counter
CREATE OR REPLACE FUNCTION public.increment_click_counter()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.short_links
  SET clicks_count = COALESCE(clicks_count, 0) + 1,
      last_clicked_at = NOW()
  WHERE id = NEW.short_link_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_increment_clicks ON public.short_link_clicks;
CREATE TRIGGER trigger_increment_clicks
AFTER INSERT ON public.short_link_clicks
FOR EACH ROW
EXECUTE FUNCTION public.increment_click_counter();

-- =============================================
-- AI ASSISTANT FUNCTIONS
-- =============================================

-- Function para checar limites de IA
CREATE OR REPLACE FUNCTION public.check_ai_usage_limit(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_subscription RECORD;
  v_current_month TEXT;
  v_messages_count INT;
  v_limit INT;
BEGIN
  v_current_month := TO_CHAR(NOW(), 'YYYY-MM');

  -- Buscar subscription do usuário
  SELECT * INTO v_subscription FROM public.subscriptions WHERE user_id = p_user_id;

  -- Determinar limite baseado no plano
  CASE COALESCE(v_subscription.plan, 'free')
    WHEN 'free' THEN v_limit := 10;
    WHEN 'starter' THEN v_limit := 50;
    WHEN 'pro' THEN v_limit := 200;
    WHEN 'business' THEN v_limit := 1000;
    ELSE v_limit := 10;
  END CASE;

  -- Buscar uso do mês
  SELECT COALESCE(messages_count, 0) INTO v_messages_count
  FROM public.ai_usage
  WHERE user_id = p_user_id AND month_year = v_current_month;

  IF v_messages_count IS NULL THEN
    v_messages_count := 0;
  END IF;

  RETURN json_build_object(
    'used', v_messages_count,
    'limit', v_limit,
    'percentage', ROUND((v_messages_count::FLOAT / NULLIF(v_limit::FLOAT, 0)) * 100, 1),
    'exceeded', v_messages_count >= v_limit,
    'remaining', GREATEST(0, v_limit - v_messages_count)
  );
END;
$$;

-- Trigger para incrementar uso de IA
CREATE OR REPLACE FUNCTION public.increment_ai_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_month_year TEXT;
  v_user_id UUID;
BEGIN
  -- Buscar user_id da conversation
  SELECT user_id INTO v_user_id
  FROM public.ai_conversations
  WHERE id = NEW.conversation_id;

  v_month_year := TO_CHAR(NOW(), 'YYYY-MM');

  -- Incrementar contador
  INSERT INTO public.ai_usage (user_id, month_year, messages_count, tokens_used)
  VALUES (v_user_id, v_month_year, 1, COALESCE(NEW.tokens_used, 0))
  ON CONFLICT (user_id, month_year)
  DO UPDATE SET
    messages_count = public.ai_usage.messages_count + 1,
    tokens_used = public.ai_usage.tokens_used + COALESCE(NEW.tokens_used, 0);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_increment_ai_usage ON public.ai_messages;
CREATE TRIGGER trigger_increment_ai_usage
AFTER INSERT ON public.ai_messages
FOR EACH ROW
WHEN (NEW.role = 'user')
EXECUTE FUNCTION public.increment_ai_usage();

-- =============================================
-- VERIFICAR
-- =============================================
SELECT 'Tabelas Melhorias 2025 criadas!' as status;

SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('plan_limits', 'usage_history', 'short_links', 'short_link_clicks', 'utm_templates', 'ai_conversations', 'ai_messages', 'ai_usage')
ORDER BY table_name;
