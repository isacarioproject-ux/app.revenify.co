/**
 * ========================================
 * REGRAS DE DESENVOLVIMENTO - ISACAR.DEV
 * ========================================
 * 
 * IMPORTANTE: Seguir estas regras SEMPRE ao adicionar novas funcionalidades
 * 
 * REGRA #1: NUNCA CRIAR POR CIMA
 * - ❌ Criar novos componentes duplicados
 * - ❌ Criar novos hooks duplicados
 * - ❌ Quebrar funcionalidades existentes
 * - ✅ Usar componentes existentes
 * - ✅ Acoplar no que já existe
 * - ✅ Evoluir incrementalmente
 * 
 * REGRA #2: WORKSPACE_ID
 * - Modo Pessoal: workspace_id = null
 * - Workspace Colaborativo: workspace_id = UUID
 * - SEMPRE filtrar queries por workspace_id
 * - Query pattern: if (workspaceId === null) { query.is() } else { query.eq() }
 * 
 * REGRA #3: ONBOARDING
 * - TODOS os dados criados no onboarding: workspace_id = null
 * - Garante que dados pessoais fiquem privados
 * 
 * REGRA #4: NOVOS CARDS
 * - Verificar se JÁ existe hook similar
 * - Usar ResizableCard component existente
 * - Filtrar por workspace_id (null ou UUID)
 * - Adicionar ao dashboard existente
 * - Testar em ambos os modos
 * 
 * REGRA #5: NOVAS PÁGINAS
 * - Usar DashboardLayout existente
 * - Filtrar dados por workspace_id
 * - Reutilizar componentes de UI
 * - Adicionar rota no router existente
 * 
 * REGRA #6: HOOKS
 * - Reutilizar hooks existentes antes de criar novos
 * - useWorkspace(), useAuth(), useTasksCard(), useFinanceCard(), etc
 * - Incluir filtro de workspace
 * - Retornar: loading, error, data
 * 
 * REGRA #7: COMPONENTES UI
 * - ResizableCard para cards
 * - Card, Button, Input, Dialog, etc de @/components/ui
 * - DashboardLayout para páginas
 * - NUNCA duplicar componentes
 * 
 * REGRA #8: GIT COMMIT
 * - APENAS código: *.ts, *.tsx, *.css, *.json
 * - NUNCA: *.md, *.txt, *.sql, .env*
 */

// Constantes de desenvolvimento

export const DEV_RULES = {
  WORKSPACE_PERSONAL: null,
  WORKSPACE_QUERY_PATTERN: 'if (workspaceId === null) query.is() else query.eq()',
  ONBOARDING_WORKSPACE: null,
  COMMIT_ONLY: ['*.ts', '*.tsx', '*.css', '*.json'],
} as const;
