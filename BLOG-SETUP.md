# Setup do Blog - Passo a Passo

## ⚠️ Importante: Execute estes passos antes de usar a página de criar posts

### 1️⃣ Executar o Schema SQL no Supabase

1. Acesse: https://supabase.com/dashboard/project/gyqohtqfyzzifxjkuuiz
2. Vá em **SQL Editor** (menu lateral esquerdo)
3. Clique em **New Query**
4. Copie e cole o conteúdo do arquivo: `C:\Revenify.co\lp.revenify.co\revenify-landing\docs\supabase\schema.sql`
5. Clique em **Run** (ou pressione Ctrl+Enter)

Isso criará:
- ✅ Tabela `blog_categories` com 4 categorias padrão
- ✅ Tabela `blog_posts`
- ✅ Triggers automáticos (reading time, updated_at)
- ✅ Políticas de segurança (RLS)
- ✅ 2 posts de exemplo

### 2️⃣ Criar o Bucket de Imagens

1. No Supabase, vá em **Storage** (menu lateral)
2. Clique em **Create a new bucket**
3. Preencha:
   - **Name**: `blog-images`
   - **Public bucket**: ✅ Marque como **Public**
   - **File size limit**: 50 MB (padrão está ok)
4. Clique em **Create bucket**

### 3️⃣ Configurar Políticas do Storage (Importante!)

1. Ainda em **Storage**, clique no bucket `blog-images`
2. Vá na aba **Policies**
3. Clique em **New Policy**

**Policy 1: Public Access (Read)**
```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images');
```

**Policy 2: Authenticated Upload**
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'blog-images' AND auth.role() = 'authenticated');
```

**Policy 3: Authenticated Delete** (opcional)
```sql
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'blog-images' AND auth.role() = 'authenticated');
```

### 4️⃣ Atualizar .env do Aplicativo

Edite o arquivo: `C:\Revenify.co\app.revenify.co\.env`

```env
VITE_SUPABASE_URL=https://gyqohtqfyzzifxjkuuiz.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

Para pegar a chave:
1. Supabase Dashboard → **Settings** → **API**
2. Copie a **anon public** key

### 5️⃣ Reiniciar o Servidor

```bash
# Parar o servidor (Ctrl+C no terminal)
# Iniciar novamente
cd C:\Revenify.co\app.revenify.co
npm run dev
```

---

## ✅ Checklist de Verificação

Antes de usar a página de criar posts, verifique:

- [ ] SQL executado sem erros
- [ ] Bucket `blog-images` criado e **público**
- [ ] Políticas de storage configuradas
- [ ] `.env` com credenciais corretas
- [ ] Servidor reiniciado

---

## 🧪 Testar se Funcionou

1. Faça login no app: http://localhost:5173
2. Clique no avatar → **Create Blog Post**
3. A página deve carregar **sem erros 404**
4. O dropdown "Category" deve ter 4 opções:
   - Company News
   - Education
   - Customer Stories
   - Engineering

Se aparecer erro "Failed to load categories" → SQL não foi executado
Se aparecer erro "Bucket not found" → Bucket não foi criado

---

## 📝 Estrutura das Tabelas

### blog_categories
```
id              UUID (PK)
name            TEXT (ex: "Company News")
slug            TEXT (ex: "company-news")
description     TEXT (nullable)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### blog_posts
```
id              UUID (PK)
title           TEXT
slug            TEXT (unique, ex: "my-post")
excerpt         TEXT
content         TEXT (markdown)
cover_image     TEXT (URL nullable)
author_name     TEXT
author_avatar   TEXT (URL nullable)
category_id     UUID (FK → blog_categories)
status          TEXT ("draft" | "published")
published_at    TIMESTAMP (nullable)
reading_time    INTEGER (auto-calculated)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

---

## 🔧 Troubleshooting

### Erro: "Failed to load categories"
**Solução**: Execute o schema.sql no SQL Editor

### Erro: "Bucket not found"
**Solução**: Crie o bucket `blog-images` no Storage e marque como público

### Erro: "Row level security policy violation"
**Solução**: Verifique se as políticas RLS foram criadas (estão no schema.sql)

### Imagem não carrega após upload
**Solução**: Verifique se o bucket está marcado como **Public**

### Posts não aparecem no site (lp.revenify.co)
**Solução**: Configure também o .env do landing page com as mesmas credenciais

---

## 🎯 Próximos Passos

Após configurar tudo:

1. ✅ Teste criar um post de exemplo
2. ✅ Verifique se aparece no site (http://localhost:3006/blog)
3. ✅ Configure permissões de admin (futuro)

---

**Arquivos Importantes:**

- Schema SQL: `C:\Revenify.co\lp.revenify.co\revenify-landing\docs\supabase\schema.sql`
- Guia CMS: `C:\Revenify.co\lp.revenify.co\revenify-landing\BLOG-CMS-GUIDE.md`
- Página de Criar: `C:\Revenify.co\app.revenify.co\src\pages\blog-create.tsx`
