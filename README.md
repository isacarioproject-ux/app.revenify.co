# Revenify

**Revenue Attribution Analytics** - Rastreie a origem de cada conversão com precisão.

## 🚀 Features

- **Pixel Tracking** - SDK leve (<2KB) para rastreamento de visitantes
- **UTM Attribution** - Atribuição first-touch e last-touch
- **Real-time Analytics** - Dashboard com métricas em tempo real
- **Cross-domain Tracking** - Rastreamento entre subdomínios
- **Lead Capture** - Captura automática de leads com atribuição de fonte

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **Charts**: Recharts
- **Payments**: Stripe (em desenvolvimento)

## 📦 Instalação

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/revenify.git
cd revenify

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais do Supabase

# Iniciar servidor de desenvolvimento
npm run dev
```

## 🔧 Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute o SQL em `supabase/migrations/001_sourcetrace_tables.sql`
3. Configure as variáveis de ambiente:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

4. Deploy da Edge Function:
```bash
supabase functions deploy track-event
```

## 📊 Uso do Pixel

Adicione o código abaixo ao seu site:

```html
<script>
  window.revenify = { projectKey: 'pk_live_...' };
</script>
<script src="https://cdn.revenify.io/pixel.js" async></script>
```

### Rastrear Lead (Signup)

```javascript
window.revenify.trackLead({
  email: 'usuario@email.com',
  name: 'Nome do Usuário'
});
```

### Rastrear Evento Customizado

```javascript
window.revenify.track('button_click', {
  button_id: 'cta-hero',
  page: '/landing'
});
```

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── dashboard/       # Componentes do dashboard
│   │   ├── metric-card.tsx
│   │   ├── visitors-chart.tsx
│   │   ├── live-events-feed.tsx
│   │   ├── sources-table.tsx
│   │   ├── conversion-funnel.tsx
│   │   ├── create-source-dialog.tsx
│   │   └── upgrade-modal.tsx
│   └── ui/              # Componentes base (shadcn/ui)
├── contexts/            # React Contexts
├── hooks/               # Custom Hooks
├── lib/
│   └── supabase/        # Queries e helpers do Supabase
├── pages/               # Páginas da aplicação
└── public/
    └── pixel/           # SDK de tracking
        └── pixel.js
```

## 🗄️ Schema do Banco de Dados

- **projects** - Sites/apps rastreados
- **events** - Eventos de tracking
- **leads** - Leads capturados
- **sources** - Fontes de tráfego (UTM)
- **subscriptions** - Planos de assinatura

## 📈 Planos

| Plano | Eventos/mês | Projetos | Preço |
|-------|-------------|----------|-------|
| Free | 1.000 | 1 | R$ 0 |
| Starter | 10.000 | 1 | R$ 49 |
| Pro | 50.000 | 5 | R$ 99 |
| Business | 200.000 | Ilimitado | R$ 249 |

## 🔐 Segurança

- Row Level Security (RLS) em todas as tabelas
- Autenticação via Magic Link ou Google OAuth
- Dados isolados por usuário/projeto

## 📝 Scripts

```bash
npm run dev        # Servidor de desenvolvimento
npm run build      # Build de produção
npm run preview    # Preview do build
npm run lint       # Linting
npm run type-check # Verificação de tipos
```

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.
