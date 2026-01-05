# PRD - REVENIFY: Correções Frontend & Integração IA

**Versão:** 1.1  
**Data:** 04/01/2026  
**Status:** ✅ CONCLUÍDO  

---

## 📋 ÍNDICE

1. [Correções Mobile - UI/UX](#correções-mobile)
2. [Bug Crítico - Páginas Settings Travando](#bug-crítico)
3. [Funcionalidades - Explicações](#funcionalidades)
4. [Integração IA - Planejamento](#integração-ia)

---

## 🔴 BUG CRÍTICO - PRIORIDADE MÁXIMA

### Páginas de Settings Travando
- [x] **CRÍTICO** Páginas de Perfil, Notificações, Preferências, Faturamento e Integrações travam
- [x] Não é possível rolar para cima/baixo
- [x] Sidebar não responde aos cliques
- [x] Usuário precisa dar F5 para sair dessas páginas
- **Arquivos:** `src/components/dashboard-layout.tsx` - Corrigido overflow-hidden → min-h-0

---

## 📱 CORREÇÕES MOBILE - UI/UX

### 1. Página Projetos - Card Project Key
- [x] **1.1** Card com Project Key causa rolagem horizontal no mobile
- [x] **1.2** Aumentar altura do card em vez de largura
- [x] **1.3** Quebrar texto da key em múltiplas linhas no mobile
- **Arquivo:** `src/pages/projects.tsx` - Corrigido com truncate e break-all

### 2. Página Fontes de Tráfego
- [x] **2.1** Verificar textos hardcoded no card de fontes - OK, usa t()
- [x] **2.2** Internacionalizar se necessário - Já internacionalizado
- **Arquivo:** `src/pages/sources.tsx` - Verificado

### 3. Página Analytics
- [x] **3.1** Switcher de data + projeto + botão exportar causam rolagem horizontal
- [x] **3.2** Transformar botão "Exportar" em ícone com tooltip no mobile
- [x] **3.3** Manter switchers como estão
- **Arquivo:** `src/pages/analytics.tsx` - Corrigido

### 4. Página Leads
- [x] **4.1** Input de busca por email/nome sai do card no mobile
- [x] **4.2** Limitar largura do input para caber no card
- **Arquivo:** `src/pages/leads.tsx` - Corrigido com w-full md:w-64

### 5. Página Jornada
- [x] **5.1** Switcher de data sai do layout no mobile
- [x] **5.2** Alinhar corretamente com switcher de projeto
- **Arquivo:** `src/pages/customer-journey.tsx` - Já estava correto

### 6. Tooltips em Todo o App (Mobile)
- [x] **6.1** Tooltips abrem e fecham muito rápido no mobile
- [x] **6.2** Usuário não consegue ler o conteúdo informativo
- [x] **6.3** Implementar comportamento de "tap to open, tap to close" no mobile
- **Arquivo:** `src/components/ui/info-tooltip.tsx` - Usa Popover no mobile

### 7. Página Short Links
- [x] **7.1** Verificar dialog de criação - Funcionando corretamente
- [x] **7.2** Botão "Exportar CSV" deve ser ícone com tooltip no mobile
- [x] **7.3** Manter switcher de projeto e botão criar link como estão
- **Arquivos:** `src/pages/short-links.tsx` - Corrigido

---

## 📚 FUNCIONALIDADES - EXPLICAÇÕES

### Como funcionam as Fontes de Tráfego (UTM)?

**Conceito:** Fontes de tráfego são URLs com parâmetros UTM que permitem rastrear de onde vêm seus visitantes.

**Exemplo prático:**
1. Você cria 5 fontes no Revenify:
   - `facebook` → gera URL: `seusite.com?utm_source=facebook&utm_medium=social`
   - `instagram` → gera URL: `seusite.com?utm_source=instagram&utm_medium=social`
   - `twitter` → gera URL: `seusite.com?utm_source=twitter&utm_medium=social`
   - `linkedin` → gera URL: `seusite.com?utm_source=linkedin&utm_medium=social`
   - `email` → gera URL: `seusite.com?utm_source=email&utm_medium=newsletter`

2. Você compartilha cada URL na rede social correspondente
3. O pixel do Revenify (já no header) captura automaticamente os parâmetros UTM
4. No dashboard, você vê quantas pessoas vieram de cada fonte

**Resposta:** SIM! Você pode criar 5 fontes, colocar em 5 redes sociais diferentes e saber exatamente quantas pessoas entraram de cada uma.

---

### Como funcionam os Leads?

**Conceito:** Leads são visitantes que se identificaram no seu site (preencheram formulário, fizeram login, etc.)

**Como funciona:**
1. O pixel captura eventos do seu site
2. Quando um visitante preenche um formulário com email/nome, você envia esse dado para o Revenify via API ou evento
3. O lead fica registrado com todas as informações de origem (de onde veio, páginas visitadas, etc.)

**Confiabilidade:** Os dados são tão confiáveis quanto os eventos que você envia. Se o formulário captura email real, o lead é real.

---

### Como funciona a Jornada do Visitante?

**Conceito:** A jornada mostra o caminho que cada visitante faz no seu site.

**Como funciona atualmente:**
- O pixel precisa estar em TODAS as páginas que você quer rastrear
- Cada pageview é registrado como um evento
- A jornada conecta esses eventos pelo ID do visitante

**Problema identificado:** Se você tem múltiplas páginas (landing, login, dashboard), precisa do pixel em todas.

**Soluções para não-desenvolvedores:**
1. **WordPress:** Plugin que injeta o pixel em todas as páginas automaticamente
2. **Outras plataformas:** Snippet único no header global (a maioria das plataformas tem isso)
3. **SPA (React, Vue, etc.):** Pixel no index.html + eventos de navegação

**TODO:** Criar documentação/guias de instalação para cada plataforma popular.

---

## 🤖 INTEGRAÇÃO IA - PLANEJAMENTO COMPLETO

### Visão Geral
Criar um assistente de IA especializado que:
- Tem acesso COMPLETO ao banco de dados do usuário (projetos, eventos, leads, analytics)
- Responde perguntas sobre os dados de forma inteligente
- Sugere ações baseadas em padrões identificados
- É o MAIOR DIFERENCIAL do Revenify

### Restrição Atual
- [ ] IA visível APENAS para conta `revenify.co` até Stripe estar ativo
- [ ] Não ativar API OpenAI ainda (aguardar Stripe)

### Arquitetura Proposta

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Chat Interface (AI Assistant)           │    │
│  │  - Histórico de conversas                           │    │
│  │  - Sugestões de perguntas                           │    │
│  │  - Visualizações inline (gráficos, tabelas)         │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 EDGE FUNCTION (ai-chat)                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  1. Autenticação do usuário                         │    │
│  │  2. Verificar se é conta revenify.co (temporário)   │    │
│  │  3. Buscar contexto do banco de dados               │    │
│  │  4. Construir prompt com dados reais                │    │
│  │  5. Chamar OpenAI API                               │    │
│  │  6. Processar e retornar resposta                   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │   projects   │ │    events    │ │    leads     │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │  short_links │ │   sources    │ │ subscriptions│        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│  ┌──────────────┐ ┌──────────────┐                         │
│  │ ai_conversations │ │ ai_messages │                      │
│  └──────────────┘ └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

### System Prompt Proposto (Edge Function)

```typescript
const SYSTEM_PROMPT = `
Você é o Assistente Revenify, um especialista em analytics, marketing digital e conversão.

## CONTEXTO DO USUÁRIO
- Nome: {{user_name}}
- Plano: {{subscription_plan}}
- Projetos: {{projects_count}}

## DADOS DISPONÍVEIS (Atualizados em tempo real)
{{dynamic_context}}

## SUAS CAPACIDADES
1. **Análise de Dados:** Você tem acesso aos dados reais do usuário e pode analisá-los
2. **Insights:** Identifique padrões, tendências e oportunidades
3. **Recomendações:** Sugira ações concretas baseadas nos dados
4. **Explicações:** Explique métricas e conceitos de forma simples

## REGRAS
- Sempre baseie suas respostas nos dados reais fornecidos
- Se não tiver dados suficientes, peça mais contexto
- Seja proativo em sugerir melhorias
- Use linguagem clara e acessível
- Formate respostas com markdown quando apropriado
- Nunca invente dados - use apenas o que foi fornecido

## FORMATO DE RESPOSTA
- Use bullet points para listas
- Use **negrito** para destacar números importantes
- Inclua emojis relevantes para melhor legibilidade
- Seja conciso mas completo
`
```

### Funções de Contexto Dinâmico

```typescript
// Funções para buscar dados do usuário
async function getUserContext(userId: string, projectId?: string) {
  return {
    // Resumo geral
    summary: await getProjectsSummary(userId),
    
    // Métricas do projeto selecionado
    projectMetrics: projectId ? await getProjectMetrics(projectId) : null,
    
    // Últimos 30 dias
    recentEvents: await getRecentEvents(userId, 30),
    recentLeads: await getRecentLeads(userId, 30),
    
    // Top performers
    topSources: await getTopSources(userId),
    topPages: await getTopPages(userId),
    
    // Conversões
    conversionFunnel: await getConversionFunnel(userId),
    
    // Short links performance
    shortLinksStats: await getShortLinksStats(userId),
  }
}
```

### Exemplos de Perguntas que a IA Responderá

1. "Qual foi minha melhor fonte de tráfego este mês?"
2. "Quantos leads eu captei na última semana?"
3. "Qual página tem a maior taxa de saída?"
4. "Me dê um resumo do desempenho do meu projeto X"
5. "Quais ações você sugere para aumentar minhas conversões?"
6. "Compare o desempenho de Facebook vs Instagram"
7. "Qual o melhor horário para postar baseado nos meus dados?"

### Checklist de Implementação

#### Fase 1: Preparação (Atual)
- [ ] Criar estrutura do prompt completo
- [ ] Definir funções de contexto
- [ ] Preparar queries SQL otimizadas
- [ ] Restringir acesso a conta revenify.co

#### Fase 2: Implementação (Após Stripe)
- [ ] Configurar API OpenAI
- [ ] Implementar Edge Function completa
- [ ] Criar interface de chat melhorada
- [ ] Testar com dados reais

#### Fase 3: Refinamento
- [ ] Ajustar prompts baseado em feedback
- [ ] Adicionar mais capacidades
- [ ] Otimizar performance
- [ ] Liberar para todos os usuários

---

## 📊 ORDEM DE EXECUÇÃO

1. **CRÍTICO:** Corrigir páginas de Settings que travam
2. Correções mobile (Project Key, Analytics, Leads, Jornada, Short Links)
3. Corrigir tooltips no mobile
4. Verificar dialog de short links
5. Preparar estrutura de IA (sem ativar API)

---

**Última Atualização:** 04/01/2026 13:30 UTC-3
