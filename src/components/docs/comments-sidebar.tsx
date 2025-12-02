import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  MessageSquare,
  Send,
  Check,
  X,
  Reply,
  MoreVertical,
  Trash,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useI18n } from '@/hooks/use-i18n'
import { formatDistanceToNow } from 'date-fns'
import { useDateFnsLocale } from '@/hooks/use-date-fns-locale'

interface Comment {
  id: string
  document_id: string
  user_id: string
  parent_comment_id: string | null
  content: string
  mentions: string[]
  is_resolved: boolean
  created_at: string
  user_email?: string
}

interface CommentsSidebarProps {
  docId: string
  open: boolean
  onClose: () => void
}

export const CommentsSidebar = ({ docId, open, onClose }: CommentsSidebarProps) => {
  const { t } = useI18n()
  const dateFnsLocale = useDateFnsLocale()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('')

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)
    }
    loadUser()
  }, [])

  useEffect(() => {
    if (open) fetchComments()
  }, [open, docId])

  const fetchComments = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('document_comments')
        .select('*')
        .eq('document_id', docId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setComments(data || [])
    } catch (err: any) {
      toast.error('Erro ao carregar comentários', {
        description: err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendComment = async () => {
    if (!newComment.trim()) return

    setSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      // Detectar menções @
      const mentionMatches = newComment.match(/@(\w+)/g)
      const mentions = mentionMatches ? mentionMatches.map(m => m.substring(1)) : []

      const { error } = await supabase
        .from('document_comments')
        .insert({
          document_id: docId,
          user_id: user.id,
          parent_comment_id: replyTo,
          content: newComment,
          mentions: mentions,
        })

      if (error) throw error

      setNewComment('')
      setReplyTo(null)
      fetchComments()
      toast.success(t('pages.comments.added'))
    } catch (err: any) {
      toast.error('Erro ao adicionar comentário', {
        description: err.message,
      })
    } finally {
      setSending(false)
    }
  }

  const handleResolve = async (commentId: string, resolved: boolean) => {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('document_comments')
      .update({
        is_resolved: resolved,
        resolved_by: resolved ? user?.id : null,
        resolved_at: resolved ? new Date().toISOString() : null,
      })
      .eq('id', commentId)

    if (!error) {
      fetchComments()
      toast.success(resolved ? t('pages.comments.resolved') : t('pages.comments.reopened'))
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm(t('pages.comments.confirmDelete'))) return

    const { error } = await supabase
      .from('document_comments')
      .delete()
      .eq('id', commentId)

    if (!error) {
      fetchComments()
      toast.success(t('pages.comments.deleted'))
    }
  }

  const unresolvedCount = comments.filter(c => !c.is_resolved && !c.parent_comment_id).length

  if (!open) return null

  return (
    <div className="w-[320px] border-l border-border bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span className="text-sm font-semibold">{t('pages.comments.title')}</span>
          {unresolvedCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {unresolvedCount}
            </Badge>
          )}
        </div>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Lista de comentários */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="text-xs text-muted-foreground text-center py-8">
              {t('pages.comments.loading')}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-8">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>{t('pages.comments.noComments')}</p>
              <p className="mt-1">{t('pages.comments.beFirst')}</p>
            </div>
          ) : (
            comments
              .filter(c => !c.parent_comment_id)
              .map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  replies={comments.filter(c => c.parent_comment_id === comment.id)}
                  currentUserId={currentUserId}
                  onReply={() => setReplyTo(comment.id)}
                  onResolve={(resolved) => handleResolve(comment.id, resolved)}
                  onDelete={() => handleDelete(comment.id)}
                />
              ))
          )}
        </div>
      </ScrollArea>

      {/* Input novo comentário */}
      <div className="p-4 border-t border-border">
        {replyTo && (
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            <span>{t('pages.comments.replying')}</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5"
              onClick={() => setReplyTo(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        
        <div className="space-y-2">
          <Textarea
            placeholder={`${t('pages.comments.add')} (use @ para mencionar)`}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] text-sm resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleSendComment()
              }
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('pages.comments.ctrlEnter')}</span>
            <Button
              size="sm"
              onClick={handleSendComment}
              disabled={!newComment.trim() || sending}
            >
              <Send className="h-3 w-3 mr-1.5" />
              {sending ? t('pages.comments.sending') : t('pages.comments.send')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente de item de comentário
interface CommentItemProps {
  comment: Comment
  replies: Comment[]
  currentUserId: string
  onReply: () => void
  onResolve: (resolved: boolean) => void
  onDelete: () => void
}

const CommentItem = ({ comment, replies, currentUserId, onReply, onResolve, onDelete }: CommentItemProps) => {
  const { t } = useI18n()
  const initials = comment.user_email?.slice(0, 2).toUpperCase() || '??'
  const isOwn = currentUserId === comment.user_id

  return (
    <div className={`space-y-2 ${comment.is_resolved ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-2">
        <Avatar className="h-7 w-7 flex-shrink-0">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium">{comment.user_email || t('pages.comments.unknownUser')}</span>
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), {
                addSuffix: true,
                locale: useDateFnsLocale(),
              })}
            </span>
            {comment.is_resolved && (
              <Badge variant="secondary" className="h-4 px-1 text-[9px]">
                <Check className="h-2.5 w-2.5 mr-0.5" />
                {t('pages.comments.resolved')}
              </Badge>
            )}
          </div>

          <p className="text-xs whitespace-pre-wrap break-words">
            {comment.content}
          </p>

          <div className="flex items-center gap-2 mt-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={onReply}
            >
              <Reply className="h-3 w-3 mr-1" />
              {t('pages.comments.reply')}
            </Button>

            {!comment.is_resolved ? (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                onClick={() => onResolve(true)}
              >
                <Check className="h-3 w-3 mr-1" />
                {t('pages.comments.resolve')}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                onClick={() => onResolve(false)}
              >
                {t('pages.comments.reopen')}
              </Button>
            )}

            {isOwn && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-6 w-6">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={onDelete}
                  >
                    <Trash className="mr-2 h-3 w-3" />
                    {t('pages.comments.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Respostas */}
      {replies.length > 0 && (
        <div className="ml-9 space-y-2 border-l-2 border-border pl-3">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              replies={[]}
              currentUserId={currentUserId}
              onReply={onReply}
              onResolve={onResolve}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
