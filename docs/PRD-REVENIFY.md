# 📄 PRD - REVENIFY
## Product Requirements Document

**Versão:** 1.0  
**Data:** 08/12/2025  
**Autor:** Revenify Team  
**Status:** Em Desenvolvimento

---

## 1. VISÃO GERAL DO PRODUTO

### 1.1 O que é o Revenify?

O **Revenify** é uma plataforma de **Revenue Attribution Analytics** que permite empresas rastrearem a origem exata de cada conversão e venda. Diferente de ferramentas tradicionais de analytics que focam em métricas de vaidade (pageviews, sessões), o Revenify conecta cada real de receita à sua fonte original de tráfego.

### 1.2 Problema que Resolve

- **Empresas não sabem qual canal de marketing gera mais receita**
- **Atribuição last-click é imprecisa** (ignora toda a jornada do cliente)
- **Ferramentas existentes são complexas e caras** (Mixpanel, Amplitude, Segment)
- **Dados fragmentados** entre Google Analytics, CRM, e plataforma de pagamentos

### 1.3 Proposta de Valor

> "Saiba exatamente de onde vem cada real de receita do seu negócio"

- **Pixel leve** (<2KB) que não impacta performance
- **Atribuição multi-touch** (first-touch, last-touch, linear)
- **Integração nativa com Stripe** para rastrear pagamentos
- **Dashboard em tempo real** com métricas de receita
- **Customer Journey** visual para entender a jornada completa

### 1.4 Público-Alvo

| Segmento | Descrição | Dor Principal |
|----------|-----------|---------------|
| **SaaS** | Empresas de software | Não sabem qual canal traz clientes que pagam |
| **E-commerce** | Lojas online | Gastam em ads sem saber ROI real |
| **Infoprodutores** | Cursos e mentorias | Não rastreiam origem de vendas |
| **Agências** | Marketing digital | Precisam provar ROI para clientes |

---

## 2. FUNCIONALIDADES

### 2.1 Core Features (MVP)

#### 2.1.1 Pixel de Tracking
```javascript
// Instalação simples
<script>
  window.revenify = { projectKey: 'pk_live_xxx' };
</script>
<script src="https://cdn.revenify.co/pixel.js" async></script>
```

**Eventos rastreados automaticamente:**
- `session_start` - Início de sessão
- `page_view` - Visualização de página
- `click` - Cliques em elementos
- `scroll` - Profundidade de scroll
- `form_submit` - Submissão de formulários

**Eventos customizados:**
```javascript
// Rastrear lead
revenify.trackLead({ email: 'user@email.com', name: 'João' });

// Rastrear compra
revenify.trackPurchase({ 
  amount: 199.90, 
  currency: 'BRL',
  order_id: 'ORD-123'
});

// Evento customizado
revenify.track('button_click', { button_id: 'cta-hero' });
```

#### 2.1.2 Dashboard Analytics

| Métrica | Descrição |
|---------|-----------|
| **Visitantes** | Visitantes únicos no período |
| **Page Views** | Total de páginas visualizadas |
| **Leads** | Conversões de visitante para lead |
| **Receita** | Total de receita atribuída |
| **Taxa de Conversão** | Leads / Visitantes |
| **Ticket Médio** | Receita / Número de vendas |

**Visualizações:**
- Gráfico de linha (visitantes por dia)
- Tabela de fontes (UTM source/medium)
- Feed de eventos em tempo real
- Funil de conversão

#### 2.1.3 Gerenciamento de Projetos

- Criar múltiplos projetos (sites/apps)
- Cada projeto tem sua própria `project_key`
- Domínios permitidos por projeto
- Ativar/desativar projetos

#### 2.1.4 Fontes de Tráfego (UTM)

- Criar fontes com UTM parameters
- Gerar links rastreáveis
- Ver performance por fonte
- Templates de UTM reutilizáveis

#### 2.1.5 Short Links

- Encurtador de URLs integrado
- Tracking automático de cliques
- QR Code para cada link
- Analytics por link
- Domínio customizado (Pro+)

### 2.2 Features Avançadas

#### 2.2.1 Customer Journey

**Objetivo:** Visualizar a jornada completa de um cliente, desde o primeiro toque até a compra.

**Componentes:**
- **Timeline visual** de todos os touchpoints
- **Busca por email** ou visitor_id
- **Atribuição de receita** por touchpoint
- **Exportação** para CSV/Excel

**Dados exibidos por touchpoint:**
- Data/hora
- Página visitada
- Fonte (UTM)
- Dispositivo
- Localização

#### 2.2.2 Integrações

| Integração | Tipo | Descrição | Plano |
|------------|------|-----------|-------|
| **Stripe** | Pagamentos | Importa transações automaticamente | Starter+ |
| **Stripe Connect** | Pagamentos | Para marketplaces | Pro+ |
| **Google Analytics** | Analytics | Importa dados do GA4 | Pro+ |
| **Facebook Pixel** | Ads | Sincroniza eventos | Pro+ |
| **Webhooks** | Automação | Envia eventos para qualquer URL | Pro+ |
| **Zapier** | Automação | Conecta com 5000+ apps | Business+ |
| **Slack** | Notificações | Alertas de leads/vendas | Starter+ |
| **HubSpot** | CRM | Sincroniza leads | Pro+ |
| **Pipedrive** | CRM | Sincroniza leads | Pro+ |
| **RD Station** | CRM | Sincroniza leads | Pro+ |
| **ActiveCampaign** | Email | Sincroniza leads | Pro+ |
| **Mailchimp** | Email | Sincroniza leads | Starter+ |
| **Google Sheets** | Dados | Exporta automaticamente | Starter+ |

#### 2.2.3 API Pública

**Endpoints:**

```
POST /api/v1/events     - Enviar eventos
POST /api/v1/leads      - Criar leads
GET  /api/v1/analytics  - Buscar métricas
GET  /api/v1/journeys   - Buscar jornadas
```

**Autenticação:** API Key por projeto

**Rate Limits:**
| Plano | Requests/min |
|-------|--------------|
| Free | 60 |
| Starter | 300 |
| Pro | 1000 |
| Business | 5000 |

#### 2.2.4 AI Assistant

**Funcionalidades:**
- Responder perguntas sobre dados
- Gerar insights automáticos
- Sugerir otimizações
- Criar relatórios

**Exemplos de perguntas:**
- "Qual fonte trouxe mais receita este mês?"
- "Qual é meu CAC por canal?"
- "Compare performance de Google vs Facebook"

**Limites por plano:**
| Plano | Mensagens/mês |
|-------|---------------|
| Free | 10 |
| Starter | 50 |
| Pro | 200 |
| Business | 1000 |

### 2.3 Blog (Marketing)

**Objetivo:** SEO e marketing de conteúdo para atrair tráfego orgânico.

**Funcionalidades:**
- Editor WYSIWYG para criar posts
- Categorias de posts
- Upload de imagens
- SEO meta tags
- Sidebar com info da empresa (case studies)
- Publicação agendada

**Categorias sugeridas:**
- Tutoriais
- Case Studies
- Novidades
- Marketing Digital

---

## 3. ARQUITETURA TÉCNICA

### 3.1 Stack Tecnológico

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | React 18, TypeScript, Vite |
| **UI** | TailwindCSS, shadcn/ui, Framer Motion |
| **Backend** | Supabase (PostgreSQL, Auth, Edge Functions) |
| **Pagamentos** | Stripe |
| **CDN** | Cloudflare (pixel.js) |
| **Deploy** | Vercel |
| **Monitoramento** | Sentry (futuro) |

### 3.2 Banco de Dados

```
┌─────────────────┐     ┌─────────────────┐
│     users       │────▶│  subscriptions  │
└─────────────────┘     └─────────────────┘
        │
        ▼
┌─────────────────┐     ┌─────────────────┐
│    projects     │────▶│     sources     │
└─────────────────┘     └─────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│     events      │     │   short_links   │
└─────────────────┘     └─────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│     leads       │     │ short_link_clicks│
└─────────────────┘     └─────────────────┘
        │
        ▼
┌─────────────────┐     ┌─────────────────┐
│    payments     │     │   touchpoints   │
└─────────────────┘     └─────────────────┘
```

### 3.3 Edge Functions

| Função | Descrição |
|--------|-----------|
| `track-event` | Recebe eventos do pixel |
| `create-checkout` | Cria sessão Stripe Checkout |
| `stripe-webhook` | Processa webhooks do Stripe |
| `create-portal` | Cria portal de billing |
| `redirect-short-link` | Redireciona short links |
| `ai-chat` | Processa mensagens do AI |
| `api-events` | API pública de eventos |
| `api-leads` | API pública de leads |
| `webhook-dispatcher` | Dispara webhooks outbound |

### 3.4 Fluxo de Dados

```
[Visitante] 
    │
    ▼ pixel.js
[Edge Function: track-event]
    │
    ▼
[Supabase: events table]
    │
    ├──▶ [Realtime] ──▶ [Dashboard: Live Feed]
    │
    └──▶ [Trigger] ──▶ [webhook-dispatcher] ──▶ [Sistemas externos]
```

---

## 4. PLANOS E PREÇOS

### 4.1 Tabela de Planos

| Feature | Free | Starter | Pro | Business |
|---------|------|---------|-----|----------|
| **Preço/mês** | R$ 0 | R$ 49 | R$ 149 | R$ 399 |
| **Preço/ano** | R$ 0 | R$ 490 | R$ 1.490 | R$ 3.990 |
| **Projetos** | 1 | 3 | 10 | 50 |
| **Eventos/mês** | 10K | 100K | 500K | 2M |
| **Short Links** | 30 | 100 | ∞ | ∞ |
| **Mensagens IA** | 10 | 50 | 200 | 1.000 |
| **Retenção dados** | 30 dias | 90 dias | 1 ano | 2 anos |
| **Rastreio receita** | ❌ | ✅ | ✅ | ✅ |
| **API Access** | ❌ | ❌ | ✅ | ✅ |
| **Webhooks** | ❌ | ❌ | ✅ | ✅ |
| **Domínio custom** | ❌ | ❌ | ✅ | ✅ |
| **White Label** | ❌ | ❌ | ❌ | ✅ |
| **Suporte** | Email | Email | Prioritário | Dedicado |

### 4.2 Modelo de Negócio

- **Freemium:** Plano gratuito para aquisição
- **Self-serve:** Checkout automático via Stripe
- **Upsell:** Limites que incentivam upgrade
- **Retenção:** Dados históricos como lock-in

---

## 5. ROADMAP

### 5.1 Fase 1: MVP (Atual)
- [x] Autenticação (Magic Link + Google)
- [x] Dashboard com métricas
- [x] Gerenciamento de projetos
- [x] Pixel de tracking
- [x] Short links
- [x] Templates UTM
- [x] Customer Journey básico
- [ ] Stripe Checkout
- [ ] Onboarding melhorado

### 5.2 Fase 2: Monetização (Q1 2025)
- [ ] Stripe Connect (pagamentos)
- [ ] Planos pagos funcionando
- [ ] Portal de billing
- [ ] Limites por plano
- [ ] Upsell modals

### 5.3 Fase 3: Integrações (Q2 2025)
- [ ] Webhooks outbound
- [ ] Slack integration
- [ ] HubSpot integration
- [ ] Zapier integration
- [ ] API pública documentada

### 5.4 Fase 4: Escala (Q3 2025)
- [ ] White label
- [ ] Multi-tenancy
- [ ] Enterprise features
- [ ] SOC 2 compliance
- [ ] Mobile app

---

## 6. MÉTRICAS DE SUCESSO

### 6.1 KPIs de Produto

| Métrica | Meta Inicial | Meta 6 meses |
|---------|--------------|--------------|
| **Usuários registrados** | 100 | 1.000 |
| **Usuários ativos (MAU)** | 30 | 300 |
| **Projetos criados** | 50 | 500 |
| **Eventos rastreados/mês** | 100K | 10M |
| **Conversão Free→Paid** | 3% | 5% |
| **MRR** | R$ 0 | R$ 10.000 |
| **Churn mensal** | - | <5% |

### 6.2 KPIs de Engajamento

| Métrica | Meta |
|---------|------|
| **DAU/MAU** | >20% |
| **Tempo médio sessão** | >5 min |
| **Features usadas/sessão** | >3 |
| **NPS** | >50 |

---

## 7. RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| **Concorrência** (Mixpanel, Amplitude) | Alta | Alto | Foco em simplicidade e preço |
| **Bloqueadores de ads** | Média | Médio | Pixel first-party, proxy |
| **LGPD/GDPR** | Alta | Alto | Consent banner, anonimização |
| **Escalabilidade** | Média | Alto | Supabase managed, CDN |
| **Churn** | Alta | Alto | Onboarding, success team |

---

## 8. INTEGRAÇÕES DETALHADAS

### 8.1 Stripe (Pagamentos)

**Objetivo:** Rastrear automaticamente todas as transações do Stripe e atribuir à fonte de tráfego.

**Fluxo:**
1. Usuário conecta conta Stripe via OAuth
2. Webhook recebe eventos de pagamento
3. Sistema associa `customer_email` ao `visitor_id`
4. Receita é atribuída aos touchpoints

**Eventos processados:**
- `checkout.session.completed`
- `invoice.payment_succeeded`
- `charge.succeeded`
- `customer.subscription.created`

### 8.2 Webhooks Outbound

**Objetivo:** Enviar eventos do Revenify para sistemas externos em tempo real.

**Configuração:**
```json
{
  "url": "https://api.exemplo.com/webhook",
  "events": ["lead.created", "payment.succeeded"],
  "secret": "whsec_xxx",
  "active": true
}
```

**Payload:**
```json
{
  "event": "lead.created",
  "timestamp": "2025-12-08T17:00:00Z",
  "data": {
    "email": "user@email.com",
    "name": "João Silva",
    "source": {
      "utm_source": "google",
      "utm_medium": "cpc",
      "utm_campaign": "black-friday"
    }
  }
}
```

### 8.3 Slack

**Objetivo:** Notificações em tempo real de leads e vendas.

**Mensagens:**
- 🎉 Novo lead: João Silva (Google Ads)
- 💰 Nova venda: R$ 199,90 (Facebook)
- 📈 Meta atingida: 100 leads este mês

### 8.4 CRMs (HubSpot, Pipedrive, RD Station)

**Objetivo:** Sincronizar leads automaticamente com dados de atribuição.

**Campos sincronizados:**
- Email
- Nome
- Telefone (se disponível)
- Fonte (UTM)
- Data de conversão
- Valor potencial

### 8.5 Google Sheets

**Objetivo:** Exportar dados automaticamente para planilhas.

**Templates:**
- Relatório diário de leads
- Relatório semanal de receita
- Dashboard de fontes

---

## 9. ESPECIFICAÇÕES DE UI/UX

### 9.1 Onboarding (Estilo Dub.co)

**Design Principles:**
- Minimalista e focado
- Uma ação por tela
- Progresso visual claro
- Animações suaves
- Skip opcional

**Steps:**

**Step 1: Welcome**
- Título: "Bem-vindo ao Revenify"
- Subtítulo: "Rastreie a origem de cada real de receita"
- 3 cards com benefícios principais
- CTA: "Começar" (primary)
- Link: "Pular setup" (secondary)

**Step 2: Create Project**
- Título: "Crie seu primeiro projeto"
- Input: Nome do projeto
- Input: Domínio do site
- Validação em tempo real
- CTA: "Criar projeto"

**Step 3: Install Pixel**
- Título: "Instale o pixel"
- Code block com snippet
- Botão copiar
- Instruções de instalação
- Verificação automática (opcional)
- CTA: "Verificar instalação" ou "Fazer depois"

**Step 4: Success**
- Animação de confetti
- Título: "Tudo pronto!"
- Resumo do que foi configurado
- CTA: "Ir para o Dashboard"

### 9.2 Design System

**Cores:**
- Primary: `#6366F1` (Indigo)
- Secondary: `#10B981` (Emerald)
- Background: `#0A0A0A` (Dark)
- Card: `#171717`
- Border: `#262626`

**Tipografia:**
- Font: Inter
- Headings: 600-700 weight
- Body: 400-500 weight

**Componentes:**
- Cards com bordas sutis
- Botões com hover states
- Inputs com focus rings
- Badges coloridos por status
- Tooltips informativos

---

## 10. CONCLUSÃO

O Revenify está bem posicionado para se tornar a ferramenta de referência em revenue attribution para o mercado brasileiro e latino-americano. Com foco em simplicidade, preço acessível e integrações nativas, podemos capturar uma fatia significativa do mercado de analytics.

**Próximos passos imediatos:**
1. Comprar domínio `revenify.co`
2. Configurar Stripe para monetização
3. Melhorar onboarding
4. Implementar integrações principais
5. Lançar beta público

---

*Este documento é vivo e será atualizado conforme o produto evolui.*
