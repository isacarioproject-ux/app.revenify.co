# 📄 DOCUMENTO COMPLETO - LANDING PAGE ISACAR

## ⚠️ INSTRUÇÕES PARA O CLAUDE

Este documento contém informações REAIS e ATUALIZADAS sobre a plataforma ISACAR, extraídas diretamente do código-fonte. Use APENAS as informações aqui descritas para criar a landing page. NÃO invente funcionalidades que não existem.

---

## 🎯 O QUE É O ISACAR?

**ISACAR** é uma **plataforma de gestão empresarial completa** para profissionais, autônomos e pequenas empresas que precisam organizar suas finanças, tarefas, projetos e documentos em um único lugar.

### ❌ O QUE O ISACAR NÃO É:
- **NÃO** é uma ferramenta colaborativa estilo Miro/FigJam
- **NÃO** é um whiteboard colaborativo
- **NÃO** é focado em equipes grandes/corporativas
- **NÃO** é uma ferramenta de design
- **NÃO** possui whiteboard/quadro branco como feature principal

### ✅ O QUE O ISACAR É:
- Plataforma de **gestão financeira pessoal e empresarial**
- Sistema de **gerenciamento de tarefas e produtividade**
- Ferramenta de **controle de projetos**
- Central de **documentos e organização**
- Aplicativo **PWA instalável** (funciona offline)

---

## 🎯 PÚBLICO-ALVO

1. **Profissionais Autônomos** - Freelancers, consultores, prestadores de serviço
2. **Microempreendedores Individuais (MEI)** - Pequenos empresários
3. **Profissionais Liberais** - Advogados, contadores, médicos, arquitetos
4. **Pequenas Empresas** - Até 10 funcionários
5. **Pessoas que querem controle financeiro pessoal**

---

## 🔥 MÓDULOS PRINCIPAIS (Funcionalidades Reais)

### 1. 💰 MÓDULO FINANCEIRO (Minha Finança)

**O coração da plataforma** - Sistema completo de gestão financeira.

#### Funcionalidades:
- **Documentos Financeiros** - Crie múltiplos documentos para diferentes propósitos:
  - 📊 Orçamento Mensal
  - 💰 Controle de Gastos
  - 💵 Registro de Ganhos
  - 📈 Relatório Anual
  - 🏦 Contas Bancárias

- **Transações** - Registre todas as suas movimentações:
  - Receitas e Despesas
  - Categorização automática
  - Métodos de pagamento (PIX, Cartão, Dinheiro, Transferência)
  - Status (Pendente, Concluído, Cancelado)
  - Transações recorrentes
  - Tags personalizadas
  - Notas e observações

- **Blocos Modulares** (arrastar e soltar):
  - 📅 **Calendário Financeiro** - Visualização por data
  - 🔄 **Contas Recorrentes** - Assinaturas e mensalidades
  - 📊 **Resumo por Categoria** - Análise de gastos
  - 🎯 **Metas Financeiras** - Defina e acompanhe objetivos
  - ⚡ **Despesa Rápida** - Registro express
  - 🧾 **Comprovantes** - Upload de recibos
  - 📈 **Relatório Mensal** - Visão consolidada

- **Gráficos e Análises**:
  - Gráfico de pizza por categoria
  - Evolução de receitas vs despesas
  - Comparativo mensal
  - Indicadores de saúde financeira

- **Exportação**:
  - CSV/Excel
  - PDF profissional
  - JSON para integração

#### Categorias Pré-definidas:
**Receitas**: Salário, Freelance, Investimentos, Vendas, Outros
**Despesas**: Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Roupas, Tecnologia, Assinaturas

---

### 2. 📊 GERENCIADOR DE ORÇAMENTO (Meu Gerenciador)

**Página dedicada** para planejamento financeiro visual.

#### Funcionalidades:
- **Dashboard Visual** com gráfico de pizza interativo
- **Painéis Redimensionáveis**:
  - Sidebar de Entradas (receitas)
  - Painel de Gastos por categoria
  - Painel de Reservas (economias)
  - Painel de Metas
- **Edição Inline** - Clique e edite diretamente
- **Auto-complete Inteligente** - Sugestões baseadas no histórico
- **Seletor de Documento** - Alterne entre documentos financeiros
- **Integração com GoalsBlock** - Metas sincronizadas

---

### 3. ✅ MÓDULO DE TAREFAS (Meu Trabalho)

**Sistema completo de produtividade** estilo Notion/Todoist.

#### Funcionalidades:
- **Organização por Status**:
  - Pendente (Todo)
  - Em Progresso
  - Em Revisão
  - Concluído

- **Prioridades**: Baixa, Média, Alta, Urgente

- **Agrupamento Inteligente**:
  - Hoje
  - Em Atraso
  - Próximas
  - Não Programadas

- **Features Avançadas**:
  - 📅 Data de início e vencimento
  - 👥 Atribuição a membros do workspace
  - 🏷️ Tags personalizadas
  - 📎 Anexos (arquivos e links)
  - ✅ Subtarefas
  - 📋 Checklists com progresso
  - 💬 Comentários com @menções
  - ⏱️ Time Tracker (cronômetro de tempo)
  - 🔗 Relacionamento entre tarefas
  - 📍 Localização
  - 🔔 Lembretes com notificações

- **Modal de Detalhes Completo**:
  - Sidebar de Subtarefas
  - Sidebar de Chat/Atividades
  - Histórico de alterações
  - Editor de descrição rico

- **Templates de Tarefas**:
  - Templates pré-definidos por categoria
  - Categorias: Pessoal, Trabalho, TI, Geral

- **Quick Add** - Criação rápida com atalhos

---

### 4. 📁 MÓDULO DE PROJETOS (Meus Projetos)

**Gestão de projetos** com visualização Kanban.

#### Funcionalidades:
- **Visualização Kanban** com drag & drop
- **Status de Projetos**:
  - Planejamento
  - Em Andamento
  - Concluído
  - Pausado
  - Cancelado

- **Dentro de cada projeto**:
  - Documentos financeiros vinculados
  - Arquivos do Google Drive
  - Tarefas relacionadas
  - Membros/colaboradores
  - Timeline de atividades

- **Features**:
  - Projetos públicos ou privados
  - Compartilhamento com membros
  - Busca e filtros
  - Gráfico de status (pizza)
  - Contador de documentos

---

### 5. 🔗 INTEGRAÇÕES GOOGLE

**Conexão real com serviços Google** (implementado com OAuth).

#### Serviços Integrados:
- **📧 Gmail** - Importação de notas fiscais
- **📅 Google Calendar** - Sincronização de eventos
- **📊 Google Sheets** - Exportação de planilhas
- **📁 Google Drive** - Armazenamento de arquivos

#### Funcionalidades:
- Login com Google
- Sincronização automática
- Detecção de token expirado
- Reconexão automática
- Indicador de status de conexão
- Logs de sincronização
- Dashboard de analytics de sync

---

### 6. 📈 ANALYTICS

**Dashboard de métricas** do workspace.

#### Métricas:
- Total de operações
- Taxa de sucesso/erro
- Logs de sincronização
- Histórico de atividades
- Gráficos de performance

---

### 7. 👤 PERFIL E CONFIGURAÇÕES

- **Perfil** - Nome, avatar, email
- **Notificações** - Preferências de alertas
- **Preferências** - Tema (claro/escuro/sistema), idioma
- **Billing** - Plano atual, uso, upgrade
- **Integrações** - Conectar serviços

---

## 🏢 SISTEMA DE WORKSPACES

**Multi-tenancy real** - Separe vida pessoal de profissional.

### Funcionalidades:
- **Workspace Pessoal** - Dados privados (workspace_id = null)
- **Workspaces Colaborativos** - Compartilhe com equipe
- **Troca Rápida** - Switcher estilo Notion
- **Convites por Email** - Válidos por 14 dias
- **Roles**:
  - Owner (dono)
  - Admin (administrador)
  - Member (membro)

---

## 💰 PLANOS E PREÇOS

### 1. GRÁTIS
- 1 projeto
- Até 2 membros (você + 1)
- 1 GB de armazenamento
- Documentos ilimitados
- Suporte por email

### 2. PRO - R$ 65/mês (R$ 624/ano - 20% off)
- Até 5 projetos
- Até 10 membros
- 50 GB de armazenamento
- Documentos ilimitados
- Analytics avançado
- Exportação CSV/JSON
- Suporte prioritário
- **14 dias de trial gratuito**

### 3. BUSINESS - R$ 197/mês (R$ 1.891/ano - 20% off)
- Projetos ilimitados
- Membros ilimitados
- 200 GB de armazenamento
- Documentos ilimitados
- Branding customizado
- SSO (Single Sign-On)
- Backup automático
- Suporte 24/7
- **14 dias de trial gratuito**

### 4. ENTERPRISE - Personalizado
- Tudo do Business
- Armazenamento ilimitado
- On-premise deployment
- SLA 99.9%
- Auditoria de segurança
- Treinamento personalizado
- Integrações customizadas
- Contrato anual

---

## 🌐 INTERNACIONALIZAÇÃO (i18n)

**3 idiomas suportados**:
- 🇧🇷 Português (Brasil) - Padrão
- 🇺🇸 English
- 🇪🇸 Español

Toda a interface é traduzida, incluindo:
- Navegação
- Formulários
- Mensagens de erro
- Toasts de feedback
- Datas e formatos numéricos

---

## 📱 CARACTERÍSTICAS TÉCNICAS

### PWA (Progressive Web App)
- ✅ Instalável no celular e desktop
- ✅ Funciona offline (cache local)
- ✅ Notificações push (lembretes)
- ✅ Ícone na tela inicial
- ✅ Abre como app nativo

### Tecnologias:
- React 18 + TypeScript
- Vite (build rápido)
- Tailwind CSS (design)
- Framer Motion (animações)
- Supabase (backend)
- PostgreSQL (banco de dados)

### Performance:
- Lazy loading de páginas
- Skeleton loading
- Cache inteligente
- Debounce em buscas
- Otimização de imagens

### Segurança:
- Autenticação Supabase
- Row Level Security (RLS)
- Tokens OAuth seguros
- HTTPS obrigatório

---

## 🎨 DESIGN E UX

### Tema:
- Modo claro e escuro
- Tema do sistema automático
- Cores consistentes
- Animações fluidas

### Interface:
- Sidebar responsiva
- Cards arrastáveis (drag & drop)
- Modais modernos
- Tooltips informativos
- Toasts de feedback
- Skeletons de carregamento

### Mobile:
- 100% responsivo
- Touch-friendly
- Gestos nativos
- Swipe para ações

---

## 🚀 ONBOARDING

**Fluxo de 10 passos** para novos usuários:

1. **Welcome** - Boas-vindas
2. **Workspace** - Criar espaço de trabalho
3. **Team Invite** - Convidar colegas
4. **Pricing** - Escolher plano
5. **User Type** - Tipo de usuário
6. **Tour** - Tour pela plataforma
7. **Goals** - Definir objetivos
8. **First Task** - Criar primeira tarefa
9. **Management** - Configurar gestão
10. **Budget** - Configurar orçamento
11. **Completion** - Finalização

---

## 📋 DIFERENCIAIS PARA LANDING PAGE

### Headline Principal:
**"Organize suas finanças, tarefas e projetos em um único lugar"**

### Subheadline:
**"A plataforma completa de gestão para profissionais que querem ter controle total sobre seu negócio e vida pessoal"**

### Proposta de Valor:
1. **Tudo em um lugar** - Finanças + Tarefas + Projetos
2. **Visual e intuitivo** - Interface moderna estilo Notion
3. **Offline-first** - Funciona sem internet
4. **Multi-idioma** - PT-BR, EN, ES
5. **Integrado** - Google Workspace nativo
6. **Seguro** - Dados criptografados

### CTAs Sugeridos:
- "Comece grátis"
- "Experimente 14 dias grátis"
- "Crie sua conta"
- "Ver demonstração"

### Social Proof Sugerido:
- Número de usuários (se tiver)
- Número de transações registradas
- Número de tarefas concluídas
- Reviews/depoimentos

---

## 🎯 SEÇÕES SUGERIDAS PARA LANDING PAGE

1. **Hero** - Headline + CTA + Screenshot do dashboard
2. **Problema/Solução** - Dores do público-alvo
3. **Features** - Os 4 módulos principais com ícones
4. **Como Funciona** - 3 passos simples
5. **Integração Google** - Logos e benefícios
6. **Preços** - 4 planos com toggle mensal/anual
7. **PWA** - Mostre instalação mobile
8. **FAQ** - Perguntas frequentes
9. **CTA Final** - Última chamada para ação
10. **Footer** - Links, legal, social

---

## ⚠️ NÃO MENCIONAR NA LANDING PAGE

- ❌ Whiteboard/Quadro branco
- ❌ Colaboração em tempo real estilo Figma/Miro
- ❌ Edição colaborativa de documentos
- ❌ Features que não existem
- ❌ Comparações com Notion/ClickUp (são diferentes)

---

## ✅ PALAVRAS-CHAVE CORRETAS

- Gestão financeira
- Controle de gastos
- Orçamento pessoal
- Gerenciador de tarefas
- Produtividade
- Gestão de projetos
- Organização empresarial
- Finanças pessoais
- MEI/Autônomo
- Profissional liberal
- PWA/App offline
- Integração Google

---

## 📸 SCREENSHOTS SUGERIDOS

1. **Dashboard** - Grid de cards (Finanças, Tarefas, Projetos, Analytics)
2. **Módulo Financeiro** - Tabela de transações + gráficos
3. **Gerenciador de Orçamento** - Gráfico de pizza + painéis
4. **Tarefas** - Modal de tarefa com subtarefas
5. **Projetos** - Kanban com cards
6. **Mobile** - Versão responsiva
7. **PWA** - Instalação no celular

---

## 🔗 LINKS IMPORTANTES

- App: app.isacar.dev
- Landing Page: lp.isacar.dev (a criar)
- Preços: lp.isacar.dev/preco
- Termos: /terms-of-service
- Privacidade: /privacy-policy

---

**Documento gerado em:** 28/11/2025
**Versão do App:** 1.3.1
**Status:** ✅ INFORMAÇÕES VERIFICADAS NO CÓDIGO-FONTE
