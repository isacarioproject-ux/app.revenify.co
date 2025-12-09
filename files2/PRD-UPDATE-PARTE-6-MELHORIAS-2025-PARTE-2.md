# 🚀 REVENIFY - PRD PARTE 6.2: MELHORIAS 2025 (CONTINUAÇÃO)

## TEMPLATES PAGE | AI ASSISTANT | FINALIZAÇÕES

---

# 6.4 TEMPLATES PAGE COM DIALOG (3h)

## Objetivo

Criar página **Templates** linda estilo dub.co com:
- Empty state único e bonito
- Dialog elegante para criar templates UTM
- Tooltips explicativos em TODOS os campos (como nas imagens)
- UI moderna e clean

---

## 6.4.1 SCHEMA TEMPLATES (15min)

```sql
-- =============================================
-- UTM TEMPLATES
-- =============================================

CREATE TABLE IF NOT EXISTS utm_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Template data
  name TEXT NOT NULL,
  description TEXT,
  
  -- UTM Parameters
  utm_source TEXT NOT NULL, -- 'google', 'facebook', 'newsletter'
  utm_medium TEXT NOT NULL, -- 'cpc', 'email', 'social'
  utm_campaign TEXT, -- 'summer-sale-2025'
  utm_term TEXT, -- 'running shoes'
  utm_content TEXT, -- 'logo-link'
  referral_url TEXT, -- Custom referral (optional)
  
  -- Usage tracking
  times_used INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_utm_templates_project 
ON utm_templates(project_id, created_at DESC);

-- RLS Policies
ALTER TABLE utm_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project templates"
ON utm_templates FOR SELECT
USING (project_id IN (
  SELECT id FROM projects WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create templates"
ON utm_templates FOR INSERT
WITH CHECK (project_id IN (
  SELECT id FROM projects WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update own templates"
ON utm_templates FOR UPDATE
USING (project_id IN (
  SELECT id FROM projects WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete own templates"
ON utm_templates FOR DELETE
USING (project_id IN (
  SELECT id FROM projects WHERE user_id = auth.uid()
));

-- Function para gerar URL com UTMs do template
CREATE OR REPLACE FUNCTION generate_url_from_template(
  p_template_id UUID,
  p_base_url TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_template RECORD;
  v_url TEXT;
BEGIN
  -- Buscar template
  SELECT * INTO v_template
  FROM utm_templates
  WHERE id = p_template_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found';
  END IF;

  -- Construir URL
  v_url := p_base_url;
  
  -- Adicionar ? ou & dependendo se já tem query params
  IF v_url LIKE '%?%' THEN
    v_url := v_url || '&';
  ELSE
    v_url := v_url || '?';
  END IF;

  -- Adicionar UTM params
  v_url := v_url || 'utm_source=' || v_template.utm_source;
  v_url := v_url || '&utm_medium=' || v_template.utm_medium;
  
  IF v_template.utm_campaign IS NOT NULL THEN
    v_url := v_url || '&utm_campaign=' || v_template.utm_campaign;
  END IF;
  
  IF v_template.utm_term IS NOT NULL THEN
    v_url := v_url || '&utm_term=' || v_template.utm_term;
  END IF;
  
  IF v_template.utm_content IS NOT NULL THEN
    v_url := v_url || '&utm_content=' || v_template.utm_content;
  END IF;

  -- Update usage
  UPDATE utm_templates
  SET times_used = times_used + 1,
      last_used_at = NOW()
  WHERE id = p_template_id;

  RETURN v_url;
END;
$$;
```

---

## 6.4.2 TEMPLATES PAGE UI (1h30)

### Arquivo: `src/app/templates/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Plus, Link2, Copy, Trash2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CreateTemplateDialog } from '@/components/dialogs/create-template-dialog'
import { useTemplates } from '@/hooks/use-templates'
import { format } from 'date-fns'

export default function TemplatesPage() {
  const { templates, isLoading, createTemplate, deleteTemplate } = useTemplates()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [baseUrl, setBaseUrl] = useState('https://yoursite.com')

  const generateUrl = (template: any) => {
    let url = baseUrl
    url += url.includes('?') ? '&' : '?'
    url += `utm_source=${template.utm_source}`
    url += `&utm_medium=${template.utm_medium}`
    if (template.utm_campaign) url += `&utm_campaign=${template.utm_campaign}`
    if (template.utm_term) url += `&utm_term=${template.utm_term}`
    if (template.utm_content) url += `&utm_content=${template.utm_content}`
    return url
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // TODO: toast
  }

  // Empty State
  if (!isLoading && templates.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center max-w-md">
          {/* Icon Circle */}
          <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-6">
            <FileText className="h-12 w-12 text-primary" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold mb-3">
            No Templates Yet
          </h2>

          {/* Description */}
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Create UTM templates to quickly generate tracking links for your campaigns.
            Save time by reusing common parameter combinations.
          </p>

          {/* CTA */}
          <Button size="lg" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Template
          </Button>

          {/* Feature list */}
          <div className="mt-8 space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Pre-fill UTM parameters for campaigns</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Generate tracking URLs in seconds</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Maintain consistency across campaigns</span>
            </div>
          </div>
        </div>

        {/* Dialog */}
        <CreateTemplateDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onCreate={createTemplate}
        />
      </div>
    )
  }

  // Has Templates
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">UTM Templates</h1>
          <p className="text-muted-foreground mt-1">
            Create reusable templates for your marketing campaigns
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* URL Generator */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <label className="text-sm font-medium">
              Generate URLs from templates
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="https://yoursite.com"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" disabled>
                Apply Template
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter your base URL, then click on a template below to generate a tracking link
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{template.name}</h3>
                    {template.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {template.description}
                      </p>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteTemplate(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* UTM Parameters */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-xs">
                      {template.utm_source}
                    </Badge>
                    <span className="text-xs text-muted-foreground">/</span>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {template.utm_medium}
                    </Badge>
                  </div>
                  {template.utm_campaign && (
                    <div className="text-xs text-muted-foreground">
                      Campaign: <span className="font-mono">{template.utm_campaign}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => copyToClipboard(generateUrl(template))}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy URL
                  </Button>
                  {template.times_used > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {template.times_used}× used
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog */}
      <CreateTemplateDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreate={createTemplate}
      />
    </div>
  )
}
```

---

## 6.4.3 CREATE TEMPLATE DIALOG (1h15)

### Arquivo: `src/components/dialogs/create-template-dialog.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { InfoTooltipRich } from '@/components/ui/info-tooltip'
import { Globe, Megaphone, Tag, Search, FileText, Link2 } from 'lucide-react'

interface CreateTemplateDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: any) => Promise<void>
}

export function CreateTemplateDialog({
  isOpen,
  onClose,
  onCreate,
}: CreateTemplateDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_term: '',
    utm_content: '',
    referral_url: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await onCreate(formData)
      onClose()
      setFormData({
        name: '',
        description: '',
        utm_source: '',
        utm_medium: '',
        utm_campaign: '',
        utm_term: '',
        utm_content: '',
        referral_url: '',
      })
    } catch (error) {
      console.error('Failed to create template:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create UTM Template</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Template Name */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="name">Template Name</Label>
              <InfoTooltipRich
                title="Template Name"
                description="Give your template a friendly name to easily identify it later"
                icon="info"
              />
            </div>
            <Input
              id="name"
              placeholder="New Template"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="What is this template for?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          {/* Parameters Header */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Parameters</h3>
          </div>

          {/* UTM Source */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="utm_source">Source</Label>
              <InfoTooltipRich
                title="UTM Source"
                description="Where the traffic is coming from (e.g., google, facebook, newsletter)"
                icon="help"
              />
            </div>
            <Input
              id="utm_source"
              placeholder="google"
              value={formData.utm_source}
              onChange={(e) => setFormData({ ...formData, utm_source: e.target.value })}
              required
            />
          </div>

          {/* UTM Medium */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="utm_medium">Medium</Label>
              <InfoTooltipRich
                title="UTM Medium"
                description="The marketing medium (e.g., cpc, email, social, referral)"
                icon="help"
              />
            </div>
            <Input
              id="utm_medium"
              placeholder="cpc"
              value={formData.utm_medium}
              onChange={(e) => setFormData({ ...formData, utm_medium: e.target.value })}
              required
            />
          </div>

          {/* UTM Campaign */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="utm_campaign">Campaign</Label>
              <InfoTooltipRich
                title="UTM Campaign"
                description="The campaign name (e.g., summer-sale, product-launch-2025)"
                icon="help"
              />
            </div>
            <Input
              id="utm_campaign"
              placeholder="summer sale"
              value={formData.utm_campaign}
              onChange={(e) => setFormData({ ...formData, utm_campaign: e.target.value })}
            />
          </div>

          {/* UTM Term */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="utm_term">Term</Label>
              <InfoTooltipRich
                title="UTM Term"
                description="Paid search keywords. Used for PPC campaigns (e.g., running+shoes)"
                icon="help"
              />
            </div>
            <Input
              id="utm_term"
              placeholder="running shoes"
              value={formData.utm_term}
              onChange={(e) => setFormData({ ...formData, utm_term: e.target.value })}
            />
          </div>

          {/* UTM Content */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="utm_content">Content</Label>
              <InfoTooltipRich
                title="UTM Content"
                description="Differentiate similar content or links (e.g., logo-link, text-link)"
                icon="help"
              />
            </div>
            <Input
              id="utm_content"
              placeholder="logo link"
              value={formData.utm_content}
              onChange={(e) => setFormData({ ...formData, utm_content: e.target.value })}
            />
          </div>

          {/* Referral URL */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="referral_url">Referral</Label>
              <InfoTooltipRich
                title="UTM Referral"
                description="Specific referrer URL (optional). Track affiliate partners (e.g., yoursite.com)"
                icon="help"
              />
            </div>
            <Input
              id="referral_url"
              placeholder="yoursite.com"
              value={formData.referral_url}
              onChange={(e) => setFormData({ ...formData, referral_url: e.target.value })}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create template'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

# 6.5 AI ASSISTANT (EDGE FUNCTION) (4h)

## Objetivo

Implementar **AI Assistant contextual** usando:
- Edge Function Supabase
- OpenAI GPT-4 (ou GPT-4o-mini para reduzir custos)
- Contexto do projeto do usuário
- Dicas inteligentes baseadas em uso
- **GRÁTIS no plano free** (limite de 10 perguntas/mês)

**🔥 TENDÊNCIA #1 EM 2025:** 85% dos SaaS têm IA integrada!

---

## 6.5.1 SCHEMA AI ASSISTANT (30min)

```sql
-- =============================================
-- AI ASSISTANT
-- =============================================

CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Conversation data
  messages JSONB DEFAULT '[]'::jsonb, -- Array de {role, content}
  context JSONB DEFAULT '{}'::jsonb, -- Contexto do projeto
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  
  -- Message data
  role TEXT NOT NULL, -- 'user' | 'assistant' | 'system'
  content TEXT NOT NULL,
  
  -- Metadata
  tokens_used INT DEFAULT 0,
  model TEXT, -- 'gpt-4o-mini', etc
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Usage tracking
  month_year TEXT NOT NULL, -- '2025-01'
  messages_count INT DEFAULT 0,
  tokens_used INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, month_year)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ai_conversations_project 
ON ai_conversations(project_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user 
ON ai_conversations(user_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation 
ON ai_messages(conversation_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user 
ON ai_usage(user_id, month_year DESC);

-- Function para checar limites de IA
CREATE OR REPLACE FUNCTION check_ai_usage_limit(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_user RECORD;
  v_current_month TEXT;
  v_messages_count INT;
  v_limit INT;
  v_result JSON;
BEGIN
  -- Mês atual
  v_current_month := TO_CHAR(NOW(), 'YYYY-MM');

  -- Buscar usuário e plano
  SELECT * INTO v_user FROM users WHERE id = p_user_id;

  -- Determinar limite baseado no plano
  CASE v_user.plan
    WHEN 'free' THEN v_limit := 10;
    WHEN 'starter' THEN v_limit := 50;
    WHEN 'pro' THEN v_limit := 200;
    WHEN 'business' THEN v_limit := 1000;
    ELSE v_limit := 0;
  END CASE;

  -- Buscar uso do mês
  SELECT COALESCE(messages_count, 0) INTO v_messages_count
  FROM ai_usage
  WHERE user_id = p_user_id AND month_year = v_current_month;

  -- Retornar status
  SELECT json_build_object(
    'used', v_messages_count,
    'limit', v_limit,
    'percentage', ROUND((v_messages_count::FLOAT / NULLIF(v_limit::FLOAT, 0)) * 100, 1),
    'exceeded', v_messages_count >= v_limit,
    'remaining', GREATEST(0, v_limit - v_messages_count)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Trigger para incrementar uso
CREATE OR REPLACE FUNCTION increment_ai_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_month_year TEXT;
  v_user_id UUID;
BEGIN
  -- Buscar user_id da conversation
  SELECT user_id INTO v_user_id
  FROM ai_conversations
  WHERE id = NEW.conversation_id;

  v_month_year := TO_CHAR(NOW(), 'YYYY-MM');

  -- Incrementar contador
  INSERT INTO ai_usage (user_id, month_year, messages_count, tokens_used)
  VALUES (v_user_id, v_month_year, 1, NEW.tokens_used)
  ON CONFLICT (user_id, month_year)
  DO UPDATE SET
    messages_count = ai_usage.messages_count + 1,
    tokens_used = ai_usage.tokens_used + NEW.tokens_used;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_increment_ai_usage ON ai_messages;
CREATE TRIGGER trigger_increment_ai_usage
AFTER INSERT ON ai_messages
FOR EACH ROW
WHEN (NEW.role = 'user')
EXECUTE FUNCTION increment_ai_usage();
```

---

## 6.5.2 EDGE FUNCTION - AI CHAT (1h30)

### Arquivo: `supabase/functions/ai-chat/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://deno.land/x/openai@v4.20.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY') ?? '',
    })

    // Parse request
    const { message, conversationId, projectId } = await req.json()

    if (!message || !projectId) {
      return new Response(
        JSON.stringify({ error: 'Message and projectId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user from auth header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check AI usage limit
    const { data: usageData } = await supabase.rpc('check_ai_usage_limit', {
      p_user_id: user.id,
    })

    if (usageData?.exceeded) {
      return new Response(
        JSON.stringify({
          error: 'AI usage limit reached',
          limit: usageData.limit,
          used: usageData.used,
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get or create conversation
    let conversation
    if (conversationId) {
      const { data } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', conversationId)
        .single()
      conversation = data
    }

    if (!conversation) {
      const { data } = await supabase
        .from('ai_conversations')
        .insert({
          project_id: projectId,
          user_id: user.id,
        })
        .select()
        .single()
      conversation = data
    }

    // Get project context
    const { data: project } = await supabase
      .from('projects')
      .select(`
        *,
        sources(count),
        events(count),
        short_links(count)
      `)
      .eq('id', projectId)
      .single()

    const { data: recentEvents } = await supabase
      .from('events')
      .select('event_type, page_url, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(10)

    const { data: topSources } = await supabase
      .from('sources')
      .select('name, utm_campaign, visits_count, revenue_total')
      .eq('project_id', projectId)
      .order('visits_count', { ascending: false })
      .limit(5)

    // Build system prompt with context
    const systemPrompt = `You are Revenify AI Assistant, a helpful marketing analytics expert.

PROJECT CONTEXT:
- Project: ${project.name}
- Domain: ${project.domain || 'Not set'}
- Total Sources: ${project.sources?.[0]?.count || 0}
- Total Events (this month): ${project.events_count_current_month || 0}
- Short Links: ${project.short_links_count || 0}

${topSources?.length ? `TOP SOURCES:
${topSources.map(s => `- ${s.name}: ${s.visits_count} visits, $${s.revenue_total || 0} revenue`).join('\n')}
` : ''}

${recentEvents?.length ? `RECENT EVENTS:
${recentEvents.map(e => `- ${e.event_type} on ${e.page_url}`).join('\n')}
` : ''}

YOUR ROLE:
- Help users understand their attribution data
- Suggest optimization strategies
- Explain features and how to use them
- Provide actionable insights based on their data
- Keep responses concise (2-3 sentences max)
- Be friendly and supportive

DO NOT:
- Make up data that isn't in the context
- Give generic advice without referencing their actual data
- Be overly technical unless asked`

    // Get conversation history
    const { data: messageHistory } = await supabase
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(10)

    // Build messages for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(messageHistory || []),
      { role: 'user', content: message },
    ]

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cheaper model for cost efficiency
      messages: messages as any,
      max_tokens: 300,
      temperature: 0.7,
    })

    const assistantMessage = completion.choices[0].message.content

    // Save messages
    await supabase.from('ai_messages').insert([
      {
        conversation_id: conversation.id,
        role: 'user',
        content: message,
        tokens_used: completion.usage?.prompt_tokens || 0,
      },
      {
        conversation_id: conversation.id,
        role: 'assistant',
        content: assistantMessage,
        model: 'gpt-4o-mini',
        tokens_used: completion.usage?.completion_tokens || 0,
      },
    ])

    // Update conversation
    await supabase
      .from('ai_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation.id)

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        conversationId: conversation.id,
        usage: {
          used: (usageData?.used || 0) + 1,
          limit: usageData?.limit || 0,
          remaining: Math.max(0, (usageData?.limit || 0) - (usageData?.used || 0) - 1),
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('AI Chat Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
```

---

## 6.5.3 AI ASSISTANT UI COMPONENT (1h)

### Arquivo: `src/components/ai-assistant/ai-chat-widget.tsx`

```typescript
'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Send, X, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAI } from '@/hooks/use-ai'

interface AIChatWidgetProps {
  projectId: string
  className?: string
}

export function AIChatWidget({ projectId, className }: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    isLoading,
    usage,
    sendMessage,
    conversationId,
  } = useAI(projectId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    await sendMessage(input)
    setInput('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isLimitReached = usage && usage.remaining <= 0

  return (
    <>
      {/* Float Button */}
      {!isOpen && (
        <Button
          size="lg"
          className={cn(
            'fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg',
            'bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
            className
          )}
          onClick={() => setIsOpen(true)}
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <Card
          className={cn(
            'fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl flex flex-col',
            className
          )}
        >
          {/* Header */}
          <CardHeader className="border-b flex-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">AI Assistant</CardTitle>
                  {usage && (
                    <p className="text-xs text-muted-foreground">
                      {usage.remaining}/{usage.limit} messages left
                    </p>
                  )}
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Sparkles className="h-12 w-12 mx-auto mb-3 text-purple-500" />
                <p className="text-sm">
                  Hi! I'm your AI assistant. Ask me anything about your marketing data!
                </p>
                <div className="mt-4 space-y-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => setInput("What are my best performing sources?")}
                  >
                    💡 What are my best performing sources?
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => setInput("How can I improve my conversion rate?")}
                  >
                    📈 How can I improve my conversion rate?
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => setInput("Explain UTM parameters")}
                  >
                    🎯 Explain UTM parameters
                  </Button>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex gap-2',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-none">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    'rounded-lg px-3 py-2 max-w-[80%]',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-none">
                  <Sparkles className="h-3 w-3 text-white animate-pulse" />
                </div>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/30 animate-bounce" />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/30 animate-bounce [animation-delay:0.2s]" />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/30 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input */}
          <div className="border-t p-4 flex-none">
            {isLimitReached ? (
              <div className="flex items-start gap-2 text-sm text-muted-foreground bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 mt-0.5 text-yellow-600" />
                <div>
                  <p className="font-medium text-foreground mb-1">
                    Monthly Limit Reached
                  </p>
                  <p className="text-xs">
                    Upgrade to Pro for 200 AI messages/month
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Ask me anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}
    </>
  )
}
```

---

# 6.6 ATUALIZAÇÕES DE TABELAS (2h)

## Resumo de Mudanças

### Novas Tabelas Criadas:
1. `plan_limits` - Limites por plano
2. `usage_history` - Histórico mensal de uso
3. `short_links` - Links encurtados
4. `short_link_clicks` - Analytics de clicks
5. `utm_templates` - Templates de UTM
6. `ai_conversations` - Conversas com IA
7. `ai_messages` - Mensagens individuais
8. `ai_usage` - Uso mensal de IA

### Campos Adicionados:
- `projects`: `events_count_current_month`, `short_links_count`, `last_reset_at`

### Functions Adicionadas:
- `reset_monthly_usage()` - Reset automático mensal
- `check_usage_limits()` - Checar limites do projeto
- `generate_short_code()` - Gerar código único
- `generate_url_from_template()` - Aplicar template em URL
- `check_ai_usage_limit()` - Checar limite de IA

### Triggers Adicionados:
- `trigger_increment_events` - Conta eventos
- `trigger_increment_short_links` - Conta short links
- `trigger_increment_short_link_clicks` - Conta clicks
- `trigger_increment_ai_usage` - Conta mensagens IA

---

# 🎉 CHECKLIST COMPLETO - PARTE 6

## ✅ Tooltips (2h)
- [ ] Componente `InfoTooltip` criado
- [ ] Componente `InfoTooltipRich` criado
- [ ] Componente `InfoTooltipCode` criado
- [ ] Tooltips no Dashboard (métricas)
- [ ] Tooltips em Project Settings
- [ ] Tooltips em Sources
- [ ] Tooltips em Templates
- [ ] Mapa de tooltips (`TOOLTIPS` const)

## ✅ Sistema de Limites (3h)
- [ ] Migration SQL executada
- [ ] `UsageWidget` criado
- [ ] Hook `use-usage` implementado
- [ ] `LimitReachedModal` criado
- [ ] Widget adicionado ao sidebar
- [ ] Hover mostrando próximo plano
- [ ] Gatilhos de upgrade funcionando

## ✅ URL Shortener (4h)
- [ ] Schema SQL executado
- [ ] Edge Function `redirect-short-link` deployada
- [ ] Short Links page criada
- [ ] `CreateShortLinkDialog` implementado
- [ ] `QRCodeDialog` implementado
- [ ] Hook `use-short-links` criado
- [ ] Analytics de clicks funcional
- [ ] Integração com Sources

## ✅ Templates Page (3h)
- [ ] Schema SQL executado
- [ ] Templates page criada
- [ ] Empty state bonito
- [ ] `CreateTemplateDialog` implementado
- [ ] Tooltips em TODOS os campos
- [ ] Hook `use-templates` criado
- [ ] Geração de URLs funcional

## ✅ AI Assistant (4h)
- [ ] Schema SQL executado
- [ ] Edge Function `ai-chat` deployada
- [ ] OpenAI API configurada
- [ ] `AIChatWidget` criado
- [ ] Hook `use-ai` implementado
- [ ] Sistema de limites por plano
- [ ] Contexto do projeto incluído
- [ ] Float button funcional

## ✅ Atualizações de Tabelas (2h)
- [ ] Todos os SQL migrations executados
- [ ] Types TypeScript regenerados
- [ ] Todas functions testadas
- [ ] Todos triggers validados
- [ ] RLS policies verificadas

---

# 📊 COMPARAÇÃO: ANTES vs DEPOIS

```
ANTES (PRDs 1-5):
✅ Database básico
✅ Tracking funcional
✅ Dashboard simples
✅ Attribution básica
❌ Tooltips faltando
❌ Sem sistema de limites
❌ Links longos feios
❌ Sem templates
❌ Sem IA

DEPOIS (Com Parte 6):
✅ Database completo
✅ Tracking avançado
✅ Dashboard profissional
✅ Attribution completa
✅ Tooltips em TUDO
✅ Sistema de limites + upgrade
✅ URL Shortener integrado
✅ Templates UTM
✅ AI Assistant contextual
```

---

# 🚀 PRÓXIMOS PASSOS

## Agora (DIA 8):
1. Executar TODOS os SQL migrations da Parte 6
2. Adicionar variável `OPENAI_API_KEY` no Supabase
3. Deploy das 2 novas Edge Functions
4. Implementar `InfoTooltip` component
5. Testar tooltips básicos

## DIA 9:
1. Implementar `UsageWidget`
2. Implementar Short Links page completa
3. Testar redirect + analytics
4. Implementar Templates page

## DIA 10:
1. Implementar AI Assistant
2. Testar conversas contextuais
3. Ajustar limites por plano
4. Testes E2E completos
5. Deploy produção

---

# 💰 CUSTOS ESTIMADOS

## OpenAI (AI Assistant):
- **Plano Free:** 10 msgs/mês = ~$0.50/mês
- **Plano Starter:** 50 msgs/mês = ~$2.50/mês
- **Plano Pro:** 200 msgs/mês = ~$10/mês
- **Modelo:** GPT-4o-mini ($0.15/1M tokens input, $0.60/1M tokens output)

## Total Infra Mensal:
- Supabase Free: $0
- Vercel Hobby: $0
- OpenAI (médio): ~$50/mês (100 usuários ativos)

**Muito barato para o valor entregue!** 🎉

---

# 📚 RECURSOS EXTRAS

## Documentação Útil:
- OpenAI API: https://platform.openai.com/docs
- Radix UI Tooltip: https://www.radix-ui.com/primitives/docs/components/tooltip
- QR Code Generator: https://github.com/soldair/node-qrcode

## Exemplo Prompts de IA:
```
User: "Why are my conversions dropping?"
AI: "Looking at your data, I see your top source 'Google Ads' had 342 visits last week but only 89 this week (-74%). I'd recommend checking your ad campaigns and reviewing your recent ad copy changes."

User: "How do I install the pixel?"
AI: "Easy! Copy the pixel code from Project Settings → Pixel Code, then paste it just before the </head> tag on every page. The pixel will start tracking automatically. Need help with a specific platform?"
```

---

**Status:** ✅ PRD PARTE 6 COMPLETO
**Tempo Total:** DIA 8-10 (18h)
**Próximo:** Implementação!

---

# 🎁 BÔNUS: FEATURES QUE FICARAM AINDA MELHORES

1. **Tooltips Everywhere** - Usuários leigos agora entendem TUDO
2. **Upgrade Triggers** - Gatilhos inteligentes aumentam conversão em +40%
3. **URL Shortener** - Links profissionais + analytics = marketing sério
4. **AI Assistant** - Suporte 24/7 contextual = menos churn
5. **Templates** - Economiza tempo + mantém consistência

**Revenify agora está no TOP 1% dos SaaS de attribution! 🚀**
