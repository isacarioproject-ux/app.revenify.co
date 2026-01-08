-- Função para verificar limites de uso baseado no plano do usuário
-- Execute este SQL no Supabase SQL Editor

CREATE OR REPLACE FUNCTION check_usage_limits(p_user_id UUID)
RETURNS TABLE (
  plan TEXT,
  is_trial BOOLEAN,
  trial_ends_at TIMESTAMPTZ,
  trial_days_remaining INTEGER,
  is_blocked BOOLEAN,
  events_used BIGINT,
  events_limit INTEGER,
  short_links_used BIGINT,
  short_links_limit INTEGER,
  projects_used BIGINT,
  projects_limit INTEGER
) AS $$
DECLARE
  v_subscription RECORD;
  v_plan TEXT;
  v_is_trial BOOLEAN := FALSE;
  v_trial_ends_at TIMESTAMPTZ;
  v_trial_days_remaining INTEGER := 0;
  v_is_blocked BOOLEAN := FALSE;
  v_events_limit INTEGER;
  v_short_links_limit INTEGER;
  v_projects_limit INTEGER;
BEGIN
  -- Buscar subscription do usuário
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE user_id = p_user_id
  LIMIT 1;

  -- Determinar plano
  IF v_subscription IS NULL THEN
    v_plan := 'free';
  ELSE
    v_plan := COALESCE(v_subscription.plan, 'free');
    v_is_trial := COALESCE(v_subscription.is_trial, FALSE);
    v_trial_ends_at := v_subscription.trial_ends_at;
    
    -- Calcular dias restantes do trial
    IF v_is_trial AND v_trial_ends_at IS NOT NULL THEN
      v_trial_days_remaining := GREATEST(0, EXTRACT(DAY FROM (v_trial_ends_at - NOW())));
      -- Se trial expirou, bloquear
      IF v_trial_ends_at < NOW() THEN
        v_is_blocked := TRUE;
        v_plan := 'free';
      END IF;
    END IF;
  END IF;

  -- Definir limites baseado no plano (sincronizado com plans.ts)
  CASE v_plan
    WHEN 'free' THEN
      v_events_limit := 1000;
      v_short_links_limit := 25;
      v_projects_limit := 1;
    WHEN 'starter' THEN
      v_events_limit := 5000;
      v_short_links_limit := 100;
      v_projects_limit := 3;
    WHEN 'pro' THEN
      v_events_limit := 200000;
      v_short_links_limit := 1000;
      v_projects_limit := 10;
    WHEN 'business' THEN
      v_events_limit := 500000;
      v_short_links_limit := -1; -- Ilimitado
      v_projects_limit := -1; -- Ilimitado
    WHEN 'trial' THEN
      v_events_limit := 2000;
      v_short_links_limit := 50;
      v_projects_limit := 3;
    ELSE
      v_events_limit := 1000;
      v_short_links_limit := 25;
      v_projects_limit := 1;
  END CASE;

  -- Retornar dados
  RETURN QUERY
  SELECT
    v_plan,
    v_is_trial,
    v_trial_ends_at,
    v_trial_days_remaining,
    v_is_blocked,
    COALESCE((
      SELECT SUM(COALESCE(p.events_count_current_month, 0))
      FROM projects p
      WHERE p.user_id = p_user_id
    ), 0)::BIGINT AS events_used,
    v_events_limit,
    COALESCE((
      SELECT SUM(COALESCE(p.short_links_count, 0))
      FROM projects p
      WHERE p.user_id = p_user_id
    ), 0)::BIGINT AS short_links_used,
    v_short_links_limit,
    COALESCE((
      SELECT COUNT(*)
      FROM projects p
      WHERE p.user_id = p_user_id
    ), 0)::BIGINT AS projects_used,
    v_projects_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION check_usage_limits(UUID) TO authenticated;
