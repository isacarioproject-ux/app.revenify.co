-- =============================================
-- CRIAR TRIGGERS DE ATRIBUIÇÃO
-- Execute no Supabase SQL Editor
-- =============================================

-- 1. FUNÇÃO: Atribuir source_id ao evento baseado em UTM
CREATE OR REPLACE FUNCTION public.assign_event_source()
RETURNS TRIGGER AS $$
DECLARE
  v_source_id UUID;
BEGIN
  -- Se já tem source_id, não fazer nada
  IF NEW.source_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Buscar source pelo utm_campaign
  IF NEW.utm_campaign IS NOT NULL THEN
    SELECT id INTO v_source_id
    FROM public.sources
    WHERE project_id = NEW.project_id
      AND utm_campaign = NEW.utm_campaign
    LIMIT 1;
  END IF;
  
  -- Se não encontrou, buscar por utm_source
  IF v_source_id IS NULL AND NEW.utm_source IS NOT NULL THEN
    SELECT id INTO v_source_id
    FROM public.sources
    WHERE project_id = NEW.project_id
      AND utm_source = NEW.utm_source
    LIMIT 1;
  END IF;
  
  NEW.source_id := v_source_id;
  
  -- Atualizar contador de visitantes
  IF v_source_id IS NOT NULL AND NEW.event_type = 'page_view' THEN
    UPDATE public.sources
    SET total_visitors = COALESCE(total_visitors, 0) + 1
    WHERE id = v_source_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_assign_event_source ON public.events;
CREATE TRIGGER trigger_assign_event_source
  BEFORE INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_event_source();

-- 2. FUNÇÃO: Atribuir source_id ao lead
CREATE OR REPLACE FUNCTION public.assign_lead_source()
RETURNS TRIGGER AS $$
DECLARE
  v_source_id UUID;
BEGIN
  IF NEW.source_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Buscar source_id do último evento da sessão
  SELECT source_id INTO v_source_id
  FROM public.events
  WHERE session_id = NEW.session_id
    AND project_id = NEW.project_id
    AND source_id IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 1;
  
  NEW.source_id := v_source_id;
  
  -- Atualizar contador de leads
  IF v_source_id IS NOT NULL THEN
    UPDATE public.sources
    SET total_leads = COALESCE(total_leads, 0) + 1
    WHERE id = v_source_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_assign_lead_source ON public.leads;
CREATE TRIGGER trigger_assign_lead_source
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_lead_source();

-- 3. ATUALIZAR FUNÇÃO assign_payment_source (já existe, vamos melhorar)
CREATE OR REPLACE FUNCTION public.assign_payment_source()
RETURNS TRIGGER AS $$
DECLARE
  v_source_id UUID;
BEGIN
  IF NEW.source_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Buscar source_id do último evento da sessão
  SELECT source_id INTO v_source_id
  FROM public.events
  WHERE session_id = NEW.session_id
    AND project_id = NEW.project_id
    AND source_id IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Se não encontrou por sessão, buscar por visitor_id (first touch)
  IF v_source_id IS NULL AND NEW.visitor_id IS NOT NULL THEN
    SELECT source_id INTO v_source_id
    FROM public.touchpoints
    WHERE visitor_id = NEW.visitor_id
      AND project_id = NEW.project_id
      AND source_id IS NOT NULL
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;
  
  NEW.source_id := v_source_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. ATUALIZAR FUNÇÃO update_source_revenue (já existe, vamos melhorar)
CREATE OR REPLACE FUNCTION public.update_source_revenue()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.source_id IS NOT NULL THEN
    UPDATE public.sources
    SET 
      total_revenue = COALESCE(total_revenue, 0) + NEW.amount,
      total_payments = COALESCE(total_payments, 0) + 1
    WHERE id = NEW.source_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. FUNÇÃO: Criar touchpoint automaticamente
CREATE OR REPLACE FUNCTION public.create_touchpoint()
RETURNS TRIGGER AS $$
DECLARE
  v_touchpoint_exists BOOLEAN;
BEGIN
  -- Só criar se tiver visitor_id e UTM
  IF NEW.visitor_id IS NULL OR NEW.utm_source IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Verificar se já existe touchpoint igual (evitar duplicatas)
  SELECT EXISTS(
    SELECT 1 FROM public.touchpoints
    WHERE visitor_id = NEW.visitor_id
      AND session_id = NEW.session_id
      AND project_id = NEW.project_id
  ) INTO v_touchpoint_exists;
  
  IF NOT v_touchpoint_exists THEN
    INSERT INTO public.touchpoints (
      project_id, visitor_id, session_id, source_id,
      touchpoint_type, page_url, referrer,
      utm_source, utm_medium, utm_campaign
    ) VALUES (
      NEW.project_id, NEW.visitor_id, NEW.session_id, NEW.source_id,
      'visit', NEW.page_url, NEW.referrer,
      NEW.utm_source, NEW.utm_medium, NEW.utm_campaign
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_touchpoint ON public.events;
CREATE TRIGGER trigger_create_touchpoint
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.create_touchpoint();

-- =============================================
-- VERIFICAR
-- =============================================
SELECT 'Triggers criados com sucesso!' as status;

SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
