# PRD - Correções de Bugs e Melhorias ISACAR
**Data**: 1 de Dezembro de 2025
**Versão**: 1.0
**Status**: Em Progresso

---

## 📋 SUMÁRIO EXECUTIVO

Este documento detalha os problemas identificados na plataforma ISACAR e o plano de correção, seguindo as regras de desenvolvimento incremental sem quebrar funcionalidades existentes.

---

## 🔴 PROBLEMAS CRÍTICOS

### 1. Título da Aplicação Incorreto
- **Local**: `index.html` linha 7
- **Problema**: Título mostra "Isacar.io" mas domínio é "isacar.dev"
- **Impacto**: Inconsistência de marca, confusão do usuário
- **Solução**: Alterar para "Isacar.dev"
- **Risco**: Baixo
- **Prioridade**: P0 (Crítico)

### 2. Login Social Google - Credenciais Inválidas
- **Local**: `auth-form-minimal.tsx`, `auth/callback.tsx`
- **Problema**: Usuário criou conta com Google e agora recebe "Invalid login credentials"
- **Causa Provável**: 
  - Sessão não persistida após OAuth flow
  - Callback não processando tokens corretamente
  - Configuração do Supabase desatualizada
- **Solução**: 
  - Verificar configuração OAuth no Supabase Dashboard
  - Revisar callback para processar hash fragments
  - Adicionar logs detalhados para debug
- **Risco**: Médio
- **Prioridade**: P0 (Crítico)

### 3. Dados Pessoais Vazando para Workspace Colaborativo
- **Local**: Múltiplos componentes (tasks, projects, finance)
- **Problema**: Dados criados no onboarding (conta pessoal) aparecem no workspace colaborativo
- **Impacto**: Violação de privacidade, UX confusa
- **Solução**:
  - Garantir que onboarding cria dados com `workspace_id = null`
  - Filtrar dados por workspace_id corretamente em todos os hooks
  - Adicionar opção de "Pular" nos passos do onboarding que criam dados
- **Risco**: Alto
- **Prioridade**: P0 (Crítico)

---

## 🟡 PROBLEMAS IMPORTANTES

### 4. Animação de Loading Indesejada
- **Local**: `App.tsx` linha 43, `loading-skeleton.tsx`
- **Problema**: Animação de preload antes do onboarding/dashboard
- **Solução**: Remover `InitialPreload` do Suspense fallback, usar apenas skeletons
- **Risco**: Baixo
- **Prioridade**: P1 (Importante)

### 5. Campos Faltando no Onboarding
- **Local**: Componentes em `onboarding/steps/`
- **Problema**: Campos existem nos formulários da app mas não no onboarding
- **Solução**: Mapear campos e adicionar os faltantes mantendo design consistente
- **Risco**: Médio
- **Prioridade**: P1 (Importante)

### 6. Nomes dos Cards Inconsistentes com Sidebar
- **Local**: `tasks-card.tsx`, `app-sidebar.tsx`, `i18n.ts`
- **Problema**: Card usa `sidebar.tasks` que não existe, sidebar usa `nav.myWork`
- **Solução**: 
  - Adicionar chave `sidebar.tasks` no i18n
  - Padronizar nomes entre cards e sidebar
- **Risco**: Baixo
- **Prioridade**: P1 (Importante)

---

## 🟢 MELHORIAS DE UX

### 7. Tasks - Configurações Não Funcionais
- **Local**: `tasks-card.tsx`, `tasks-card-settings.tsx`
- **Problema**: Configurações (mostrar concluídas, ordenação, notificações) não afetam comportamento real
- **Solução**: 
  - Integrar settings com `useTasksCard` hook
  - Aplicar filtros e ordenação baseado nas configurações
  - Conectar notificações com sistema de reminders
- **Risco**: Médio
- **Prioridade**: P2 (Melhoria)

### 8. Calendário do ReminderTab Não Seleciona Data
- **Local**: `reminder-tab.tsx` linhas 388-397
- **Problema**: `onSelect` não fecha o popover nem atualiza UI
- **Solução**: Ajustar handler do Calendar para fechar popover e atualizar estado
- **Risco**: Baixo
- **Prioridade**: P1 (Importante)

### 9. Calendário do QuickAddTaskDialog Hardcoded
- **Local**: `quick-add-task-dialog.tsx` linhas 714-751
- **Problema**: Calendário é HTML estático, não componente real
- **Solução**: Substituir por componente `Calendar` do shadcn/ui
- **Risco**: Baixo
- **Prioridade**: P1 (Importante)

### 10. Notificações - Fluxo de Desbloqueio
- **Local**: `reminder-tab.tsx`
- **Problema**: Usuário precisa desbloquear notificações mas UX não é clara
- **Solução**: Melhorar mensagens e adicionar guia visual
- **Risco**: Baixo
- **Prioridade**: P2 (Melhoria)

### 11. Lembrete por Localização
- **Local**: `reminder-tab.tsx`, `reminder-location-service.ts`
- **Problema**: Feature existe mas utilidade não está clara para usuário
- **Solução**: 
  - Adicionar tooltip explicativo
  - Documentar casos de uso (ex: "Lembrar de comprar leite quando passar no mercado")
- **Risco**: Baixo
- **Prioridade**: P3 (Nice to have)

### 12. Botão com Nome do Usuário sem Utilidade
- **Local**: `quick-add-task-dialog.tsx` linha 550-560
- **Problema**: Badge com nome do workspace não tem ação útil
- **Solução**: 
  - Transformar em seletor de workspace
  - Ou remover se redundante
- **Risco**: Baixo
- **Prioridade**: P2 (Melhoria)

### 13. Textos Hardcoded (i18n)
- **Local**: Múltiplos arquivos
- **Problemas Identificados**:
  - `tasks-card.tsx`: "Ao vivo" (linha 291)
  - `quick-add-task-dialog.tsx`: "Adicionar descrição" (linha 454)
  - `quick-add-task-dialog.tsx`: "Workspace Atual" (linha 327)
  - `quick-add-task-dialog.tsx`: "Outros Workspaces" (linha 346)
  - `quick-add-task-dialog.tsx`: "Nenhum outro workspace disponível" (linha 350)
- **Solução**: Adicionar todas as chaves ao i18n.ts
- **Risco**: Baixo
- **Prioridade**: P2 (Melhoria)

---

## 📊 ANÁLISE DE IMPACTO

| Correção | Arquivos Afetados | Risco de Regressão | Tempo Estimado |
|----------|-------------------|-------------------|----------------|
| Título App | 1 | Nenhum | 1 min |
| Login Google | 3 | Baixo | 30 min |
| Isolamento Workspace | 10+ | Alto | 2h |
| Remover Preload | 1 | Baixo | 5 min |
| Campos Onboarding | 5+ | Médio | 1h |
| Nomes Cards | 3 | Baixo | 15 min |
| Tasks Settings | 4 | Médio | 1h |
| Calendário Reminder | 1 | Baixo | 15 min |
| Calendário QuickAdd | 1 | Baixo | 30 min |
| i18n Textos | 3 | Baixo | 30 min |

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1 - Críticos (P0)
- [x] 1.1 Corrigir título index.html ✅ (01/12/2025)
- [ ] 1.2 Investigar e corrigir login Google (Pendente - requer verificação Supabase Dashboard)
- [x] 1.3 Auditar isolamento de workspace ✅ (01/12/2025) - Corrigido em use-finance-card.ts
- [x] 1.4 Adicionar opção "Pular" no onboarding ✅ (01/12/2025) - Botão visível em todos os passos

### Fase 2 - Importantes (P1)
- [x] 2.1 Remover animação de preload ✅ (01/12/2025)
- [x] 2.2 Traduzir first-task-step.tsx ✅ (01/12/2025) - Todos os textos com i18n
- [x] 2.3 Padronizar nomes dos cards ✅ (01/12/2025) - Adicionadas chaves sidebar.*
- [x] 2.4 Corrigir calendário ReminderTab ✅ (01/12/2025) - Já funciona corretamente
- [x] 2.5 Corrigir calendário QuickAddTaskDialog ✅ (01/12/2025)

### Fase 3 - Melhorias (P2-P3)
- [x] 3.1 Integrar settings reais nas tasks ✅ (01/12/2025) - Persistência em localStorage
- [x] 3.2 Traduzir textos hardcoded ✅ (01/12/2025) - "Ao vivo", quickAdd.*, onboarding.*, tasks.settings.*, projects.*
- [x] 3.3 Notificações UX ✅ (01/12/2025) - Helper notifications.ts + integração com settings + i18n
- [x] 3.4 Lembrete por localização ✅ (01/12/2025) - Helper geolocation.ts + toggle em settings + i18n (skeleton pronto)
- [x] 3.5 Badge "Ao vivo" no projects-card ✅ (01/12/2025) - Quando em workspace

---

## 🛡️ ESTRATÉGIA DE TESTE

### Testes Manuais
1. **Login/Signup**: Testar fluxo completo com email e Google
2. **Onboarding**: Passar por todos os passos verificando dados criados
3. **Workspace**: Alternar entre Pessoal e Colaborativo verificando isolamento
4. **Tasks**: Criar tarefa com lembrete, verificar calendário e notificações
5. **i18n**: Trocar idioma e verificar todos os textos

### Pontos de Verificação
- Nenhum console.error novo
- Toasts de sucesso/erro funcionando
- Dados salvos corretamente no Supabase
- Filtros de workspace aplicados

---

## 📝 NOTAS

- **Regra de Ouro**: Não quebrar funcionalidades existentes
- **Commits**: Pequenos e incrementais
- **Backward Compatibility**: Manter props e APIs existentes
- **Documentação**: Atualizar comentários no código

---

*Documento criado em 01/12/2025 - Última atualização: 01/12/2025*
