import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
      .select('*')
      .eq('id', projectId)
      .single()

    const { data: sourcesCount } = await supabase
      .from('sources')
      .select('id', { count: 'exact' })
      .eq('project_id', projectId)

    const { data: recentEvents } = await supabase
      .from('events')
      .select('event_type, page_url, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(10)

    const { data: topSources } = await supabase
      .from('sources')
      .select('name, utm_campaign, total_visitors, total_revenue')
      .eq('project_id', projectId)
      .order('total_visitors', { ascending: false })
      .limit(5)

    // Build system prompt with context
    const systemPrompt = `Você é o Revenify AI Assistant, um especialista em marketing analytics e atribuição de receita.

CONTEXTO DO PROJETO:
- Projeto: ${project?.name || 'Não definido'}
- Domínio: ${project?.domain || 'Não definido'}
- Total de Fontes: ${sourcesCount?.length || 0}
- Eventos este mês: ${project?.events_count_current_month || 0}
- Links Curtos: ${project?.short_links_count || 0}

${topSources?.length ? `TOP FONTES DE TRÁFEGO:
${topSources.map(s => `- ${s.name}: ${s.total_visitors || 0} visitantes, R$${s.total_revenue || 0} receita`).join('\n')}
` : ''}

${recentEvents?.length ? `EVENTOS RECENTES:
${recentEvents.map(e => `- ${e.event_type} em ${e.page_url}`).join('\n')}
` : ''}

SEU PAPEL:
- Ajudar usuários a entender seus dados de atribuição
- Sugerir estratégias de otimização
- Explicar features e como usá-las
- Fornecer insights acionáveis baseados nos dados
- Manter respostas concisas (2-3 frases no máximo)
- Ser amigável e prestativo
- Responder em português brasileiro

NÃO FAÇA:
- Inventar dados que não estão no contexto
- Dar conselhos genéricos sem referenciar os dados reais
- Ser excessivamente técnico a menos que seja pedido`

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

    // Call OpenAI API directly
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 300,
        temperature: 0.7,
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json()
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`)
    }

    const completion = await openaiResponse.json()
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
          limit: usageData?.limit || 10,
          remaining: Math.max(0, (usageData?.limit || 10) - (usageData?.used || 0) - 1),
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
