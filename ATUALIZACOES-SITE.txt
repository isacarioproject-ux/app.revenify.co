# ============================================================
# PRD - ATUALIZAÇÕES PARA O SITE REVENIFY
# ============================================================
# Data: 15/12/2024
# Versão: 1.0
# Status: Para implementação no site institucional
# ============================================================

## 📋 RESUMO EXECUTIVO

Este documento detalha todas as features implementadas no app.revenify.co
que precisam ser refletidas no site institucional (tabelas de preços,
seções de features, landing pages, etc.)

**Completude atual do produto: 98.5%**
**Feature parity com Dub.co: ✅ ALCANÇADO**

============================================================
## 🆕 NOVAS FEATURES IMPLEMENTADAS
============================================================

### 1. A/B TESTING DE LINKS
- Descrição: Split testing de URLs com porcentagem configurável
- Disponível em: Starter (3 testes), Pro (ilimitado), Business (ilimitado)
- Trial: 2 testes
- Free: ❌ Não disponível
- Badge na UI: "A/B"
- Ícone sugerido: GitBranch ou Split

### 2. GEO TARGETING
- Descrição: Redireciona visitantes para URLs diferentes baseado no país
- Disponível em: Starter (5 regras), Pro (ilimitado), Business (ilimitado)
- Trial: 3 regras
- Free: ❌ Não disponível
- Badge na UI: "🌍 Geo Rules"
- Ícone sugerido: Globe ou MapPin

### 3. DEVICE TARGETING
- Descrição: URLs diferentes para Desktop, Mobile e Tablet
- Disponível em: Starter, Pro, Business
- Trial: ✅ Disponível
- Free: ❌ Não disponível
- Badge na UI: "📱 Device"
- Ícone sugerido: Smartphone, Monitor, Tablet

### 4. DEEP LINKS
- Descrição: Abre apps diretamente (iOS/Android) com fallback para web
- Campos: iOS Deep Link, Android Deep Link, Fallback URL
- Disponível em: Starter, Pro, Business
- Trial: ✅ Disponível
- Free: ❌ Não disponível
- Badge na UI: "🔗 Deep Link"
- Ícone sugerido: Link2 ou ExternalLink

### 5. LINK CLOAKING
- Descrição: Personaliza Open Graph (título, descrição, imagem) para previews
- Campos: Cloaked Title, Cloaked Description, Cloaked Image URL
- Disponível em: Pro, Business (exclusivo)
- Trial: ✅ Disponível (para mostrar valor)
- Starter: ❌ Não disponível
- Free: ❌ Não disponível
- Badge na UI: "👁️ Cloaked"
- Ícone sugerido: Eye ou Image

### 6. PASSWORD PROTECTION
- Descrição: Protege links com senha
- Disponível em: Free, Starter, Pro, Business
- Trial: ✅ Disponível
- Badge na UI: "🔒 Protected"
- Ícone sugerido: Lock ou Key

### 7. LINK EXPIRATION
- Descrição: Links expiram automaticamente após data/hora definida
- Disponível em: Free, Starter, Pro, Business
- Trial: ✅ Disponível
- Ícone sugerido: Calendar ou Clock

### 8. SSO/SAML
- Descrição: Single Sign-On com SAML 2.0 e OIDC
- Campos: Entity ID, SSO URL, Certificate, Attribute Mapping, Allowed Domains
- Disponível em: Business (exclusivo)
- Trial: ❌ Não disponível
- Ícone sugerido: Shield ou Key

### 9. ADVANCED ATTRIBUTION MODELS
- Descrição: Modelos de atribuição avançados (Linear, Time-Decay, Position-Based)
- Disponível em: Pro, Business
- Trial: ✅ Disponível
- Starter: ❌ Não disponível
- Free: ❌ Não disponível

### 10. WEBHOOKS
- Descrição: Integração com sistemas externos via webhooks
- Disponível em: Pro, Business
- Trial: ✅ Disponível (para criar dependência)
- Starter: ❌ Não disponível
- Free: ❌ Não disponível

============================================================
## 💰 TABELA DE PREÇOS ATUALIZADA
============================================================

### PLANO FREE ($0/mês)
Limites:
- 1 projeto
- 25 short links
- 1.000 eventos/mês
- 10 mensagens AI/dia
- Retenção: 7 dias
- 0 domínios customizados

Features incluídas:
- ✅ Password Protection
- ✅ Link Expiration
- ✅ QR Codes (sem logo)
- ❌ Custom Domain
- ❌ A/B Testing
- ❌ Geo Targeting
- ❌ Device Targeting
- ❌ Deep Links
- ❌ Link Cloaking
- ❌ Webhooks
- ❌ API Access
- ❌ Revenue Attribution

---

### PLANO STARTER ($8/mês ou $72/ano)
Limites:
- 3 projetos
- 100 short links
- 5.000 eventos/mês
- 50 mensagens AI/dia
- Retenção: 30 dias
- 1 domínio customizado

Features incluídas:
- ✅ Tudo do Free
- ✅ Custom Domain
- ✅ A/B Testing (3 testes)
- ✅ Geo Targeting (5 regras)
- ✅ Device Targeting
- ✅ Deep Links
- ✅ API Access
- ✅ Revenue Attribution
- ❌ Link Cloaking (Pro+)
- ❌ Webhooks (Pro+)
- ❌ Multi-touch Attribution (Pro+)

---

### PLANO PRO ($20/mês ou $192/ano) ⭐ POPULAR
Limites:
- 10 projetos
- 1.000 short links
- 200.000 eventos/mês
- 200 mensagens AI/dia
- Retenção: 1 ano
- 3 domínios customizados

Features incluídas:
- ✅ Tudo do Starter
- ✅ A/B Testing ILIMITADO
- ✅ Geo Targeting ILIMITADO
- ✅ Link Cloaking
- ✅ Webhooks
- ✅ Multi-touch Attribution
- ✅ Suporte prioritário
- ❌ SSO/SAML (Business)
- ❌ White-label (Business)

---

### PLANO BUSINESS ($50/mês ou $480/ano)
Limites:
- Projetos ILIMITADOS
- Short links ILIMITADOS
- 500.000 eventos/mês
- 1.000 mensagens AI/dia
- Retenção: 3 anos
- Domínios ILIMITADOS

Features incluídas:
- ✅ Tudo do Pro
- ✅ SSO/SAML
- ✅ White-label
- ✅ Suporte dedicado
- ✅ SLA garantido

============================================================
## 🎁 PLANO TRIAL (14 DIAS)
============================================================

Objetivo: Mostrar valor das features Pro para converter em pagante

Limites:
- 2 projetos
- 50 short links
- 2.000 eventos/mês
- 30 mensagens AI/dia
- Retenção: 14 dias
- 1 domínio customizado

Features incluídas (Pro limitado):
- ✅ Custom Domain
- ✅ A/B Testing (2 testes)
- ✅ Geo Targeting (3 regras)
- ✅ Device Targeting
- ✅ Deep Links
- ✅ Link Cloaking
- ✅ Webhooks
- ✅ API Access
- ✅ Revenue Attribution
- ✅ Multi-touch Attribution
- ❌ SSO/SAML

============================================================
## 📊 SEÇÕES DO SITE A ATUALIZAR
============================================================

### 1. PÁGINA DE PRICING (/pricing)

Atualizar tabela de comparação com:
- Novas colunas: A/B Testing, Geo Targeting, Device Targeting, Deep Links, Link Cloaking
- Novos limites por plano
- Badge "Popular" no Pro
- CTA para Trial de 14 dias

### 2. LANDING PAGE PRINCIPAL (/)

Adicionar seção "Features Avançadas":
- A/B Testing - "Otimize suas campanhas com split testing"
- Geo Targeting - "Personalize por localização"
- Device Targeting - "Experiência perfeita em qualquer dispositivo"
- Deep Links - "Abra seu app diretamente"
- Link Cloaking - "Controle como seus links aparecem"

### 3. PÁGINA DE FEATURES (/features)

Criar cards para cada feature nova:
- Título
- Descrição
- Ícone
- Planos disponíveis
- Screenshot/GIF demonstrativo

### 4. PÁGINA DE SHORT LINKS (/short-links ou /features/short-links)

Destacar:
- A/B Testing de URLs
- Geo Targeting
- Device Targeting
- Deep Links para apps
- Link Cloaking (Open Graph)
- Password Protection
- Link Expiration
- QR Codes customizáveis

### 5. PÁGINA DE ENTERPRISE (/enterprise)

Destacar:
- SSO/SAML
- White-label
- Advanced Attribution
- SLA garantido
- Suporte dedicado

### 6. PÁGINA DE TRIAL (/trial ou /start)

Criar landing específica:
- "Experimente o Pro por 14 dias grátis"
- Lista de features incluídas
- Countdown visual
- CTA forte

============================================================
## 🎯 COPY SUGERIDO PARA FEATURES
============================================================

### A/B Testing
Título: "Teste A/B de Links"
Subtítulo: "Descubra qual URL converte mais"
Descrição: "Divida o tráfego entre duas URLs e veja qual performa melhor. Defina a porcentagem de split e acompanhe os resultados em tempo real."

### Geo Targeting
Título: "Geo Targeting"
Subtítulo: "Personalize por localização"
Descrição: "Redirecione visitantes para URLs diferentes baseado no país de origem. Perfeito para campanhas internacionais e conteúdo localizado."

### Device Targeting
Título: "Device Targeting"
Subtítulo: "Experiência otimizada por dispositivo"
Descrição: "Envie usuários de desktop, mobile e tablet para URLs específicas. Garanta a melhor experiência em cada plataforma."

### Deep Links
Título: "Deep Links"
Subtítulo: "Abra seu app diretamente"
Descrição: "Links que abrem seu app iOS ou Android diretamente, com fallback inteligente para a App Store ou web quando o app não está instalado."

### Link Cloaking
Título: "Link Cloaking"
Subtítulo: "Controle seus previews"
Descrição: "Personalize como seu link aparece quando compartilhado. Defina título, descrição e imagem customizados para redes sociais e mensageiros."

### SSO/SAML
Título: "SSO/SAML Enterprise"
Subtítulo: "Login corporativo seguro"
Descrição: "Integre com seu provedor de identidade (Okta, Azure AD, Google Workspace) para autenticação centralizada e segura."

============================================================
## 📈 MÉTRICAS DE COMPARAÇÃO COM CONCORRENTES
============================================================

| Feature | Revenify | Dub.co | Bitly |
|---------|----------|--------|-------|
| A/B Testing | ✅ | ✅ | ❌ |
| Deep Links | ✅ | ✅ | ❌ |
| Geo Targeting | ✅ | ✅ | ❌ |
| Device Targeting | ✅ | ✅ | ❌ |
| Link Cloaking | ✅ | ✅ | ❌ |
| Password Protection | ✅ | ✅ | ✅ |
| Link Expiration | ✅ | ✅ | ✅ |
| SSO/SAML | ✅ | ✅ | ✅ |
| AI Chat | ✅ | ❌ | ❌ |
| White-label | ✅ | ❌ | ❌ |
| Customer Journey | ✅ | ❌ | ❌ |
| Revenue Attribution | ✅ | ✅ | ❌ |

**Diferencial Revenify:**
- 3x mais barato que Dub.co
- AI Chat integrado (exclusivo)
- Customer Journey tracking (exclusivo)
- White-label disponível

============================================================
## ✅ CHECKLIST DE IMPLEMENTAÇÃO
============================================================

[ ] Atualizar página de Pricing com nova tabela
[ ] Adicionar seção de features avançadas na landing
[ ] Criar página dedicada para cada feature
[ ] Atualizar página de Enterprise com SSO
[ ] Criar landing page de Trial
[ ] Atualizar FAQ com novas features
[ ] Criar blog posts sobre cada feature
[ ] Atualizar documentação/help center
[ ] Configurar emails de conversão do Trial
[ ] Adicionar tooltips explicativos no app

============================================================
## 📞 CONTATO
============================================================

Dúvidas sobre este PRD: Consultar ANALISE-MERCADO.md no repositório
Código fonte: src/lib/stripe/plans.ts

============================================================
# FIM DO DOCUMENTO
============================================================
