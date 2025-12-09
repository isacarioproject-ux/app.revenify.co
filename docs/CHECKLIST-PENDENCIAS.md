# 📋 REVENIFY - CHECKLIST DE PENDÊNCIAS

> Última atualização: 09/12/2025

---

## ✅ CONCLUÍDO

### i18n (Internacionalização) ✅ 100%
- [x] Idioma padrão alterado para inglês
- [x] Suporte a PT-BR, EN e ES
- [x] Páginas de Settings traduzidas (Profile, Notifications, Preferences, Billing)
- [x] Sidebar e navegação traduzidas
- [x] Onboarding completo traduzido (4 steps)
- [x] Login/Signup traduzido
- [x] Correção de chaves duplicadas no i18n.ts
- [x] Templates page traduzida
- [x] Customer Journey traduzida
- [x] Integrations header traduzido

### Blog Admin ✅ (Funcional)
- [x] Criar bucket `blog-images` no Storage
- [x] Página de admin para criar/editar posts (`/blog-admin`)
- [x] Upload de imagens funcionando
- [x] Editor de conteúdo
- [x] **Acesso restrito apenas para `revenify.co@gmail.com`**
- [x] **Interface em português** (admin interno)
- ℹ️ *Página pública do blog fica no repositório da landing page*

### Customer Journey ✅ (Implementado)
- [x] Página de visualização de jornadas
- [x] Timeline de touchpoints
- [x] Busca por email ou visitor_id
- [x] Tradução i18n completa

### Onboarding ✅ (Completo)
- [x] UI moderna com animações (Framer Motion)
- [x] Step 1: Boas-vindas + benefícios
- [x] Step 2: Criar primeiro projeto (nome + domínio)
- [x] Step 3: Instalar pixel (com código para copiar)
- [x] Step 4: Sucesso com próximos passos
- [x] Opção "Pular" disponível
- [x] Tradução i18n completa (PT-BR, EN, ES)

### Core Features ✅ (Funcional)
- [x] Dashboard com métricas
- [x] Projetos CRUD
- [x] Sources (fontes de tráfego)
- [x] Leads tracking
- [x] Analytics page
- [x] Templates UTM
- [x] Short Links
- [x] Customer Journey

---

## 🔴 BLOQUEADORES (Precisa comprar domínio)

### Domínio & DNS
- [ ] Comprar domínio `revenify.co`
- [ ] Configurar DNS no Cloudflare/Vercel
- [ ] Apontar `app.revenify.co` para Vercel (dashboard)
- [ ] Apontar `cdn.revenify.co` para servir o pixel.js
- [ ] Configurar SSL/HTTPS

### Pixel CDN
- [ ] Hospedar `/public/pixel/pixel.js` em CDN
- [ ] Configurar CORS para permitir qualquer origem
- [ ] Testar pixel em site externo

---

## 🟡 CONFIGURAÇÕES PENDENTES

### Stripe (Pagamentos)
- [ ] Criar conta Stripe (se não tiver)
- [ ] Criar produtos no Stripe Dashboard:
  - [ ] Starter Monthly (R$ 49/mês)
  - [ ] Starter Yearly (R$ 490/ano)
  - [ ] Pro Monthly (R$ 149/mês)
  - [ ] Pro Yearly (R$ 1.490/ano)
  - [ ] Business Monthly (R$ 399/mês)
  - [ ] Business Yearly (R$ 3.990/ano)
- [ ] Copiar Price IDs e configurar no Supabase Secrets
- [ ] Configurar Webhook no Stripe Dashboard
- [ ] Testar fluxo de checkout completo

### Google OAuth
- [ ] Criar projeto no Google Cloud Console
- [ ] Configurar OAuth consent screen
- [ ] Criar credenciais OAuth 2.0
- [ ] Adicionar redirect URI no Supabase
- [ ] Configurar no Supabase Dashboard > Authentication > Providers > Google

### OpenAI (Chat IA)
- [ ] Criar conta OpenAI
- [ ] Gerar API Key
- [ ] Configurar `OPENAI_API_KEY` no Supabase Edge Functions

---

## 🟢 FUNCIONALIDADES A MELHORAR

### Customer Journey
- [ ] Adicionar filtros por data
- [ ] Adicionar exportação CSV
- [ ] Melhorar visualização com gráfico de funil

### Integrações (Página existe, falta implementar)
- [ ] **Stripe Connect** - Rastrear pagamentos automaticamente
- [ ] **Webhooks Outbound** - Enviar eventos para sistemas externos
- [ ] **Slack** - Notificações de leads/vendas

---

## 🔵 MELHORIAS FUTURAS (Pós-lançamento)

### Analytics Avançado
- [ ] Heatmaps de cliques
- [ ] Gravação de sessões
- [ ] A/B Testing
- [ ] Cohort analysis

### API Pública
- [ ] Documentação Swagger/OpenAPI
- [ ] Rate limiting por plano
- [ ] SDKs (JavaScript, Python)

### Integrações Adicionais
- [ ] Google Analytics - Importar dados do GA4
- [ ] Facebook Pixel - Sincronizar eventos
- [ ] Zapier - Conectar com 5000+ apps
- [ ] HubSpot/Pipedrive/RD Station - Sincronizar leads

### White Label (Business+)
- [ ] Remover branding Revenify
- [ ] Domínio customizado para dashboard
- [ ] Cores/Logo customizáveis

---

## 📊 PROGRESSO GERAL

| Categoria | Progresso |
|-----------|-----------|
| Core Features | ✅ 100% |
| Autenticação | 80% |
| i18n (Traduções) | ✅ 100% |
| Pagamentos | 30% |
| Integrações | 20% |
| Blog Admin | ✅ 100% |
| Customer Journey | ✅ 100% |
| Onboarding | ✅ 100% |

---

## 🚀 ORDEM DE EXECUÇÃO RECOMENDADA

1. **Comprar domínio** → Desbloqueia pixel CDN e short links
2. **Configurar Stripe** → Desbloqueia monetização
3. **Configurar Google OAuth** → Melhora conversão de signup
4. **Deploy produção** → Go live!
5. **Implementar Integrações** → Aumenta valor do produto

---

## 📝 NOTAS

- **Blog público**: A página pública do blog (`/blog`, `/blog/:slug`) fica no repositório da landing page, não neste app
- **Blog admin**: Acessível apenas por `revenify.co@gmail.com` em `/blog-admin`
- **Idioma do admin**: Interface do blog admin em português (uso interno)
- **Para testar**: Faça login com `revenify.co@gmail.com` para ver todas as funcionalidades
