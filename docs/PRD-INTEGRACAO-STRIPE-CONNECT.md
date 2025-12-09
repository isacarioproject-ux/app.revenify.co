# PRD - Integração Stripe Connect para Revenue Attribution

## 📋 Visão Geral

Este documento descreve como configurar a integração do Stripe Connect para permitir que os clientes do Revenify conectem suas contas Stripe e rastreiem receita automaticamente.

---

## 🎯 Objetivo

Permitir que usuários do Revenify:
1. Conectem sua conta Stripe com um clique
2. Recebam webhooks de pagamento automaticamente
3. Vejam receita atribuída a cada fonte de tráfego

---

## 📦 Pré-requisitos

### 1. Conta Stripe
- Conta Stripe ativa (https://dashboard.stripe.com)
- Acesso ao Dashboard do Stripe

### 2. Supabase
- Projeto Supabase configurado
- Edge Functions habilitadas

---

## 🔧 Passo a Passo de Configuração

### PASSO 1: Registrar como Plataforma Stripe Connect

1. Acesse: https://dashboard.stripe.com/settings/connect
2. Clique em **"Get started with Connect"**
3. Escolha **"Platform or marketplace"**
4. Preencha os dados da sua empresa:
   - Nome: Revenify
   - Website: https://revenify.io
   - Descrição: Revenue attribution analytics platform

### PASSO 2: Configurar OAuth Settings

1. Acesse: https://dashboard.stripe.com/settings/connect/settings
2. Na seção **"Integration"**:
   - **OAuth settings** → Clique em "Configure"
   - **Redirect URIs**: Adicione:
     ```
     https://ckfvgwdzpelurwhnhbpz.supabase.co/functions/v1/stripe-connect-callback
     ```
3. Copie o **Client ID** (começa com `ca_`)

### PASSO 3: Obter Credenciais

No Dashboard do Stripe, você precisará de:

| Credencial | Onde encontrar | Exemplo |
|------------|----------------|---------|
| **Client ID** | Connect Settings → OAuth | `ca_ABC123...` |
| **Secret Key** | API Keys | `sk_live_...` ou `sk_test_...` |

### PASSO 4: Configurar Secrets no Supabase

1. Acesse: https://supabase.com/dashboard/project/ckfvgwdzpelurwhnhbpz/settings/functions
2. Adicione os seguintes secrets:

```bash
# No terminal ou via Dashboard
supabase secrets set STRIPE_CLIENT_ID=ca_SEU_CLIENT_ID
supabase secrets set STRIPE_SECRET_KEY=sk_live_SUA_SECRET_KEY
supabase secrets set APP_URL=https://revenify.io
```

Ou via Dashboard:
- Vá em **Settings** → **Edge Functions** → **Secrets**
- Adicione cada secret

### PASSO 5: Deploy das Edge Functions

```bash
# Na pasta do projeto
cd C:\SourceTrace

# Deploy de cada função
supabase functions deploy stripe-connect
supabase functions deploy stripe-connect-callback
supabase functions deploy customer-stripe-webhook
supabase functions deploy track-event
supabase functions deploy track-consent
```

### PASSO 6: Executar Migration no Banco

1. Acesse: https://supabase.com/dashboard/project/ckfvgwdzpelurwhnhbpz/sql
2. Copie o conteúdo de `004_FINAL_complete_system.sql`
3. Cole no SQL Editor e clique **Run**

---

## 🔄 Fluxo de Integração (Como Funciona)

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE CONEXÃO STRIPE                      │
└─────────────────────────────────────────────────────────────────┘

1. Usuário clica "Conectar Stripe" no Revenify
   │
   ▼
2. Frontend chama Edge Function: stripe-connect
   │
   ▼
3. Edge Function gera URL OAuth do Stripe
   │
   ▼
4. Usuário é redirecionado para Stripe
   │
   ▼
5. Usuário autoriza no Stripe
   │
   ▼
6. Stripe redireciona para: stripe-connect-callback
   │
   ▼
7. Callback salva tokens na tabela 'integrations'
   │
   ▼
8. Callback cria webhook no Stripe do cliente
   │
   ▼
9. Usuário volta para /settings/integrations?connected=true


┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE PAGAMENTO                           │
└─────────────────────────────────────────────────────────────────┘

1. Cliente do usuário faz pagamento no site
   │
   ▼
2. Stripe processa pagamento
   │
   ▼
3. Stripe envia webhook para: customer-stripe-webhook
   │
   ▼
4. Webhook identifica projeto pelo stripe_account_id
   │
   ▼
5. Webhook insere registro na tabela 'payments'
   │
   ▼
6. Trigger SQL atribui source_id automaticamente
   │
   ▼
7. Trigger atualiza total_revenue na source
   │
   ▼
8. Dashboard mostra receita por fonte em tempo real
```

---

## 📊 Estrutura do Banco de Dados

### Tabela: integrations
```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),  -- Projeto do usuário
  stripe_account_id TEXT,                    -- ID da conta Stripe conectada
  stripe_access_token TEXT,                  -- Token de acesso (criptografado)
  stripe_refresh_token TEXT,                 -- Token de refresh
  stripe_connected_at TIMESTAMPTZ,           -- Data da conexão
  webhook_secret TEXT,                       -- Secret do webhook
  is_active BOOLEAN DEFAULT false,           -- Status da integração
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Tabela: payments
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  session_id TEXT,                           -- Session do visitante
  visitor_id TEXT,                           -- ID persistente do visitante
  source_id UUID REFERENCES sources(id),     -- Fonte atribuída (automático)
  amount DECIMAL(10, 2),                     -- Valor do pagamento
  currency TEXT DEFAULT 'BRL',
  payment_intent_id TEXT UNIQUE,             -- ID do Stripe
  stripe_customer_id TEXT,
  customer_email TEXT,
  status TEXT DEFAULT 'succeeded',
  metadata JSONB,
  created_at TIMESTAMPTZ
);
```

---

## 🔐 Segurança

### Tokens Criptografados
- Access tokens são armazenados criptografados
- Refresh tokens permitem renovação automática

### Webhook Verification
- Cada webhook é verificado com signature
- Webhook secret único por integração

### RLS (Row Level Security)
- Usuários só veem suas próprias integrações
- Políticas de segurança em todas as tabelas

---

## 🧪 Testando a Integração

### 1. Modo de Teste
Use as chaves de teste do Stripe:
- `sk_test_...` em vez de `sk_live_...`

### 2. Simular Pagamento
```javascript
// No console do navegador, no site do cliente
revenify.trackPurchase({
  amount: 99.90,
  currency: 'BRL',
  email: 'cliente@teste.com'
});
```

### 3. Verificar no Dashboard
- Acesse /analytics
- Veja a receita atribuída por fonte

---

## 🐛 Troubleshooting

### Erro: "Integration not found"
- Verifique se o stripe_account_id está correto
- Verifique se is_active = true

### Erro: "Invalid signature"
- Webhook secret pode estar incorreto
- Regenere o webhook no Stripe

### Pagamentos não aparecem
- Verifique logs da Edge Function
- Confirme que o webhook está ativo no Stripe

---

## 📝 Checklist de Deploy

- [ ] Stripe Connect configurado como plataforma
- [ ] Client ID obtido
- [ ] Secret Key obtida
- [ ] Redirect URI configurada no Stripe
- [ ] Secrets configurados no Supabase
- [ ] Edge Functions deployed
- [ ] Migration executada no banco
- [ ] Teste de conexão realizado
- [ ] Teste de pagamento realizado

---

## 🔗 Links Úteis

- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [Stripe OAuth Reference](https://stripe.com/docs/connect/oauth-reference)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

---

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs no Supabase Dashboard
2. Verifique os eventos no Stripe Dashboard
3. Consulte a documentação do Stripe Connect
