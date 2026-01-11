# PRD: Melhorias no QR Code Dialog

## Status: ✅ IMPLEMENTADO

---

## 1. Problemas Identificados pelo Usuário

### ❌ Tabs
- **Problema**: Tabs têm borda azul (primary) quando ativo
- **Correção**: Usar borda preta (light mode) ou branca (dark mode)

### ❌ Botões PNG/JPG/SVG
- **Problema**: Botões grandes com cores/gradientes (não minimalista)
- **Correção**: Botões pequenos, simples, sem cores

### ❌ Color Pickers
- **Problema**: Muito grandes (h-12) e ocupam muito espaço
- **Correção**: Menores e mais modernos

### ❌ Cores Rápidas
- **Problema**: Mostra nomes dos presets (desnecessário)
- **Correção**: Apenas bolinhas de cor, sem texto

### ❌ Bug ao trocar aba
- **Problema**: Ao mudar para aba Logo, layout fica bugado/puxando
- **Correção**: Investigar e corrigir

---

## 2. Mudanças Propostas

### 2.1 Tabs (Prioridade: ALTA)

**ANTES:**
```tsx
className="data-[state=active]:border-b-primary"  // Azul
```

**DEPOIS:**
```tsx
className="data-[state=active]:border-b-black dark:data-[state=active]:border-b-white"
// Preto no light mode, branco no dark mode
```

**Também:**
- Reduzir `border-b-[3px]` para `border-b-2`
- Reduzir `mb-6` para `mb-4`
- Remover `font-medium` (deixar só `text-sm`)

---

### 2.2 Botões PNG/JPG/SVG (Prioridade: ALTA)

**ANTES:**
- Grid 3 colunas
- p-4, rounded-xl
- Gradientes coloridos
- Ícones grandes (h-5 w-5)
- Border colorido por formato
- Selected indicator (ponto)

**DEPOIS - MINIMALISTA:**
```tsx
<div className="flex gap-2">
  {[
    { value: 'png', label: 'PNG' },
    { value: 'jpg', label: 'JPG' },
    { value: 'svg', label: 'SVG', disabled: !!logoUrl },
  ].map((format) => (
    <button
      className={cn(
        'flex-1 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors',
        downloadFormat === format.value
          ? 'border-foreground bg-foreground text-background'
          : 'border-border hover:bg-muted',
        format.disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      {format.label}
    </button>
  ))}
</div>
```

**Características:**
- ✅ Pequenos (py-1.5, text-xs)
- ✅ Sem cores/gradientes
- ✅ Sem ícones
- ✅ Minimalista
- ✅ Apenas texto

---

### 2.3 Color Pickers (Prioridade: MÉDIA)

**ANTES:**
- Grid 2 colunas
- h-12 (muito grande)
- border-2

**DEPOIS:**
```tsx
<div className="flex gap-2">
  <div className="flex-1">
    <Input type="color" className="w-full h-9 p-1 cursor-pointer" />
    <p className="text-[10px] text-muted-foreground text-center mt-1">
      {t('qrCode.qrColor')}
    </p>
  </div>
  <div className="flex-1">
    <Input type="color" className="w-full h-9 p-1 cursor-pointer" />
    <p className="text-[10px] text-muted-foreground text-center mt-1">
      {t('qrCode.bgColor')}
    </p>
  </div>
</div>
```

**Mudanças:**
- ✅ h-12 → h-9
- ✅ Remover border-2 extra
- ✅ Voltar para layout flex simples

---

### 2.4 Cores Rápidas (Prioridade: MÉDIA)

**ANTES:**
- Grid 2x3
- Mostra nomes ("Clássico", "Dark", etc.)
- px-3 py-2 com texto

**DEPOIS - SÓ BOLINHAS:**
```tsx
<div className="flex gap-2 flex-wrap">
  {[
    { qr: '#000000', bg: '#ffffff' },
    { qr: '#1a1a2e', bg: '#eaeaea' },
    { qr: '#0066cc', bg: '#ffffff' },
    { qr: '#059669', bg: '#ffffff' },
    { qr: '#7c3aed', bg: '#ffffff' },
    { qr: '#dc2626', bg: '#ffffff' },
  ].map((preset, i) => (
    <button
      className={cn(
        'w-8 h-8 rounded-full border-2 transition-all',
        color === preset.qr && bgColor === preset.bg
          ? 'border-foreground scale-110'
          : 'border-border hover:scale-105'
      )}
      style={{ backgroundColor: preset.qr }}
    />
  ))}
</div>
```

**Características:**
- ✅ Apenas bolinhas (w-8 h-8)
- ✅ SEM nomes/texto
- ✅ Scale animation quando ativo

---

### 2.5 Bug ao trocar aba Logo (Prioridade: BAIXA)

**Investigar:**
- Por que ao trocar para aba Logo o layout "puxa"?
- Possível causa: height diferente entre abas
- Solução: Garantir que ambas as tabs tenham min-height consistente

---

## 3. O Que NÃO Mudar

### ✅ Manter como está:
1. **Botão Download** - Fica onde está (desktop na coluna esquerda, mobile no final)
2. **Select de tamanho do QR** - NÃO remover (é útil!)
3. **Dialog size** - 700px está OK
4. **Layout 2 colunas** - QR esquerda, opções direita (bom!)
5. **Logo upload** - Funcionalidade intacta

---

## 4. Resumo Visual

### ANTES vs DEPOIS

#### Tabs:
- ❌ `border-b-primary` (azul)
- ✅ `border-b-black dark:border-b-white` (preto/branco)

#### Botões Formato:
- ❌ Grande, colorido, com ícones
- ✅ Pequeno, minimalista, só texto

#### Color Pickers:
- ❌ h-12 (muito grande)
- ✅ h-9 (compacto)

#### Preset Colors:
- ❌ Com nomes "Clássico", "Dark"
- ✅ Apenas bolinhas coloridas

---

## 5. Checklist de Implementação

- [x] Tabs: trocar primary por black/white
- [x] Botões PNG/JPG/SVG: simplicar (pequenos, sem cor)
- [x] Color pickers: reduzir h-12 → h-9
- [x] Preset colors: remover nomes, deixar só bolinhas
- [x] Investigar/corrigir bug ao trocar aba (adicionado min-h-[280px] em ambas as tabs)
- [x] Build e testar (build passou sem erros)
- [ ] Commit com mensagem clara

---

## 6. Tempo Estimado

- Implementação: 20-30 minutos
- Testes: 10 minutos
- **Total**: ~40 minutos

---

## 7. Riscos

✅ **MUITO BAIXO**
- Mudanças apenas visuais
- Não afeta funcionalidade
- Fácil de reverter se necessário

---

## ❓ Aguardando Aprovação

**Por favor, revise este PRD e confirme se:**
1. As mudanças propostas estão corretas?
2. Tem algo mais que eu não entendi?
3. Posso prosseguir com a implementação?

---

**Criado em:** 2026-01-09
**Status:** 🟡 Aguardando aprovação do usuário
