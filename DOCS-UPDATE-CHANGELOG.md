# Revenify - Changelog de Atualizações para Documentação

**Data:** 05/01/2026  
**Versão:** 2.0.0

---

## ⚠️ IMPORTANTE: Stripe Connect NÃO é utilizado

O Revenify **NÃO utiliza Stripe Connect**. A integração de pagamentos é feita diretamente via Stripe Checkout para assinaturas dos planos.

Se a documentação menciona Stripe Connect, essa informação está **desatualizada** e deve ser removida.

---

## 🔗 Short Links - Configuração de Domínio Customizado

### Como funciona o redirecionamento

Os short links do Revenify utilizam uma **Edge Function do Supabase** para redirecionamento:

```
https://gyqohtqfyzzifxjkuuiz.supabase.co/functions/v1/redirect-short-link?code={CODIGO}
```

### Domínio padrão: revenify.co

O domínio `revenify.co` está configurado com um **Cloudflare Worker** que redireciona para a Edge Function.

### Domínios customizados (Planos Pro e Business)

Para usar um domínio customizado, o usuário precisa:

1. **Opção Cloudflare (Recomendado)**:
   - Criar um Cloudflare Worker no seu domínio
   - O Worker deve redirecionar `/{code}` para a Edge Function do Supabase
   - Exemplo de código do Worker:
   ```javascript
   export default {
     async fetch(request) {
       const url = new URL(request.url);
       const path = url.pathname;
       
       if (path.length > 1) {
         const code = path.slice(1);
         const targetUrl = `https://gyqohtqfyzzifxjkuuiz.supabase.co/functions/v1/redirect-short-link?code=${code}`;
         return fetch(targetUrl, {
           method: request.method,
           headers: request.headers,
         });
       }
       
       return new Response('Not Found', { status: 404 });
     }
   };
   ```

2. **Opção CNAME**:
   - Criar registro CNAME apontando para `gyqohtqfyzzifxjkuuiz.supabase.co`
   - **Nota**: Esta opção pode não funcionar em todos os casos devido a limitações de SSL/TLS

---

## 🤖 Assistente de IA

### Funcionalidades

- Chat integrado no dashboard
- Acesso ao contexto do projeto (métricas, leads, fontes, etc.)
- Respostas baseadas nos dados reais do usuário

### Limitações por plano

| Plano | Mensagens/mês |
|-------|---------------|
| Free | 10 |
| Starter | 50 |
| Pro | 200 |
| Business | 1000 |

### Restrição atual

O assistente de IA está disponível apenas para contas autorizadas até que o Stripe esteja totalmente configurado.

---

## 📋 Templates UTM

### CRUD completo implementado

- **Criar**: Novo template com nome, descrição e parâmetros UTM
- **Editar**: Modificar templates existentes
- **Deletar**: Remover templates
- **Copiar URL**: Gerar e copiar URL com UTMs aplicados

### Campos disponíveis

- `utm_source` (obrigatório)
- `utm_medium` (obrigatório)
- `utm_campaign` (opcional)
- `utm_term` (opcional)
- `utm_content` (opcional)

---

## 🔒 Segurança

### Variáveis de ambiente

As credenciais do Supabase agora são carregadas via variáveis de ambiente:

```env
VITE_SUPABASE_URL=https://gyqohtqfyzzifxjkuuiz.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
VITE_SUPABASE_PROJECT_ID=gyqohtqfyzzifxjkuuiz
```

### Sanitização HTML

Conteúdo HTML (como posts de blog) é sanitizado antes de ser renderizado para prevenir ataques XSS.

### Senhas de Short Links

**ALERTA**: As senhas de short links atualmente são armazenadas em texto plano. Uma implementação futura deve usar bcrypt para hash das senhas.

---

## 📱 Melhorias de UI/UX

### Mobile

- Tooltips agora funcionam com tap (toque para abrir, toque para fechar)
- Botões de exportar convertidos para ícones com tooltip
- Cards e inputs ajustados para não causar scroll horizontal

### Desktop

- Select/Switcher arrows não saem mais da caixa
- QR Code Dialog com layout lado a lado (QR + formulário)
- Página de domínio customizado com layout mais compacto

### Geral

- Páginas de Settings não travam mais
- Skeletons de loading melhorados
- Traduções corrigidas

---

## 🗂️ Estrutura de Tipos

### Tipos unificados

Os tipos de Subscription foram unificados em `src/types/subscription.ts`:

```typescript
export interface Subscription {
  id: string
  user_id: string
  plan: 'free' | 'starter' | 'pro' | 'business'
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  // ... outros campos
}
```

---

## 📝 Notas para atualização da documentação

1. **Remover** qualquer menção a Stripe Connect
2. **Adicionar** seção sobre configuração de domínio customizado com Cloudflare Worker
3. **Atualizar** limites de mensagens de IA por plano
4. **Adicionar** documentação sobre Templates UTM
5. **Atualizar** requisitos de variáveis de ambiente
6. **Adicionar** aviso sobre senhas de short links (texto plano)

---

## 🔗 Links úteis

- **App**: https://app.revenify.co
- **Documentação**: https://www.revenify.co/docs
- **Supabase Dashboard**: https://supabase.com/dashboard/project/gyqohtqfyzzifxjkuuiz
