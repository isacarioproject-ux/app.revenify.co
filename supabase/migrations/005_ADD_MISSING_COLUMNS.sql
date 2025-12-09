-- =============================================
-- ADICIONAR COLUNAS FALTANTES
-- Execute no Supabase SQL Editor
-- =============================================

-- 1. Adicionar visitor_id e customer_email na tabela PAYMENTS
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS visitor_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS customer_email TEXT;

CREATE INDEX IF NOT EXISTS idx_payments_visitor_id ON public.payments(visitor_id);

-- 2. Adicionar source_id na tabela EVENTS
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES public.sources(id);

CREATE INDEX IF NOT EXISTS idx_events_source_id ON public.events(source_id);

-- 3. Adicionar colunas de métricas na tabela SOURCES
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS total_payments INTEGER DEFAULT 0;
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS total_visitors INTEGER DEFAULT 0;
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS total_leads INTEGER DEFAULT 0;

-- 4. Adicionar source_id na tabela LEADS (se não existir)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES public.sources(id);

CREATE INDEX IF NOT EXISTS idx_leads_source_id ON public.leads(source_id);

-- =============================================
-- VERIFICAR RESULTADO
-- =============================================
SELECT 'Colunas adicionadas com sucesso!' as status;

-- Verificar payments
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'payments' AND column_name IN ('visitor_id', 'customer_email');

-- Verificar events
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'events' AND column_name = 'source_id';

-- Verificar sources
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'sources' AND column_name IN ('total_revenue', 'total_payments', 'total_visitors', 'total_leads');
