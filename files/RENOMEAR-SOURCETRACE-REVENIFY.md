# 🔄 RENOMEAR SOURCETRACE → REVENIFY
## Script Completo Para Atualizar Todos PRDs e Código

---

# ⚡ SOLUÇÃO RÁPIDA (RECOMENDADO)

## Usar Find & Replace Global no VS Code:

```
1. Abrir pasta do projeto no VS Code
2. Pressionar: Ctrl+Shift+H (Windows/Linux) ou Cmd+Shift+H (Mac)
3. Find: SourceTrace
4. Replace: Revenify
5. Click "Replace All"

Repetir para variações:
- sourcetrace → revenify
- sourceTrace → revenify
- source-trace → revenify
- SOURCETRACE → REVENIFY
```

---

# 🔍 MAPEAMENTO DE MUDANÇAS

## Nomes para Substituir:

```
ANTES              →  DEPOIS
─────────────────────────────────────
SourceTrace        →  Revenify
sourcetrace        →  revenify
sourceTrace        →  revenify
source-trace       →  revenify
SOURCETRACE        →  REVENIFY
st_                →  rv_  (prefixos)
_st_               →  _rv_ (cookies/params)
```

---

# 📝 ARQUIVOS AFETADOS

## PRDs (Markdown):
```
✅ PRD-MASTER-PARTE-1.md
✅ PRD-MASTER-PARTE-2.md
✅ PRD-MASTER-PARTE-3.md
✅ PRD-MASTER-PARTE-4.md
✅ PRD-MASTER-PARTE-5-FINAL.md
✅ PRD-LIMPEZA-PREPARACAO.md
```

## Código (TypeScript/JavaScript):
```
✅ src/lib/supabase/queries.ts
✅ src/hooks/use-project.ts
✅ src/hooks/use-subscription.ts
✅ src/components/**/*.tsx
✅ public/pixel/pixel.js
✅ supabase/functions/track-event/index.ts
✅ supabase/migrations/*.sql
```

## Configs:
```
✅ package.json (name: "sourcetrace" → "revenify")
✅ .env (VITE_APP_NAME)
✅ README.md
```

---

# 🔧 SCRIPT BASH AUTOMÁTICO

## Para Linux/Mac:

```bash
#!/bin/bash
# renomear-para-revenify.sh

# Função para substituir em arquivos
renomear() {
  local de=$1
  local para=$2
  
  echo "Substituindo $de → $para..."
  
  # Buscar e substituir em todos arquivos
  find . -type f \( -name "*.md" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.json" -o -name "*.sql" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/.next/*" \
    -not -path "*/dist/*" \
    -exec sed -i "s/$de/$para/g" {} +
}

# Fazer backup primeiro
echo "Criando backup..."
tar -czf backup-before-rename-$(date +%Y%m%d-%H%M%S).tar.gz . \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=dist \
  --exclude=.git

# Executar substituições
renomear "SourceTrace" "Revenify"
renomear "sourcetrace" "revenify"
renomear "sourceTrace" "revenify"
renomear "source-trace" "revenify"
renomear "SOURCETRACE" "REVENIFY"
renomear "st_sid" "rv_sid"
renomear "_st_" "_rv_"

echo "✅ Renomeação concluída!"
echo "Backup salvo em: backup-before-rename-*.tar.gz"
```

## Para executar:
```bash
chmod +x renomear-para-revenify.sh
./renomear-para-revenify.sh
```

---

# 🪟 SCRIPT POWERSHELL (Windows)

```powershell
# renomear-para-revenify.ps1

# Criar backup
$backupName = "backup-before-rename-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"
Compress-Archive -Path . -DestinationPath $backupName -Force

Write-Host "Backup criado: $backupName"

# Função de substituição
function Replace-In-Files {
    param($de, $para)
    
    Write-Host "Substituindo $de → $para..."
    
    Get-ChildItem -Recurse -Include *.md,*.ts,*.tsx,*.js,*.json,*.sql |
        Where-Object { $_.FullName -notmatch 'node_modules|\.next|dist|\.git' } |
        ForEach-Object {
            $content = Get-Content $_.FullName -Raw
            $newContent = $content -replace $de, $para
            if ($content -ne $newContent) {
                Set-Content $_.FullName -Value $newContent -NoNewline
                Write-Host "  ✓ $_"
            }
        }
}

# Executar substituições
Replace-In-Files "SourceTrace" "Revenify"
Replace-In-Files "sourcetrace" "revenify"
Replace-In-Files "sourceTrace" "revenify"
Replace-In-Files "source-trace" "revenify"
Replace-In-Files "SOURCETRACE" "REVENIFY"
Replace-In-Files "st_sid" "rv_sid"
Replace-In-Files "_st_" "_rv_"

Write-Host "✅ Renomeação concluída!"
```

## Para executar:
```powershell
powershell -ExecutionPolicy Bypass -File renomear-para-revenify.ps1
```

---

# 📋 MANUAL CHECKLIST

Se preferir fazer manualmente:

## 1. PRDs (Markdown files):
```
[ ] Abrir cada PRD-*.md
[ ] Ctrl+H (Find & Replace)
[ ] SourceTrace → Revenify
[ ] sourcetrace → revenify
[ ] Salvar
```

## 2. Package.json:
```json
// ANTES:
{
  "name": "sourcetrace",
  "version": "1.0.0"
}

// DEPOIS:
{
  "name": "revenify",
  "version": "1.0.0"
}
```

## 3. Pixel JavaScript:
```javascript
// public/pixel/pixel.js

// ANTES:
window.sourcetrace = {
  projectKey: config.projectKey,
  // ...
}

// DEPOIS:
window.revenify = {
  projectKey: config.projectKey,
  // ...
}
```

## 4. Cookie Names:
```javascript
// ANTES:
const COOKIE_NAME = '_st_sid';

// DEPOIS:
const COOKIE_NAME = '_rv_sid';
```

## 5. Database Queries:
```typescript
// src/lib/supabase/queries.ts

// Nenhuma mudança necessária!
// (Tabelas/schemas não mudam, só o nome do app)
```

## 6. Components:
```typescript
// Procurar por qualquer referência a "SourceTrace"
// em comentários, tipos, etc.

// ANTES:
// SourceTrace analytics platform
interface SourceTraceConfig { }

// DEPOIS:
// Revenify analytics platform
interface RevenifyConfig { }
```

## 7. Environment Variables:
```bash
# .env

# ANTES:
VITE_APP_NAME=SourceTrace

# DEPOIS:
VITE_APP_NAME=Revenify
```

## 8. README.md:
```markdown
# ANTES:
# SourceTrace
Revenue attribution analytics

# DEPOIS:
# Revenify
Revenue attribution analytics
```

## 9. Supabase Functions:
```typescript
// supabase/functions/track-event/index.ts

// Verificar comentários e logs:

// ANTES:
console.log('[SourceTrace] Event tracked');

// DEPOIS:
console.log('[Revenify] Event tracked');
```

## 10. SQL Migrations:
```sql
-- Comentários SQL podem ter o nome

-- ANTES:
-- SourceTrace: Create events table

-- DEPOIS:
-- Revenify: Create events table
```

---

# ✅ VALIDAÇÃO

## Após substituir, verificar:

```bash
# Buscar referências restantes
grep -r "SourceTrace" . --exclude-dir={node_modules,.next,dist,.git}
grep -r "sourcetrace" . --exclude-dir={node_modules,.next,dist,.git}
grep -r "source-trace" . --exclude-dir={node_modules,.next,dist,.git}

# Se retornar vazio = sucesso! ✅
```

---

# 🎯 PONTOS CRÍTICOS

## NÃO MUDAR:

```
❌ URLs de API externas (Stripe, etc)
❌ Nomes de tabelas no banco de dados
❌ IDs de terceiros
❌ Chaves de API
❌ node_modules/
```

## MUDAR:

```
✅ Nome do app em package.json
✅ Variáveis de ambiente
✅ Comentários em código
✅ Documentação (PRDs, README)
✅ Nome do pixel (window.sourcetrace → window.revenify)
✅ Cookies (_st_sid → _rv_sid)
✅ Tipos/Interfaces TypeScript
✅ Logs e mensagens
```

---

# 🔄 DEPOIS DA RENOMEAÇÃO

## 1. Reinstalar dependências:
```bash
rm -rf node_modules package-lock.json
npm install
```

## 2. Rebuild:
```bash
npm run build
```

## 3. Testar:
```bash
npm run dev

# Verificar:
- [ ] App abre sem erros
- [ ] Console sem warnings de "SourceTrace"
- [ ] Pixel carrega (window.revenify existe)
- [ ] Database queries funcionam
```

## 4. Commit:
```bash
git add .
git commit -m "Renomear SourceTrace para Revenify"
git push
```

---

# 📊 IMPACTO

## Quebra algo?

**NÃO!** Porque:
- ✅ Nome é apenas branding
- ✅ Database schema não muda
- ✅ API endpoints não mudam
- ✅ Lógica de código não muda

## O que muda?

Apenas:
- ✅ Displays/UI (nome visual)
- ✅ package.json name
- ✅ window.revenify (API pública)
- ✅ Cookies (_rv_sid)
- ✅ Documentação

---

# 🎉 RESULTADO FINAL

Depois da renomeação:

```
✅ Todos PRDs dizem "Revenify"
✅ Package.json: "revenify"
✅ Pixel API: window.revenify
✅ Cookies: _rv_sid
✅ README atualizado
✅ Comentários atualizados
✅ Tipos TypeScript atualizados
✅ Sem referências antigas

❌ ZERO código quebrado
❌ ZERO funcionalidade perdida
```

---

# 🚀 PRÓXIMOS PASSOS

Após renomear:

1. **Atualizar domínio**:
   ```bash
   # .env
   VITE_API_URL=https://revenify.co
   ```

2. **Atualizar analytics**:
   ```javascript
   // Trocar tracking
   analytics.track('revenify_event');
   ```

3. **Atualizar docs externas**:
   - Blog posts
   - Documentação
   - API docs

4. **Comunicar time** (se aplicável):
   - "Mudamos de SourceTrace para Revenify"
   - Atualizar repositórios
   - Atualizar comunicações

---

**RECOMENDAÇÃO:**

Use o **VS Code Find & Replace** global (Ctrl+Shift+H).
É o método mais rápido e seguro! ✅

Total: ~5 minutos para renomear tudo! 🚀
