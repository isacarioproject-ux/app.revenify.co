import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIUsage {
  used: number
  limit: number
  remaining: number
}

export function useAIChat(projectId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [usage, setUsage] = useState<AIUsage | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    if (!projectId || !content.trim()) return

    setIsLoading(true)
    setError(null)

    // Add user message immediately
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: content.trim(),
          conversationId,
          projectId,
        },
      })

      if (invokeError) throw invokeError

      if (data.error) {
        if (data.error === 'AI usage limit reached') {
          setError('Limite de mensagens atingido. Faça upgrade para continuar.')
          toast.error('Limite de IA atingido', {
            description: `Você usou ${data.used}/${data.limit} mensagens este mês.`,
          })
        } else {
          throw new Error(data.error)
        }
        return
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])

      // Update conversation ID and usage
      if (data.conversationId) {
        setConversationId(data.conversationId)
      }
      if (data.usage) {
        setUsage(data.usage)
      }
    } catch (err) {
      console.error('AI Chat error:', err)
      setError('Erro ao enviar mensagem. Tente novamente.')
      toast.error('Erro ao enviar mensagem')
      // Remove the user message on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id))
    } finally {
      setIsLoading(false)
    }
  }, [projectId, conversationId])

  const clearChat = useCallback(() => {
    setMessages([])
    setConversationId(null)
    setError(null)
  }, [])

  return {
    messages,
    isLoading,
    usage,
    error,
    sendMessage,
    clearChat,
  }
}
