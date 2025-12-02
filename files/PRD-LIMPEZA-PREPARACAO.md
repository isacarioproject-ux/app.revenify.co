# PRD DE LIMPEZA E PREPARAÇÃO
## Projeto Base → SourceTrace
### Análise Completa | Remoção | Adição | Preparação

---

# 📊 ANÁLISE DO PROJETO BASE

## Informações Gerais
```json
{
  "nome": "isacar-io",
  "versão": "1.3.1",
  "framework": "Vite + React 18",
  "linguagem": "TypeScript",
  "styling": "Tailwind CSS + shadcn/ui",
  "tema": "Dark mode (next-themes)",
  "i18n": "i18next (PT/EN/ES)",
  "deploy": "Vercel"
}
```

---

# 🔍 ANÁLISE DE DEPENDÊNCIAS (79 total)

## ✅ MANTER (Essenciais para SourceTrace)

### Core React/Build (7)
```json
{
  "react": "^18.3.1",                      // ✅ Core
  "react-dom": "^18.3.1",                  // ✅ Core
  "react-router-dom": "^7.9.4",            // ✅ Routing
  "vite": "^5.4.10",                       // ✅ Build tool
  "typescript": "^5.6.3",                  // ✅ Language
  "@vitejs/plugin-react-swc": "^3.7.0",    // ✅ Vite plugin
  "tailwindcss": "^3.4.15"                 // ✅ Styling
}
```

### Radix UI Base (Necessários - 12)
```json
{
  "@radix-ui/react-dialog": "^1.1.15",           // ✅ Modals/Dialogs
  "@radix-ui/react-dropdown-menu": "^2.1.16",    // ✅ Dropdowns
  "@radix-ui/react-select": "^2.2.6",            // ✅ Selects
  "@radix-ui/react-label": "^2.1.0",             // ✅ Labels
  "@radix-ui/react-slot": "^1.2.4",              // ✅ Slot (composition)
  "@radix-ui/react-tooltip": "^1.2.8",           // ✅ Tooltips
  "@radix-ui/react-tabs": "^1.1.1",              // ✅ Tabs (Settings)
  "@radix-ui/react-switch": "^1.1.1",            // ✅ Toggle switches
  "@radix-ui/react-popover": "^1.1.15",          // ✅ Popovers
  "@radix-ui/react-separator": "^1.1.8",         // ✅ Dividers
  "@radix-ui/react-scroll-area": "^1.2.10",      // ✅ Scroll areas
  "@radix-ui/react-avatar": "^1.1.11"            // ✅ User avatars
}
```

### Utilities Essenciais (9)
```json
{
  "@supabase/supabase-js": "^2.45.4",       // ✅ Database
  "class-variance-authority": "^0.7.1",     // ✅ CVA (componentes)
  "clsx": "^2.1.1",                         // ✅ Class merging
  "tailwind-merge": "^2.6.0",               // ✅ Tailwind merge
  "framer-motion": "^11.18.2",              // ✅ Animações
  "lucide-react": "^0.454.0",               // ✅ Ícones
  "sonner": "^2.0.7",                       // ✅ Toast notifications
  "date-fns": "^4.1.0",                     // ✅ Date utils
  "next-themes": "^0.4.3"                   // ✅ Dark mode
}
```

### i18n (3)
```json
{
  "i18next": "^25.6.0",                           // ✅ i18n core
  "i18next-browser-languagedetector": "^8.2.0",   // ✅ Auto-detect language
  "react-i18next": "^16.2.4"                      // ✅ React bindings
}
```

### Charts (1)
```json
{
  "recharts": "^2.15.4"  // ✅ Gráficos dashboard
}
```

### Forms (2)
```json
{
  "react-hook-form": "^7.66.0",  // ✅ Forms
  "zod": "^3.23.8"               // ✅ Validation
}
```

**TOTAL MANTER: 37 pacotes** ✅

---

## ❌ REMOVER (Não necessários para SourceTrace)

### Drag & Drop (3) - Não usamos
```json
{
  "@dnd-kit/core": "^6.3.1",          // ❌ Remover
  "@dnd-kit/sortable": "^10.0.0",     // ❌ Remover
  "@dnd-kit/utilities": "^3.2.2"      // ❌ Remover
}
```

### Radix UI Extras (13) - Não usamos
```json
{
  "@radix-ui/react-accordion": "^1.2.12",        // ❌ Remover
  "@radix-ui/react-alert-dialog": "^1.1.15",     // ❌ Remover (usamos dialog)
  "@radix-ui/react-aspect-ratio": "^1.1.8",      // ❌ Remover
  "@radix-ui/react-checkbox": "^1.1.2",          // ❌ Remover (não usamos checkboxes)
  "@radix-ui/react-collapsible": "^1.1.12",      // ❌ Remover
  "@radix-ui/react-context-menu": "^2.2.16",     // ❌ Remover
  "@radix-ui/react-hover-card": "^1.1.15",       // ❌ Remover
  "@radix-ui/react-menubar": "^1.1.16",          // ❌ Remover
  "@radix-ui/react-navigation-menu": "^1.2.14",  // ❌ Remover
  "@radix-ui/react-progress": "^1.1.7",          // ❌ Remover
  "@radix-ui/react-radio-group": "^1.3.8",       // ❌ Remover
  "@radix-ui/react-slider": "^1.3.6",            // ❌ Remover
  "@radix-ui/react-toggle": "^1.1.10",           // ❌ Remover
  "@radix-ui/react-toggle-group": "^1.1.11"      // ❌ Remover
}
```

### PDF/Export Tools (5) - Não usamos
```json
{
  "html2canvas": "^1.4.1",           // ❌ Remover (screenshot)
  "html2pdf.js": "^0.12.1",          // ❌ Remover (PDF export)
  "jspdf": "^3.0.3",                 // ❌ Remover (PDF gen)
  "jspdf-autotable": "^5.0.2",       // ❌ Remover (PDF tables)
  "turndown": "^7.2.2"               // ❌ Remover (HTML→Markdown)
}
```

### UI Extras (6) - Não usamos
```json
{
  "embla-carousel-react": "^8.6.0",  // ❌ Remover (carousel)
  "input-otp": "^1.4.2",             // ❌ Remover (OTP input)
  "react-draggable": "^4.5.0",       // ❌ Remover (drag)
  "react-resizable-panels": "^3.0.6", // ❌ Remover (resizable)
  "vaul": "^1.1.2",                  // ❌ Remover (drawer)
  "cmdk": "^1.1.1"                   // ❌ Remover (command palette)
}
```

### Outros (5)
```json
{
  "@radix-ui/react-icons": "^1.3.2",  // ❌ Remover (usamos lucide-react)
  "radix-ui": "^1.4.3",               // ❌ Remover (duplicado)
  "nanoid": "^5.1.6",                 // ❌ Remover (ID gen - desnecessário)
  "react-day-picker": "^9.11.1",      // ❌ Remover (date picker - não usamos)
  "vite-plugin-pwa": "^1.1.0"         // ❌ Remover (PWA - não necessário)
}
```

### DevDependencies Extras (2)
```json
{
  "@types/html2pdf.js": "^0.10.0",  // ❌ Remover
  "@types/turndown": "^5.0.6"       // ❌ Remover
}
```

**TOTAL REMOVER: 42 pacotes** ❌

---

## 🆕 ADICIONAR (Para SourceTrace)

### Tracking & Analytics (2)
```json
{
  "ua-parser-js": "^1.0.37",              // 🆕 Parse User-Agent
  "@types/ua-parser-js": "^0.7.39",       // 🆕 Types
  "@fingerprintjs/fingerprintjs": "^4.4.1" // 🆕 Browser fingerprinting
}
```

### Stripe (2)
```json
{
  "stripe": "^14.10.0",        // 🆕 Stripe backend
  "@stripe/stripe-js": "^2.4.0" // 🆕 Stripe frontend
}
```

**TOTAL ADICIONAR: 4 pacotes** 🆕

---

# 📦 RESUMO DA TRANSFORMAÇÃO

```
ANTES (Projeto Base):
├─ 79 dependências totais
├─ Gestão de projetos/documentos
├─ Drag & drop, PDFs, exportação
└─ PWA, carousels, OTP

DEPOIS (SourceTrace):
├─ 41 dependências (-48%)
├─ Attribution analytics
├─ Tracking, Stripe, charts
└─ Foco simples e clean
```

---

# 🔧 PLANO DE EXECUÇÃO (Passo a Passo)

## FASE 1: BACKUP & SEGURANÇA (5min)

### 1.1 Criar Branch de Backup
```bash
git checkout -b backup-before-cleanup
git add .
git commit -m "Backup antes da limpeza para SourceTrace"
git push origin backup-before-cleanup
```

### 1.2 Criar Branch de Trabalho
```bash
git checkout -b feature/sourcetrace-cleanup
```

---

## FASE 2: LIMPEZA DE DEPENDÊNCIAS (20min)

### 2.1 Remover Dependências Desnecessárias

**Criar arquivo de remoção:**
```bash
# remove-deps.sh
#!/bin/bash

echo "🗑️  Removendo dependências desnecessárias..."

# Drag & Drop
pnpm remove @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Radix UI Extras
pnpm remove @radix-ui/react-accordion \
  @radix-ui/react-alert-dialog \
  @radix-ui/react-aspect-ratio \
  @radix-ui/react-checkbox \
  @radix-ui/react-collapsible \
  @radix-ui/react-context-menu \
  @radix-ui/react-hover-card \
  @radix-ui/react-menubar \
  @radix-ui/react-navigation-menu \
  @radix-ui/react-progress \
  @radix-ui/react-radio-group \
  @radix-ui/react-slider \
  @radix-ui/react-toggle \
  @radix-ui/react-toggle-group

# PDF/Export
pnpm remove html2canvas html2pdf.js jspdf jspdf-autotable turndown

# UI Extras
pnpm remove embla-carousel-react input-otp react-draggable \
  react-resizable-panels vaul cmdk

# Outros
pnpm remove @radix-ui/react-icons radix-ui nanoid \
  react-day-picker vite-plugin-pwa

# DevDeps
pnpm remove -D @types/html2pdf.js @types/turndown

echo "✅ Limpeza concluída!"
```

**Executar:**
```bash
chmod +x remove-deps.sh
./remove-deps.sh
```

### 2.2 Adicionar Dependências SourceTrace

```bash
# Tracking & Analytics
pnpm add ua-parser-js @fingerprintjs/fingerprintjs
pnpm add -D @types/ua-parser-js

# Stripe
pnpm add stripe @stripe/stripe-js

echo "✅ Dependências SourceTrace adicionadas!"
```

### 2.3 Verificar package.json

**Resultado esperado:**
```json
{
  "dependencies": {
    // Core (7)
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.9.4",
    "typescript": "^5.6.3",
    
    // Radix UI Base (12)
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-tooltip": "^1.2.8",
    "@radix-ui/react-tabs": "^1.1.1",
    "@radix-ui/react-switch": "^1.1.1",
    "@radix-ui/react-popover": "^1.1.15",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-scroll-area": "^1.2.10",
    "@radix-ui/react-avatar": "^1.1.11",
    
    // Supabase
    "@supabase/supabase-js": "^2.45.4",
    
    // Utilities (9)
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",
    "framer-motion": "^11.18.2",
    "lucide-react": "^0.454.0",
    "sonner": "^2.0.7",
    "date-fns": "^4.1.0",
    "next-themes": "^0.4.3",
    
    // i18n (3)
    "i18next": "^25.6.0",
    "i18next-browser-languagedetector": "^8.2.0",
    "react-i18next": "^16.2.4",
    
    // Charts
    "recharts": "^2.15.4",
    
    // Forms (2)
    "react-hook-form": "^7.66.0",
    "zod": "^3.23.8",
    
    // 🆕 Tracking & Analytics
    "ua-parser-js": "^1.0.37",
    "@fingerprintjs/fingerprintjs": "^4.4.1",
    
    // 🆕 Stripe
    "stripe": "^14.10.0",
    "@stripe/stripe-js": "^2.4.0"
  }
}
```

---

## FASE 3: ATUALIZAR CONFIGURAÇÕES (15min)

### 3.1 Atualizar vite.config.ts

**Remover PWA plugin:**
```typescript
// vite.config.ts (ANTES)
import { VitePWA } from 'vite-plugin-pwa'  // ❌ Remover

export default defineConfig({
  plugins: [
    react(),
    VitePWA({ ... })  // ❌ Remover toda config PWA
  ]
})

// vite.config.ts (DEPOIS)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
  },
  plugins: [react()],
  server: {
    port: 5173,  // Padrão Vite
  },
  preview: {
    port: 5173,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'supabase': ['@supabase/supabase-js'],
          'charts': ['recharts'],
          'stripe': ['stripe', '@stripe/stripe-js'],
        },
      },
    },
  },
})
```

### 3.2 Atualizar tailwind.config.ts

**Simplificar (remover animações desnecessárias):**
```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        // ✅ Manter as cores do shadcn/ui (já está bom!)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        // ... rest (manter)
        
        // 🆕 Adicionar cores para charts
        chart: {
          1: '#3b82f6',  // blue
          2: '#8b5cf6',  // purple
          3: '#ec4899',  // pink
          4: '#f59e0b',  // amber
          5: '#10b981',  // emerald
          6: '#06b6d4',  // cyan
        }
      },
      fontFamily: {
        sans: ['Inter var', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        // ❌ Remover: shine, shimmer (não usamos)
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        // ❌ Remover: shine, shimmer
      }
    }
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

### 3.3 Atualizar package.json scripts

**Remover scripts desnecessários:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --max-warnings=0",
    "type-check": "tsc --noEmit"
    // ❌ Remover: check-supabase, verify-db, test-insert
  }
}
```

### 3.4 Atualizar .env

**Adicionar variáveis Stripe:**
```bash
# .env
# Supabase (✅ manter)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# 🆕 Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# 🆕 Stripe Price IDs
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_STARTER_YEARLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_BUSINESS_MONTHLY=price_...
STRIPE_PRICE_BUSINESS_YEARLY=price_...
```

---

## FASE 4: LIMPAR ESTRUTURA DE PASTAS (10min)

### 4.1 Manter Estrutura Base Útil

**O que MANTER:**
```
src/
├── components/
│   ├── ui/                  # ✅ shadcn/ui base components
│   └── layout/              # ✅ Sidebar, Header (vamos adaptar)
├── lib/
│   ├── supabase/           # ✅ Supabase client
│   ├── i18n/               # ✅ i18n config
│   └── utils.ts            # ✅ Utilities
├── hooks/
│   ├── useAuth.ts          # ✅ Auth hook
│   └── useTheme.ts         # ✅ Theme hook
└── styles/
    └── index.css           # ✅ Global styles
```

### 4.2 Remover/Limpar (se existirem)

```bash
# Remover pastas de features antigas
rm -rf src/pages  # Se tiver sistema de páginas antigo
rm -rf src/features  # Features antigas
rm -rf src/modules  # Módulos antigos

# Remover scripts desnecessários
rm -rf scripts/check-supabase.js
rm -f verificar-banco-supabase.ts
rm -f testar-insert-convite.ts
```

### 4.3 Criar Estrutura SourceTrace

```bash
# Criar novas pastas
mkdir -p src/app/{dashboard,sources,settings,onboarding}
mkdir -p src/app/api/{stripe,webhooks}
mkdir -p src/components/{dashboard,sources,onboarding,settings}
mkdir -p src/lib/{stripe,analytics}
mkdir -p src/types
mkdir -p public/pixel
```

---

## FASE 5: ATUALIZAR COMPONENTES UI BASE (30min)

### 5.1 Componentes shadcn/ui a Manter

**Verificar quais já existem em `src/components/ui/`:**
```bash
# Listar componentes atuais
ls -la src/components/ui/

# Manter estes (se existirem):
# ✅ button.tsx
# ✅ card.tsx
# ✅ input.tsx
# ✅ label.tsx
# ✅ dialog.tsx
# ✅ dropdown-menu.tsx
# ✅ select.tsx
# ✅ tooltip.tsx
# ✅ tabs.tsx
# ✅ switch.tsx
# ✅ popover.tsx
# ✅ separator.tsx
# ✅ scroll-area.tsx
# ✅ avatar.tsx
```

### 5.2 Adicionar Componentes Necessários (se faltarem)

```bash
# Se não existir, adicionar:
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add select
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add table
```

### 5.3 Criar Componente CodeBlock (para setup instructions)

```typescript
// src/components/ui/code-block.tsx
import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface CodeBlockProps {
  code: string
  language?: string
  className?: string
}

export function CodeBlock({ code, language = 'typescript', className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('relative', className)}>
      <pre className="bg-neutral-900 text-neutral-100 p-4 rounded-lg overflow-x-auto">
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-2 right-2"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
```

---

## FASE 6: VERIFICAÇÃO FINAL (10min)

### 6.1 Testar Build

```bash
pnpm build
# Deve compilar sem erros
```

### 6.2 Testar Dev Server

```bash
pnpm dev
# Deve iniciar sem erros em http://localhost:5173
```

### 6.3 Verificar Tamanho do Bundle

```bash
# Após build:
du -sh dist/
# Deve ser ~500KB-1MB (muito menor que antes!)
```

### 6.4 Checar Imports Quebrados

```bash
# Buscar imports de pacotes removidos
grep -r "@dnd-kit" src/
grep -r "html2canvas" src/
grep -r "jspdf" src/
# Não deve encontrar nada ✅
```

---

## FASE 7: COMMIT & MERGE (5min)

```bash
# Commit
git add .
git commit -m "feat: limpar projeto base e preparar para SourceTrace

- Remover 42 dependências desnecessárias
- Adicionar deps SourceTrace (tracking, Stripe)
- Simplificar config (remover PWA)
- Criar estrutura de pastas SourceTrace
- Build size reduzido 48%"

# Merge para main
git checkout main
git merge feature/sourcetrace-cleanup

# Push
git push origin main
```

---

# ✅ CHECKLIST FINAL

## Dependências
- [ ] 42 pacotes removidos
- [ ] 4 pacotes SourceTrace adicionados
- [ ] `pnpm install` roda sem erros
- [ ] Total de deps: ~41 (antes: 79)

## Configurações
- [ ] `vite.config.ts` sem PWA
- [ ] `tailwind.config.ts` com cores chart
- [ ] `.env` com variáveis Stripe
- [ ] `package.json` scripts limpos

## Estrutura
- [ ] Pastas antigas removidas
- [ ] Estrutura SourceTrace criada
- [ ] Componentes UI base mantidos
- [ ] CodeBlock component adicionado

## Build
- [ ] `pnpm build` funciona
- [ ] `pnpm dev` funciona
- [ ] Bundle size reduzido
- [ ] Sem imports quebrados

## Git
- [ ] Branch backup criada
- [ ] Mudanças commitadas
- [ ] Merged para main
- [ ] Pushed para remote

---

# 📊 ANTES vs DEPOIS

```
┌─────────────────────────────────────────────────────────────┐
│                    TRANSFORMAÇÃO                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ANTES (Projeto Base)                                        │
│ ├─ 79 dependências                                          │
│ ├─ ~1.5MB bundle                                            │
│ ├─ Gestão de projetos/docs                                  │
│ ├─ Drag & drop, PDFs, PWA                                   │
│ └─ Múltiplas features complexas                             │
│                                                             │
│ DEPOIS (SourceTrace Ready)                                  │
│ ├─ 41 dependências (-48%)                                   │
│ ├─ ~800KB bundle (-46%)                                     │
│ ├─ Attribution analytics                                    │
│ ├─ Tracking, Stripe, Charts                                 │
│ └─ Foco simples e clean                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

# 🎯 PRÓXIMOS PASSOS

Após concluir este PRD de limpeza:

1. ✅ **Executar SQL do SourceTrace** no Supabase
2. ✅ **Implementar Pixel Tracking** (pixel.js)
3. ✅ **Criar Edge Functions** (track-event)
4. ✅ **Implementar Dashboard** (telas)
5. ✅ **Integrar Stripe** (checkout + webhooks)
6. ✅ **Adicionar i18n** (traduções completas)
7. ✅ **Deploy production**

---

**Tempo estimado total:** ~90 minutos
**Redução de complexidade:** ~48%
**Projeto pronto para:** SourceTrace implementation

---

# 📝 NOTAS IMPORTANTES

## ⚠️ Atenção

1. **Backup primeiro!** Sempre criar branch de backup antes de remover
2. **Testar após cada fase** para detectar problemas cedo
3. **Manter .git** intacto durante limpeza
4. **Não remover** node_modules manualmente (pnpm cuida)

## 💡 Dicas

- Se algum import quebrar, use busca global: `grep -r "PackageName" src/`
- Bundle analyzer: `pnpm add -D rollup-plugin-visualizer` (opcional)
- Sempre testar `pnpm build` antes de commit

---

**Status:** ✅ Pronto para execução
**Próximo:** Implementar PRD Master SourceTrace
**Versão:** 1.0 Final
