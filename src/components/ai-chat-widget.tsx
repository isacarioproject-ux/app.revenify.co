import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Send,
  X,
  RotateCcw,
  ArrowRight,
} from 'lucide-react'
import { useAIChat } from '@/hooks/use-ai-chat'
import { useProjects } from '@/hooks/use-projects'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'

// Emails autorizados a usar o AI Chat (até Stripe estar ativo)
const AUTHORIZED_EMAILS = [
  'revenify.co',
  'revenify@gmail.com',
  'admin@revenify.co',
  'contato@revenify.co',
]

// Logo do aplicativo
function RevenifyLogo({ className }: { className?: string }) {
  return (
    <img 
      src="/logo.png" 
      alt="Revenify" 
      className={cn('object-contain', className)}
    />
  )
}

export function AIChatWidget() {
  const { user } = useAuth()
  const { selectedProject } = useProjects()
  const { messages, isLoading, usage, error, sendMessage, clearChat } = useAIChat(selectedProject?.id || null)
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Verificar se o usuário está autorizado a usar o AI Chat
  const isAuthorized = user?.email && AUTHORIZED_EMAILS.some(
    email => user.email?.toLowerCase().includes(email.toLowerCase())
  )

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage(input)
    setInput('')
  }

  const suggestions = [
    'Qual fonte converte mais?',
    'Analisar campanhas',
    'Configurar UTMs',
    'Ver tendências',
  ]

  // Não mostrar se não houver projeto selecionado OU se não estiver autorizado
  if (!selectedProject || !isAuthorized) return null

  return (
    <>
      {/* Floating Button - Clean R Logo */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-5 right-5 z-50 group',
          'h-11 w-11 rounded-xl',
          'bg-background/80 dark:bg-background/60',
          'backdrop-blur-xl border border-border/50',
          'shadow-lg hover:shadow-xl',
          'transition-all duration-300 ease-out',
          'hover:scale-105 active:scale-95',
          isOpen && 'hidden'
        )}
      >
        <RevenifyLogo className="h-6 w-6 mx-auto" />
      </button>

      {/* Chat Panel - Clean & Minimal */}
      {isOpen && (
        <div className={cn(
          'fixed bottom-5 right-5 z-50',
          'w-[360px] h-[480px]',
          'bg-background/95 dark:bg-background/90',
          'backdrop-blur-xl',
          'border border-border/50 rounded-2xl',
          'shadow-2xl',
          'flex flex-col overflow-hidden',
          'animate-in fade-in-0 slide-in-from-bottom-4 duration-300'
        )}>
          {/* Header - Minimal */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <RevenifyLogo className="h-6 w-6" />
              <div>
                <h3 className="text-sm font-medium">Revenify AI</h3>
                {usage && (
                  <p className="text-[10px] text-muted-foreground">
                    {usage.remaining} mensagens restantes
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="p-1.5 rounded-lg hover:bg-muted/80 transition-colors"
                title="Nova conversa"
              >
                <RotateCcw className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted/80 transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 px-4 py-3">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center">
                    <RevenifyLogo className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Como posso ajudar?</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Pergunte sobre suas métricas e campanhas
                    </p>
                  </div>
                </div>

                {/* Sugestões como chips */}
                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(s)
                        inputRef.current?.focus()
                      }}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs',
                        'bg-muted/50 hover:bg-muted',
                        'border border-border/50',
                        'transition-colors duration-200'
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3" ref={scrollRef}>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted/70 rounded-bl-md'
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted/70 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}
          </ScrollArea>

          {/* Input - Clean */}
          <div className="p-3 border-t border-border/50">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Pergunte algo..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className={cn(
                  'flex-1 h-10 rounded-xl',
                  'bg-muted/50 border-0',
                  'focus-visible:ring-1 focus-visible:ring-primary/30',
                  'placeholder:text-muted-foreground/60'
                )}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="h-10 w-10 rounded-xl shrink-0"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
