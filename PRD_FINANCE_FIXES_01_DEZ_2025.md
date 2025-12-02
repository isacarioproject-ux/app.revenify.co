# PRD - Correções Módulo de Finanças
## Data: 01 de Dezembro de 2025
## Status: Em Desenvolvimento

---

## 📋 RESUMO EXECUTIVO

Este PRD documenta as correções necessárias no módulo de finanças da plataforma ISACAR, focando em isolamento de dados, UI/UX moderna, e funcionalidades completas.

---

## 🎯 OBJETIVOS

### Críticos (P0)
1. **Isolamento de Workspace** - Garantir que dados pessoais não apareçam em workspaces colaborativos
2. **Erro 400 ao Adicionar Categoria** - Corrigir problema de criação de categorias

### Importantes (P1)
3. **Tabelas Modernas** - Atualizar visual das tabelas (estilo ClickUp/Notion)
4. **Popover de Ícones** - Permitir usuário mudar ícone da categoria
5. **Filtros Funcionais** - Dialog de filtros com traduções e funcionalidade real
6. **Busca Funcional** - Botão de busca no dock funcionando

### Melhorias (P2)
7. **Contador Hardcoded** - Traduzir texto no RecurringBillsBlock
8. **X no Drawer Mobile** - Remover X padrão no mobile
9. **Depuração de Código** - Limpar código antigo sem uso

---

## 🔍 ANÁLISE TÉCNICA

### 1. Isolamento de Workspace

**Problema Identificado:**
```typescript
// use-finance-card.ts - Linha 60-65
// Busca TODOS os documentos sem filtro de workspace
const { data, error } = await supabase
  .from('finance_documents')
  .select('*')
  .eq('user_id', user.id)  // ❌ Falta filtro de workspace!
  .order('created_at', { ascending: false })
```

**Solução:**
```typescript
// Aplicar filtro de workspace
let query = supabase
  .from('finance_documents')
  .select('*')
  .eq('user_id', user.id)

if (currentWorkspace?.id) {
  query = query.eq('workspace_id', currentWorkspace.id)
} else {
  query = query.is('workspace_id', null)  // Pessoal
}
```

### 2. Erro 400 ao Adicionar Categoria

**Possíveis Causas:**
- Constraint NOT NULL violada
- RLS bloqueando insert
- Campo obrigatório faltando

**Verificar:**
- Tabela `finance_categories` no Supabase
- Policies RLS ativas
- Campos obrigatórios vs enviados

### 3. Tabelas Modernas

**Padrão Visual Novo:**
- Sem bordas/linhas de separação
- Ícones Lucide em vez de emojis
- Hover effects suaves
- Layout compacto estilo ClickUp

### 4. Popover de Ícones

**Implementação:**
- Dropdown com grid de ícones Lucide
- Persistir escolha no banco
- Fallback para ícone padrão

### 5. Textos Hardcoded

**Arquivos Afetados:**
- `recurring-bills-block.tsx` - Contador
- `transaction-filters.tsx` - Verificar traduções

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1 - Críticos (P0)
- [x] 1.1 Corrigir isolamento no `use-finance-card.ts` ✅ (01/12/2025)
- [x] 1.2 Corrigir isolamento no `finance-card.tsx` ✅ (01/12/2025) - Herda do hook
- [x] 1.3 Corrigir erro 400 em `categories-manager.tsx` ✅ (01/12/2025) - Campo 'description' não existe
- [x] 1.4 Verificar RLS das tabelas de finanças ✅ (01/12/2025) - Policies OK

### Fase 2 - Importantes (P1)
- [x] 2.1 Modernizar `finance-card.tsx` ✅ (01/12/2025) - Tabela sem bordas, ícones Lucide
- [x] 2.2 Adicionar popover de ícones ✅ (01/12/2025) - Ciclar ícones no dropdown
- [x] 2.3 Verificar traduções no dialog de filtros ✅ (01/12/2025) - Já usa i18n
- [x] 2.4 Busca funcional no dock ✅ (01/12/2025) - Já implementado com Dialog

### Fase 3 - Melhorias (P2)
- [x] 3.1 Traduzir "Ao vivo" no `finance-card.tsx` ✅ (01/12/2025)
- [x] 3.2 X no drawer - Já oculto com `[&>button]:hidden`
- [x] 3.3 Adicionar traduções onboarding ✅ (01/12/2025)

### Fase 4 - Novas Correções (01/12/2025)
- [x] 4.1 Remover ícones da tabela do card ✅ - Layout flexbox limpo
- [x] 4.2 Implementar campo de período funcional ✅ - Mostra mês/ano do banco
- [x] 4.3 Seletor de data estilo Notion ✅ - Sem borders, integrado
- [x] 4.4 Salvar data de referência no banco ✅ - reference_month, reference_year
- [x] 4.5 Ícone editável no documento ✅ - Popover com grid de emojis
- [x] 4.6 Remover linhas divisórias ✅ - Card, dialog e página
- [x] 4.7 Padding px-16 na página ✅ - finance-page-view.tsx

---

## 🏗️ ARQUIVOS A MODIFICAR

| Arquivo | Prioridade | Mudanças |
|---------|------------|----------|
| `use-finance-card.ts` | P0 | Filtro workspace |
| `finance-card.tsx` | P0 | Filtro workspace |
| `categories-manager.tsx` | P0 | Fix erro 400 |
| `transaction-table.tsx` | P1 | UI moderna |
| `finance-viewer.tsx` | P2 | X drawer |
| `recurring-bills-block.tsx` | P2 | i18n contador |
| `i18n.ts` | P2 | Novas chaves |

---

## 🛡️ ESTRATÉGIA DE TESTE

1. **Isolamento**: Criar dados em Pessoal, verificar que não aparecem em Workspace
2. **Categorias**: Adicionar/editar/deletar categorias
3. **Filtros**: Aplicar cada filtro e verificar resultados
4. **Busca**: Pesquisar transações existentes
5. **Mobile**: Verificar drawer sem X duplicado

---

## 📝 NOTAS IMPORTANTES

- **Regra de Ouro**: Não quebrar funcionalidades existentes
- **Workspace Pessoal**: `workspace_id = null`
- **Workspace Colaborativo**: `workspace_id = UUID do workspace`
- **Modelo de Sucesso**: Seguir padrão já implementado em `tasks` e `documents`

---

## 🔗 REFERÊNCIAS

- PRD anterior: `PRD_TASKS_BUGS_01_DEZ_2025.md`
- Padrão de isolamento: `categories-manager.tsx` (linhas 87-91)
- Estilo tabelas: ClickUp.com, Notion.so
