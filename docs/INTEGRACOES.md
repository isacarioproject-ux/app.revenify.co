# 🔌 REVENIFY - INTEGRAÇÕES

> Documento detalhado de todas as integrações planejadas e seu status de implementação.

---

## 📊 VISÃO GERAL

| Categoria | Integrações | Status |
|-----------|-------------|--------|
| **Pagamentos** | 3 | 🔶 Parcial |
| **CRM** | 5 | ❌ Não iniciado |
| **Email Marketing** | 3 | ❌ Não iniciado |
| **Automação** | 3 | 🔶 Parcial |
| **Analytics** | 2 | ❌ Não iniciado |
| **Notificações** | 2 | ❌ Não iniciado |
| **Dados** | 2 | ❌ Não iniciado |

---

## 💳 PAGAMENTOS

### 1. Stripe Checkout ✅ Implementado
**Status:** Edge Function deployada, falta configurar Price IDs

**O que faz:**
- Cria sessões de checkout para upgrade de plano
- Processa webhooks de pagamento
- Atualiza subscription no banco

**Configuração necessária:**
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_STARTER_YEARLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_BUSINESS_MONTHLY=price_...
STRIPE_PRICE_BUSINESS_YEARLY=price_...
```

**Arquivos:**
- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `supabase/functions/create-portal/index.ts`

---

### 2. Stripe Connect 🔶 Parcial
**Status:** Estrutura criada, falta implementação completa

**O que faz:**
- Conecta conta Stripe do usuário
- Importa transações automaticamente
- Atribui receita às fontes de tráfego

**Fluxo:**
1. Usuário clica "Conectar Stripe"
2. Redirect para Stripe OAuth
3. Callback salva `stripe_account_id`
4. Webhook escuta eventos de pagamento
5. Sistema associa `customer_email` ao `visitor_id`

**Implementação necessária:**
```typescript
// Edge Function: stripe-connect
// 1. Gerar OAuth URL
// 2. Processar callback
// 3. Salvar account_id na tabela integrations

// Edge Function: customer-stripe-webhook
// 1. Receber eventos da conta conectada
// 2. Buscar visitor_id pelo email
// 3. Criar registro em payments
// 4. Atualizar sources com receita
```

**Tabelas envolvidas:**
- `integrations` - Armazena credenciais
- `payments` - Registra transações
- `sources` - Atualiza total_revenue

---

### 3. PayPal ❌ Não iniciado
**Status:** Planejado para Q2 2025

**O que faz:**
- Importa transações do PayPal
- Atribui receita às fontes

**Prioridade:** Baixa (maioria usa Stripe no Brasil)

---

## 📧 CRM

### 4. HubSpot ❌ Não iniciado
**Status:** Planejado para Q1 2025
**Plano mínimo:** Pro

**O que faz:**
- Sincroniza leads automaticamente
- Envia dados de atribuição (UTM)
- Atualiza deal value com receita

**API necessária:**
- HubSpot CRM API v3
- OAuth 2.0 para autenticação

**Campos sincronizados:**
| Revenify | HubSpot |
|----------|---------|
| email | email |
| name | firstname + lastname |
| utm_source | hs_analytics_source |
| utm_medium | hs_analytics_source_data_1 |
| utm_campaign | hs_analytics_source_data_2 |
| created_at | createdate |
| total_revenue | amount (deal) |

---

### 5. Pipedrive ❌ Não iniciado
**Status:** Planejado para Q1 2025
**Plano mínimo:** Pro

**O que faz:**
- Cria pessoa/deal automaticamente
- Envia dados de atribuição
- Atualiza valor do deal

**API necessária:**
- Pipedrive REST API
- API Token para autenticação

---

### 6. RD Station ❌ Não iniciado
**Status:** Planejado para Q1 2025
**Plano mínimo:** Pro

**O que faz:**
- Sincroniza leads como conversões
- Envia UTM parameters
- Atualiza score do lead

**API necessária:**
- RD Station Marketing API
- OAuth 2.0

**Importante:** Muito usado no Brasil, prioridade alta.

---

### 7. Salesforce ❌ Não iniciado
**Status:** Planejado para Q2 2025
**Plano mínimo:** Business

**O que faz:**
- Cria Lead/Contact/Opportunity
- Sincroniza atribuição
- Atualiza revenue

**Complexidade:** Alta (API complexa)

---

### 8. Close CRM ❌ Não iniciado
**Status:** Planejado para Q2 2025
**Plano mínimo:** Pro

**O que faz:**
- Cria leads automaticamente
- Envia dados de atribuição

---

## 📨 EMAIL MARKETING

### 9. Mailchimp ❌ Não iniciado
**Status:** Planejado para Q1 2025
**Plano mínimo:** Starter

**O que faz:**
- Adiciona leads à lista/audience
- Envia tags de atribuição
- Sincroniza status de inscrição

**API necessária:**
- Mailchimp Marketing API
- API Key

**Campos sincronizados:**
| Revenify | Mailchimp |
|----------|-----------|
| email | email_address |
| name | merge_fields.FNAME |
| utm_source | tags |
| utm_campaign | tags |

---

### 10. ActiveCampaign ❌ Não iniciado
**Status:** Planejado para Q1 2025
**Plano mínimo:** Pro

**O que faz:**
- Cria contato automaticamente
- Adiciona tags de atribuição
- Inicia automações

**API necessária:**
- ActiveCampaign API v3
- API Key + Account URL

---

### 11. ConvertKit ❌ Não iniciado
**Status:** Planejado para Q2 2025
**Plano mínimo:** Starter

**O que faz:**
- Adiciona subscriber
- Envia tags de fonte

---

## 🤖 AUTOMAÇÃO

### 12. Webhooks Outbound 🔶 Parcial
**Status:** Edge Function criada, falta UI de configuração

**O que faz:**
- Envia eventos para qualquer URL
- Suporta autenticação via secret
- Retry automático em falhas
- Log de todas as chamadas

**Eventos disponíveis:**
- `lead.created`
- `payment.succeeded`
- `event.tracked`
- `visitor.identified`

**Payload exemplo:**
```json
{
  "event": "lead.created",
  "timestamp": "2025-12-08T17:00:00Z",
  "project_id": "uuid",
  "data": {
    "id": "uuid",
    "email": "user@email.com",
    "name": "João Silva",
    "source": {
      "utm_source": "google",
      "utm_medium": "cpc",
      "utm_campaign": "black-friday"
    },
    "visitor_id": "abc123",
    "created_at": "2025-12-08T17:00:00Z"
  }
}
```

**Arquivos:**
- `supabase/functions/webhook-dispatcher/index.ts`
- Tabela: `webhooks` (configuração)
- Tabela: `webhook_logs` (histórico)

**Falta implementar:**
- [ ] UI para criar/editar webhooks
- [ ] Teste de webhook
- [ ] Visualização de logs
- [ ] Retry manual

---

### 13. Zapier ❌ Não iniciado
**Status:** Planejado para Q2 2025
**Plano mínimo:** Business

**O que faz:**
- Conecta com 5000+ apps
- Triggers para eventos do Revenify
- Actions para criar dados

**Implementação:**
- Criar app no Zapier Developer Platform
- Implementar triggers via webhooks
- Implementar actions via API

**Triggers planejados:**
- New Lead
- New Payment
- New Visitor

**Actions planejados:**
- Create Lead
- Track Event

---

### 14. Make (Integromat) ❌ Não iniciado
**Status:** Planejado para Q2 2025
**Plano mínimo:** Pro

Similar ao Zapier, alternativa mais barata.

---

## 📈 ANALYTICS

### 15. Google Analytics 4 ❌ Não iniciado
**Status:** Planejado para Q2 2025
**Plano mínimo:** Pro

**O que faz:**
- Importa dados do GA4
- Compara métricas
- Enriquece dados de atribuição

**API necessária:**
- Google Analytics Data API
- OAuth 2.0

**Desafios:**
- Matching de usuários entre plataformas
- Rate limits da API
- Complexidade de configuração

---

### 16. Facebook Pixel ❌ Não iniciado
**Status:** Planejado para Q2 2025
**Plano mínimo:** Pro

**O que faz:**
- Sincroniza eventos de conversão
- Envia dados para Conversions API
- Melhora atribuição de ads

**API necessária:**
- Facebook Conversions API
- Access Token

---

## 🔔 NOTIFICAÇÕES

### 17. Slack ❌ Não iniciado
**Status:** Planejado para Q1 2025
**Plano mínimo:** Starter

**O que faz:**
- Envia notificações de leads
- Alerta de vendas
- Resumo diário/semanal

**Mensagens exemplo:**
```
🎉 Novo Lead!
João Silva (joao@email.com)
Fonte: Google Ads / CPC / black-friday
Projeto: Minha Loja

💰 Nova Venda!
R$ 199,90
Cliente: maria@email.com
Fonte: Facebook / paid / remarketing
```

**Implementação:**
- Slack Incoming Webhooks
- Ou Slack App com OAuth

---

### 18. Discord ❌ Não iniciado
**Status:** Planejado para Q2 2025
**Plano mínimo:** Starter

Similar ao Slack, via webhooks.

---

## 📊 DADOS

### 19. Google Sheets ❌ Não iniciado
**Status:** Planejado para Q1 2025
**Plano mínimo:** Starter

**O que faz:**
- Exporta leads automaticamente
- Atualiza planilha em tempo real
- Templates pré-configurados

**Templates:**
- Relatório de Leads
- Relatório de Receita por Fonte
- Dashboard de Métricas

**API necessária:**
- Google Sheets API
- OAuth 2.0

---

### 20. Airtable ❌ Não iniciado
**Status:** Planejado para Q2 2025
**Plano mínimo:** Pro

**O que faz:**
- Sincroniza leads como registros
- Atualiza campos customizados
- Trigger automações do Airtable

---

## 🛠️ IMPLEMENTAÇÃO

### Arquitetura de Integrações

```
┌─────────────────────────────────────────────────────────┐
│                      REVENIFY                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │   Events    │───▶│  Triggers   │───▶│  Webhooks   │ │
│  │   Table     │    │   System    │    │  Outbound   │ │
│  └─────────────┘    └─────────────┘    └─────────────┘ │
│                            │                            │
│                            ▼                            │
│                    ┌─────────────┐                      │
│                    │ Integration │                      │
│                    │   Router    │                      │
│                    └─────────────┘                      │
│                            │                            │
│         ┌──────────────────┼──────────────────┐        │
│         ▼                  ▼                  ▼        │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │   Stripe    │    │   HubSpot   │    │   Slack     │ │
│  │   Connect   │    │     API     │    │   Webhook   │ │
│  └─────────────┘    └─────────────┘    └─────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Tabela: integrations

```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  provider TEXT NOT NULL, -- 'stripe', 'hubspot', 'slack', etc
  status TEXT DEFAULT 'pending', -- 'pending', 'active', 'error'
  credentials JSONB, -- Encrypted credentials
  settings JSONB, -- Provider-specific settings
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Prioridade de Implementação

| Prioridade | Integração | Justificativa |
|------------|------------|---------------|
| 🔴 Alta | Stripe Connect | Core feature, receita |
| 🔴 Alta | Webhooks UI | Flexibilidade |
| 🔴 Alta | Slack | Fácil, alto valor |
| 🟡 Média | RD Station | Mercado BR |
| 🟡 Média | HubSpot | Enterprise |
| 🟡 Média | Google Sheets | Fácil, útil |
| 🟡 Média | Mailchimp | Email marketing |
| 🟢 Baixa | Zapier | Complexo |
| 🟢 Baixa | GA4 | Complexo |
| 🟢 Baixa | Facebook Pixel | Complexo |

---

## 📅 ROADMAP DE INTEGRAÇÕES

### Q1 2025
- [ ] Stripe Connect completo
- [ ] Webhooks UI
- [ ] Slack
- [ ] Google Sheets
- [ ] Mailchimp

### Q2 2025
- [ ] HubSpot
- [ ] RD Station
- [ ] Pipedrive
- [ ] ActiveCampaign
- [ ] Zapier

### Q3 2025
- [ ] GA4
- [ ] Facebook Pixel
- [ ] Salesforce
- [ ] Make
- [ ] Airtable

---

## 🔐 SEGURANÇA

### Armazenamento de Credenciais
- Todas as credenciais são criptografadas
- Tokens de acesso armazenados em `credentials` JSONB
- Refresh tokens gerenciados automaticamente

### OAuth Flow
1. Usuário clica "Conectar"
2. Redirect para provider OAuth
3. Callback recebe authorization code
4. Exchange por access token
5. Salva tokens criptografados
6. Refresh automático quando expira

### Rate Limiting
- Respeitamos rate limits de cada API
- Queue system para requests em batch
- Retry com exponential backoff

---

*Documento atualizado em 08/12/2025*
