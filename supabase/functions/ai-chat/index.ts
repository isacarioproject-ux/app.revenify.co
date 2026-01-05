import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para construir o system prompt com contexto completo
function buildSystemPrompt(context: any): string {
  const project = context?.project?.summary?.project
  const totals = context?.project?.summary?.totals
  const metrics30d = context?.project?.metrics_30d
  const metrics7d = context?.project?.metrics_7d
  const topSources = context?.project?.top_sources || []
  const shortLinks = context?.project?.short_links || []
  const audience = context?.project?.audience
  const subscription = context?.user?.subscription

  return `Você é o **Revenify AI Assistant**, um especialista em marketing analytics, atribuição de receita e otimização de conversão.

═══════════════════════════════════════════════════════════
📊 CONTEXTO COMPLETO DO PROJETO
═══════════════════════════════════════════════════════════

🏢 **PROJETO:**
- Nome: ${project?.name || 'Não definido'}
- Domínio: ${project?.domain || 'Não definido'}
- Status: ${project?.is_active ? '✅ Ativo' : '❌ Inativo'}
- Criado em: ${project?.created_at ? new Date(project.created_at).toLocaleDateString('pt-BR') : 'N/A'}

📈 **TOTAIS GERAIS:**
- Total de Eventos: ${totals?.total_events?.toLocaleString('pt-BR') || 0}
- Total de Leads: ${totals?.total_leads?.toLocaleString('pt-BR') || 0}
- Total de Pagamentos: ${totals?.total_payments?.toLocaleString('pt-BR') || 0}
- Receita Total: R$ ${Number(totals?.total_revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Fontes de Tráfego: ${totals?.total_sources || 0}
- Links Curtos: ${totals?.total_short_links || 0}

📅 **MÉTRICAS ÚLTIMOS 30 DIAS:**
- Eventos: ${metrics30d?.events?.total?.toLocaleString('pt-BR') || 0} (${metrics30d?.events?.pageviews || 0} pageviews, ${metrics30d?.events?.conversions || 0} conversões)
- Leads Capturados: ${metrics30d?.leads?.total || 0}
- Pagamentos: ${metrics30d?.payments?.total || 0} (R$ ${Number(metrics30d?.payments?.revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
- Ticket Médio: R$ ${Number(metrics30d?.payments?.avg_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

📅 **MÉTRICAS ÚLTIMOS 7 DIAS:**
- Eventos: ${metrics7d?.events?.total?.toLocaleString('pt-BR') || 0}
- Leads: ${metrics7d?.leads?.total || 0}
- Receita: R$ ${Number(metrics7d?.payments?.revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

${topSources.length > 0 ? `🎯 **TOP FONTES DE TRÁFEGO:**
${topSources.map((s: any, i: number) => `${i + 1}. ${s.name} (${s.utm_source || 'direto'}/${s.utm_medium || '-'})
   - Visitantes: ${s.visitors?.toLocaleString('pt-BR') || 0}
   - Leads: ${s.leads || 0}
   - Receita: R$ ${Number(s.revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
   - Taxa de Conversão: ${s.conversion_rate || 0}%`).join('\n')}
` : '⚠️ Nenhuma fonte de tráfego configurada ainda.'}

${shortLinks.length > 0 ? `🔗 **LINKS CURTOS (Top ${shortLinks.length}):**
${shortLinks.slice(0, 5).map((l: any, i: number) => `${i + 1}. ${l.short_code}${l.title ? ` (${l.title})` : ''}
   - Cliques: ${l.clicks?.toLocaleString('pt-BR') || 0} (${l.unique_clicks || 0} únicos)
   - A/B Test: ${l.has_ab_test ? 'Sim' : 'Não'} | Geo: ${l.has_geo_targeting ? 'Sim' : 'Não'}`).join('\n')}
` : ''}

${audience?.total_events > 0 ? `👥 **AUDIÊNCIA:**
- Dispositivos: ${audience.devices?.map((d: any) => `${d.device} (${d.percentage}%)`).join(', ') || 'N/A'}
- Países: ${audience.countries?.map((c: any) => `${c.country} (${c.percentage}%)`).join(', ') || 'N/A'}
- Navegadores: ${audience.browsers?.map((b: any) => `${b.browser} (${b.percentage}%)`).join(', ') || 'N/A'}
` : ''}

💳 **PLANO DO USUÁRIO:**
- Plano: ${subscription?.plan?.toUpperCase() || 'FREE'}
- Status: ${subscription?.status || 'active'}
- Eventos: ${subscription?.current_events?.toLocaleString('pt-BR') || 0} / ${subscription?.max_events?.toLocaleString('pt-BR') || 1000}
- Mensagens IA: ${subscription?.ai_messages_used || 0} / ${subscription?.ai_messages_limit || 20}

═══════════════════════════════════════════════════════════
🤖 INSTRUÇÕES DO ASSISTENTE
═══════════════════════════════════════════════════════════

**SEU PAPEL:**
1. Analisar dados de marketing e atribuição de receita
2. Identificar oportunidades de otimização
3. Sugerir estratégias baseadas em dados reais
4. Explicar métricas e como melhorá-las
5. Ajudar a configurar UTMs, fontes e links curtos
6. Responder dúvidas sobre a plataforma Revenify

**ESTILO DE RESPOSTA:**
- Seja conciso e direto (máximo 3-4 frases por resposta)
- Use dados específicos do contexto acima
- Forneça insights acionáveis
- Responda sempre em português brasileiro
- Use emojis moderadamente para clareza

**REGRAS IMPORTANTES:**
❌ NUNCA invente dados que não estão no contexto
❌ NUNCA dê conselhos genéricos sem referenciar dados reais
❌ NUNCA seja excessivamente técnico sem necessidade
✅ SEMPRE baseie suas respostas nos dados acima
✅ SEMPRE sugira próximos passos práticos
✅ SEMPRE seja amigável e prestativo`
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

    // Check AI usage limit from subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('ai_messages_used, ai_messages_limit')
      .eq('user_id', user.id)
      .single()

    const aiUsed = subscription?.ai_messages_used || 0
    const aiLimit = subscription?.ai_messages_limit || 20

    if (aiUsed >= aiLimit) {
      return new Response(
        JSON.stringify({
          error: 'AI usage limit reached',
          limit: aiLimit,
          used: aiUsed,
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

    // 🚀 USAR A NOVA FUNÇÃO get_ai_context PARA CONTEXTO COMPLETO
    const { data: aiContext, error: contextError } = await supabase.rpc('get_ai_context', {
      p_user_id: user.id,
      p_project_id: projectId
    })

    if (contextError) {
      console.error('Error getting AI context:', contextError)
    }

    // Build system prompt with full context
    const systemPrompt = buildSystemPrompt(aiContext)

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

    // Incrementar contador de uso de IA na subscription
    await supabase
      .from('subscriptions')
      .update({ ai_messages_used: aiUsed + 1 })
      .eq('user_id', user.id)

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        conversationId: conversation.id,
        usage: {
          used: aiUsed + 1,
          limit: aiLimit,
          remaining: Math.max(0, aiLimit - aiUsed - 1),
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
