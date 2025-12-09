-- =============================================
-- SCRIPT DE VERIFICAÇÃO DO SCHEMA
-- Execute no Supabase SQL Editor para ver o estado atual
-- =============================================

-- 1. LISTAR TODAS AS TABELAS
SELECT '=== TABELAS EXISTENTES ===' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. VERIFICAR TABELAS CRÍTICAS PARA JORNADA
SELECT '=== VERIFICAÇÃO DE TABELAS CRÍTICAS ===' as info;
SELECT 
  'touchpoints' as tabela,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'touchpoints' AND table_schema = 'public') 
    THEN '✅ EXISTE' ELSE '❌ NÃO EXISTE' END as status
UNION ALL
SELECT 
  'payments' as tabela,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments' AND table_schema = 'public') 
    THEN '✅ EXISTE' ELSE '❌ NÃO EXISTE' END as status
UNION ALL
SELECT 
  'integrations' as tabela,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'integrations' AND table_schema = 'public') 
    THEN '✅ EXISTE' ELSE '❌ NÃO EXISTE' END as status
UNION ALL
SELECT 
  'consent_logs' as tabela,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'consent_logs' AND table_schema = 'public') 
    THEN '✅ EXISTE' ELSE '❌ NÃO EXISTE' END as status;

-- 3. VERIFICAR COLUNAS CRÍTICAS EM EVENTS
SELECT '=== COLUNAS EM EVENTS ===' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. VERIFICAR COLUNAS CRÍTICAS EM SOURCES
SELECT '=== COLUNAS EM SOURCES ===' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sources' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. VERIFICAR COLUNAS CRÍTICAS EM LEADS
SELECT '=== COLUNAS EM LEADS ===' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. VERIFICAR TRIGGERS
SELECT '=== TRIGGERS EXISTENTES ===' as info;
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 7. VERIFICAR FUNCTIONS
SELECT '=== FUNCTIONS DE ATRIBUIÇÃO ===' as info;
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'assign_event_source',
  'assign_lead_source', 
  'assign_payment_source',
  'update_source_revenue',
  'create_touchpoint'
);
