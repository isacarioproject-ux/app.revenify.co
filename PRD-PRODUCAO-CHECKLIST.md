# PRD - REVENIFY: Correções para Produção

**Versão:** 1.0  
**Data:** 04/01/2026  
**Status:** ✅ CONCLUÍDO  

---

## 📋 CHECKLIST DE CORREÇÕES

### 🔴 FASE 1: VULNERABILIDADES DE SEGURANÇA (CRÍTICO)

#### 1.1 Credenciais Hardcoded
- [x] **1.1.1** Mover URL do Supabase para variável de ambiente em `src/lib/supabase.ts`
- [x] **1.1.2** Mover Anon Key do Supabase para variável de ambiente em `src/lib/supabase.ts`
- [x] **1.1.3** Atualizar `src/lib/config.ts` para usar variáveis de ambiente
- [x] **1.1.4** Verificar se `.env.example` está atualizado com todas as variáveis

#### 1.2 XSS - dangerouslySetInnerHTML
- [x] **1.2.1** ~~Instalar DOMPurify como dependência~~ (Criado sanitizador próprio)
- [x] **1.2.2** Criar utilitário de sanitização em `src/lib/sanitize.ts`
- [x] **1.2.3** Aplicar sanitização em `src/pages/blog-create.tsx`

#### 1.3 Senhas em Texto Plano
- [x] **1.3.1** Documentar necessidade de implementar bcrypt no backend (Edge Function)
- [x] **1.3.2** Adicionar comentário de alerta no código atual

---

### 🟠 FASE 2: CÓDIGO DUPLICADO

#### 2.1 Arquivos Duplicados
- [x] **2.1.1** Deletar `src/hooks/use-mobile.ts` (manter apenas `.tsx`)
- [x] **2.1.2** Verificar imports que usam `use-mobile.ts`

#### 2.2 Interfaces Subscription Duplicadas
- [x] **2.2.1** Criar tipo unificado `Subscription` em `src/types/subscription.ts`
- [x] **2.2.2** Atualizar `src/contexts/subscription-context.tsx` para usar tipo unificado
- [x] **2.2.3** Atualizar `src/hooks/use-subscription.ts` para usar tipo unificado
- [x] **2.2.4** Deprecar hook `use-subscription.ts` em favor do context

---

### 🟡 FASE 3: LIMPEZA DE CÓDIGO

#### 3.1 Console.logs em Produção
- [x] **3.1.1** Remover/comentar console.logs em `src/pages/auth/callback.tsx`
- [x] **3.1.2** Remover/comentar console.logs em `src/contexts/auth-context.tsx`
- [x] **3.1.3** Remover/comentar console.logs em `src/components/auth-form-minimal.tsx`
- [x] **3.1.4** Remover/comentar console.logs em `src/hooks/use-onboarding.ts`
- [x] **3.1.5** Remover/comentar console.logs em `src/utils/fix-workspace-mode.ts`
- [x] **3.1.6** Remover/comentar console.logs em `src/pages/dashboard.tsx`
- [x] **3.1.7** Remover/comentar console.logs em `src/components/app-sidebar.tsx`

#### 3.2 Fallback URLs de Localhost
- [x] **3.2.1** Corrigir fallback URLs em `supabase/functions/create-checkout/index.ts`

---

### 🟢 FASE 4: MELHORIAS DE TIPOS

#### 4.1 Tipos Centralizados
- [x] **4.1.1** Criar `src/types/subscription.ts` com tipos unificados
- [x] **4.1.2** Exportar tipos em `src/types/index.ts`

---

## 📁 ARQUIVOS MODIFICADOS

| Arquivo | Fase | Ação | Status |
|---------|------|------|--------|
| `src/lib/supabase.ts` | 1.1 | Usar env vars | ✅ |
| `src/lib/config.ts` | 1.1 | Usar env vars | ✅ |
| `.env.example` | 1.1 | Adicionar PROJECT_ID | ✅ |
| `src/lib/sanitize.ts` | 1.2 | CRIADO - Sanitizador HTML | ✅ |
| `src/pages/blog-create.tsx` | 1.2 | Sanitizar HTML | ✅ |
| `supabase/functions/redirect-short-link/index.ts` | 1.3 | Alerta bcrypt | ✅ |
| `src/hooks/use-mobile.ts` | 2.1 | DELETADO | ✅ |
| `src/types/subscription.ts` | 2.2 | CRIADO - Tipos unificados | ✅ |
| `src/types/index.ts` | 4.1 | CRIADO - Exportações | ✅ |
| `src/contexts/subscription-context.tsx` | 2.2 | Usar tipos unificados | ✅ |
| `src/hooks/use-subscription.ts` | 2.2 | Deprecado | ✅ |
| `src/pages/auth/callback.tsx` | 3.1 | Remover logs | ✅ |
| `src/contexts/auth-context.tsx` | 3.1 | Remover logs | ✅ |
| `src/components/auth-form-minimal.tsx` | 3.1 | Remover logs | ✅ |
| `src/hooks/use-onboarding.ts` | 3.1 | Remover logs | ✅ |
| `src/utils/fix-workspace-mode.ts` | 3.1 | Remover logs | ✅ |
| `src/pages/dashboard.tsx` | 3.1 | Remover logs | ✅ |
| `src/components/app-sidebar.tsx` | 3.1 | Remover logs | ✅ |
| `supabase/functions/create-checkout/index.ts` | 3.2 | Corrigir URLs | ✅ |

---

## ⚠️ NOTAS IMPORTANTES

1. **Não quebrar funcionalidades existentes** - Todas as mudanças devem ser incrementais
2. **Testar após cada fase** - Verificar se a aplicação continua funcionando
3. **Manter backward compatibility** - Deprecar antes de remover

---

## 🚀 PRÓXIMOS PASSOS (Pós-Correções)

Após completar este checklist, o usuário solicitou correções adicionais no frontend que serão documentadas separadamente.

---

## ✅ RESUMO DA EXECUÇÃO

**Total de itens:** 19  
**Concluídos:** 19  
**Pendentes:** 0  

### Arquivos Criados:
- `src/lib/sanitize.ts` - Utilitário de sanitização HTML
- `src/types/subscription.ts` - Tipos unificados de Subscription
- `src/types/index.ts` - Exportação centralizada de tipos

### Arquivos Deletados:
- `src/hooks/use-mobile.ts` - Duplicado (mantido `.tsx`)

### Principais Correções:
1. **Segurança**: Credenciais movidas para variáveis de ambiente
2. **XSS**: Sanitização implementada para conteúdo HTML
3. **Código Limpo**: 42+ console.logs removidos
4. **Tipos**: Interface Subscription unificada
5. **URLs**: Fallbacks de localhost corrigidos para produção

---

**Última Atualização:** 04/01/2026 12:42 UTC-3
