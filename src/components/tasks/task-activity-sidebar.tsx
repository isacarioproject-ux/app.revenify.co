import { addComment, getCurrentUserId, addTaskLink, deleteTaskLink, getUsers } from '@/lib/tasks/tasks-storage';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Comment, Activity, TaskLink, User } from '@/types/tasks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AtSign, Paperclip, Send, Smile, Link2, Plus, X, ExternalLink, Image, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/contexts/workspace-context';

// Emojis comuns
const COMMON_EMOJIS = ['😀', '😂', '😊', '👍', '👏', '🎉', '❤️', '🔥', '✅', '⭐', '💪', '🙏', '😍', '🤔', '👀', '💯'];

interface TaskActivitySidebarProps {
  taskId: string;
  comments: Comment[];
  activities: Activity[];
  links?: TaskLink[];
  onUpdate: () => void;
}

export function TaskActivitySidebar({
  taskId,
  comments,
  activities,
  links = [],
  onUpdate,
}: TaskActivitySidebarProps) {
  const { t } = useI18n();
  const { currentWorkspace } = useWorkspace();
  const [activeTab, setActiveTab] = useState<'atividade' | 'comentarios' | 'links'>('atividade');
  const [commentText, setCommentText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [mentionFilter, setMentionFilter] = useState('');
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Renderizar texto do comentário com suporte a imagens e links
  const renderCommentText = (text: string) => {
    // Regex para imagem markdown: ![alt](url)
    const imageMarkdownRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    // Regex para link markdown: [text](url)
    const linkMarkdownRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    // Regex para link de arquivo: [📎 nome](url)
    const fileMarkdownRegex = /\[📎\s*([^\]]+)\]\(([^)]+)\)/g;
    
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    
    // Primeiro, processar imagens
    const processedText = text.replace(imageMarkdownRegex, (_, alt, url) => {
      return `__IMAGE__${url}__ALT__${alt}__ENDIMAGE__`;
    });
    
    // Depois, processar links de arquivo
    const withFiles = processedText.replace(fileMarkdownRegex, (_, name, url) => {
      return `__FILE__${url}__NAME__${name}__ENDFILE__`;
    });
    
    // Por fim, processar links normais
    const withLinks = withFiles.replace(linkMarkdownRegex, (_, text, url) => {
      return `__LINK__${url}__TEXT__${text}__ENDLINK__`;
    });
    
    // Agora renderizar
    const segments = withLinks.split(/(__IMAGE__|__ENDIMAGE__|__FILE__|__ENDFILE__|__LINK__|__ENDLINK__)/);
    let i = 0;
    const result: React.ReactNode[] = [];
    
    while (i < segments.length) {
      const segment = segments[i];
      
      if (segment === '__IMAGE__') {
        const urlAndAlt = segments[i + 1];
        const [url, alt] = urlAndAlt.split('__ALT__');
        result.push(
          <img 
            key={`img-${i}`}
            src={url} 
            alt={alt || 'Imagem'} 
            className="max-w-full rounded-lg mt-2 cursor-pointer hover:opacity-90 transition-opacity"
            style={{ maxHeight: '200px', objectFit: 'contain' }}
            onClick={() => window.open(url, '_blank')}
          />
        );
        i += 3; // Pular __IMAGE__, conteúdo, __ENDIMAGE__
      } else if (segment === '__FILE__') {
        const urlAndName = segments[i + 1];
        const [url, name] = urlAndName.split('__NAME__');
        result.push(
          <a 
            key={`file-${i}`}
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:underline mt-1"
          >
            📎 {name}
          </a>
        );
        i += 3;
      } else if (segment === '__LINK__') {
        const urlAndText = segments[i + 1];
        const [url, text] = urlAndText.split('__TEXT__');
        result.push(
          <a 
            key={`link-${i}`}
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {text}
          </a>
        );
        i += 3;
      } else if (segment && !segment.startsWith('__')) {
        result.push(<span key={`text-${i}`}>{segment}</span>);
        i++;
      } else {
        i++;
      }
    }
    
    return result.length > 0 ? result : text;
  };

  // Carregar usuários do workspace para menções
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await getUsers();
        setUsers(usersData);
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
      }
    };
    loadUsers();
  }, [currentWorkspace?.id]);

  // Inserir emoji no comentário
  const handleInsertEmoji = (emoji: string) => {
    setCommentText(prev => prev + emoji);
    setShowEmojis(false);
    inputRef.current?.focus();
  };

  // Inserir menção no comentário
  const handleInsertMention = (user: User) => {
    setCommentText(prev => prev + `@${user.name} `);
    setShowMentions(false);
    setMentionFilter('');
    inputRef.current?.focus();
  };

  // Upload de anexo
  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAttachment(true);
    try {
      // Obter userId para o path correto (RLS exige userId como primeiro folder)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(t('tasks.activity.notAuthenticated'));
        return;
      }

      // Upload para Supabase Storage - path: userId/taskId/filename
      const fileExt = file.name.split('.').pop();
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${taskId}/${uniqueName}`;

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      // Adicionar link do arquivo no comentário
      const fileLink = file.type.startsWith('image/') 
        ? `![${file.name}](${publicUrl})` 
        : `[📎 ${file.name}](${publicUrl})`;
      
      setCommentText(prev => prev + (prev ? '\n' : '') + fileLink);
      toast.success(t('tasks.activity.attachmentUploaded'));
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error(t('tasks.activity.attachmentError'));
    } finally {
      setUploadingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Filtrar usuários para menção
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  const handleSendComment = async () => {
    if (!commentText.trim()) return;

    try {
      const userId = await getCurrentUserId();
      
      // Criar objeto Comment - mentions como array vazio (UUIDs são gerenciados pelo backend)
      const newComment: Comment = {
        id: `temp-${Date.now()}`,
        task_id: taskId,
        user_id: userId,
        user_name: 'Você',
        text: commentText,
        created_at: new Date().toISOString(),
        mentions: [], // Array vazio - não passar nomes como UUIDs
      };
      
      await addComment(newComment);
      setCommentText('');
      toast.success(t('tasks.activity.commentAdded'));
      onUpdate();
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      toast.error(t('tasks.activity.commentError'));
    }
  };

  const handleAddLink = async () => {
    if (!linkUrl.trim()) {
      toast.error('Digite uma URL válida');
      return;
    }

    try {
      // Validar URL
      let url = linkUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }

      await addTaskLink(taskId, url, linkTitle || undefined);
      setLinkUrl('');
      setLinkTitle('');
      toast.success('Link adicionado');
      onUpdate();
    } catch (error) {
      console.error('Erro ao adicionar link:', error);
      toast.error('Erro ao adicionar link');
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      await deleteTaskLink(linkId);
      toast.success('Link removido');
      onUpdate();
    } catch (error) {
      console.error('Erro ao remover link:', error);
      toast.error('Erro ao remover link');
    }
  };

  const getDomainFromUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const allActivities = [
    ...(activities || []).map(a => ({ ...a, type: 'activity' as const })),
    ...(comments || []).map(c => ({ ...c, type: 'comment' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="h-full flex flex-col bg-white dark:bg-black border-l dark:border-gray-800">
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-800 bg-white dark:bg-black">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList variant="fullWidth">
            <TabsTrigger value="atividade" className="flex-1 text-xs">
              {t('tasks.activity.title')}
            </TabsTrigger>
            <TabsTrigger value="comentarios" className="flex-1 text-xs">
              {t('tasks.activity.comments')} ({(comments || []).length})
            </TabsTrigger>
            <TabsTrigger value="links" className="flex-1 text-xs">
              Links ({(links || []).length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {activeTab === 'atividade' && (
          <>
            {allActivities.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-3"
              >
                <Avatar className="size-8 flex-shrink-0">
                  <AvatarFallback className="text-xs">
                    {(item.user_name || 'U').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm">
                    <span className="dark:text-gray-100">{item.user_name || 'Usuário'}</span>
                    <span className="text-gray-600 dark:text-gray-400 ml-1">
                      {item.type === 'activity' ? item.details : 'comentou'}
                    </span>
                  </div>
                  {item.type === 'comment' && (
                    <div className="mt-1 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700">
                      {item.text}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatTimestamp(item.created_at)}
                  </div>
                </div>
              </motion.div>
            ))}
            {allActivities.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center text-gray-500 dark:text-gray-400 py-8"
              >
                <p className="text-sm">{t('tasks.activity.noActivity')}</p>
              </motion.div>
            )}
          </>
        )}

        {activeTab === 'comentarios' && (
          <>
            {(comments || []).map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-3"
              >
                <Avatar className="size-8 flex-shrink-0">
                  <AvatarFallback className="text-xs">
                    {(comment.user_name || 'U').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm dark:text-gray-100">{comment.user_name || 'Usuário'}</div>
                  <div className="mt-1 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700">
                    {renderCommentText(comment.text)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatTimestamp(comment.created_at)}
                  </div>
                </div>
              </motion.div>
            ))}
            {(comments || []).length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center text-gray-500 dark:text-gray-400 py-8"
              >
                <p className="text-sm">{t('tasks.activity.noComments')}</p>
                <p className="text-xs mt-1">{t('tasks.activity.beFirst')}</p>
              </motion.div>
            )}
          </>
        )}

        {activeTab === 'links' && (
          <>
            {(links || []).map((link, index) => (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 border dark:border-gray-700"
              >
                <div className="flex-1 min-w-0">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 hover:opacity-80 transition-opacity"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link2 className="size-4 text-gray-400 flex-shrink-0" />
                        <p className="text-sm font-medium dark:text-gray-100 truncate">
                          {link.title || getDomainFromUrl(link.url)}
                        </p>
                        <ExternalLink className="size-3 text-gray-400 flex-shrink-0" />
                      </div>
                      {link.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          {link.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                        {getDomainFromUrl(link.url)}
                      </p>
                    </div>
                  </a>
                </div>
                <button
                  onClick={() => handleDeleteLink(link.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  <X className="size-4 text-red-500" />
                </button>
              </motion.div>
            ))}
            {(links || []).length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center text-gray-500 dark:text-gray-400 py-8"
              >
                <Link2 className="size-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum link adicionado</p>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Input Footer - Comentário ou Link */}
      <div className="p-4 border-t dark:border-gray-800 bg-white dark:bg-black">
        {activeTab === 'comentarios' ? (
          <>
        {/* Input oculto para anexos */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleAttachmentUpload}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        />
        
        <div className="flex gap-2 mb-2">
          <Input
            ref={inputRef}
            placeholder={t('tasks.activity.writeComment')}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendComment();
              }
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {/* Botão Menção @ */}
            <Popover open={showMentions} onOpenChange={setShowMentions}>
              <PopoverTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  title={t('tasks.activity.mention')}
                >
                  <AtSign className="size-4 text-gray-600 dark:text-gray-400" />
                </motion.button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <Input
                  placeholder={t('tasks.activity.searchUser')}
                  value={mentionFilter}
                  onChange={(e) => setMentionFilter(e.target.value)}
                  className="mb-2 h-8 text-sm"
                />
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                      <button
                        key={user.id}
                        onClick={() => handleInsertMention(user)}
                        className="w-full flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-left"
                      >
                        <Avatar className="size-6">
                          <AvatarFallback className="text-xs">
                            {user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate">{user.name}</span>
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 text-center py-2">
                      {t('tasks.activity.noUsers')}
                    </p>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Botão Emoji */}
            <Popover open={showEmojis} onOpenChange={setShowEmojis}>
              <PopoverTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  title={t('tasks.activity.emoji')}
                >
                  <Smile className="size-4 text-gray-600 dark:text-gray-400" />
                </motion.button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="start">
                <div className="grid grid-cols-8 gap-1">
                  {COMMON_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleInsertEmoji(emoji)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Botão Anexo */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAttachment}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50"
              title={t('tasks.activity.attach')}
            >
              {uploadingAttachment ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Paperclip className="size-4 text-blue-500" />
                </motion.div>
              ) : (
                <Paperclip className="size-4 text-gray-600 dark:text-gray-400" />
              )}
            </motion.button>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              size="sm"
              onClick={handleSendComment}
              disabled={!commentText.trim() || uploadingAttachment}
            >
              <Send className="size-4 mr-1" />
              {t('tasks.activity.send')}
            </Button>
          </motion.div>
        </div>
          </>
        ) : activeTab === 'links' ? (
          <div className="space-y-2">
            <Input
              placeholder="https://exemplo.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddLink();
                }
              }}
              className="text-sm"
            />
            <Input
              placeholder="Título (opcional)"
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddLink();
                }
              }}
              className="text-sm"
            />
            <Button
              size="sm"
              onClick={handleAddLink}
              disabled={!linkUrl.trim()}
              className="w-full"
            >
              <Plus className="size-4 mr-1" />
              Adicionar Link
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}