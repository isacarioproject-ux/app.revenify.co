import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, 
  Calendar, 
  Flag, 
  User, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Share2,
  ExternalLink
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SharedTask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  created_by_name: string;
  assignees: string[];
}

export default function TaskSharePage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<SharedTask | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewCount, setViewCount] = useState(0);

  useEffect(() => {
    const fetchSharedTask = async () => {
      if (!token) {
        setError('Link inválido');
        setLoading(false);
        return;
      }

      try {
        // Buscar o share pelo token
        const { data: shareData, error: shareError } = await supabase
          .from('task_shares')
          .select(`
            id,
            task_id,
            view_count,
            expires_at,
            is_active,
            tasks (
              id,
              title,
              description,
              status,
              priority,
              due_date,
              created_at,
              created_by,
              assigned_to
            )
          `)
          .eq('token', token)
          .eq('is_active', true)
          .single();

        if (shareError) {
          if (shareError.code === 'PGRST116') {
            setError('Link não encontrado ou expirado');
          } else {
            throw shareError;
          }
          setLoading(false);
          return;
        }

        // Verificar se expirou
        if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
          setError('Este link expirou');
          setLoading(false);
          return;
        }

        setViewCount(shareData.view_count || 0);

        // Incrementar contador de visualizações
        await supabase.rpc('increment_share_view_count', { share_token: token });

        // Buscar nome do criador
        const taskData = shareData.tasks as any;
        let creatorName = 'Usuário';
        
        if (taskData?.created_by) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', taskData.created_by)
            .single();
          
          if (profileData?.full_name) {
            creatorName = profileData.full_name;
          }
        }

        // Buscar nomes dos assignees
        let assigneeNames: string[] = [];
        if (taskData?.assigned_to?.length > 0) {
          const { data: assigneeProfiles } = await supabase
            .from('profiles')
            .select('full_name')
            .in('id', taskData.assigned_to);
          
          if (assigneeProfiles) {
            assigneeNames = assigneeProfiles.map(p => p.full_name || 'Usuário');
          }
        }

        setTask({
          id: taskData.id,
          title: taskData.title,
          description: taskData.description || '',
          status: taskData.status,
          priority: taskData.priority,
          due_date: taskData.due_date,
          created_at: taskData.created_at,
          created_by_name: creatorName,
          assignees: assigneeNames,
        });

      } catch (err: any) {
        console.error('Erro ao carregar tarefa:', err);
        setError('Erro ao carregar tarefa compartilhada');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedTask();
  }, [token]);

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    todo: { label: 'A Fazer', color: 'bg-gray-500', icon: AlertCircle },
    in_progress: { label: 'Em Progresso', color: 'bg-blue-500', icon: Clock },
    done: { label: 'Concluída', color: 'bg-green-500', icon: CheckCircle2 },
  };

  const priorityConfig: Record<string, { label: string; color: string }> = {
    low: { label: 'Baixa', color: 'text-gray-500' },
    medium: { label: 'Média', color: 'text-yellow-500' },
    high: { label: 'Alta', color: 'text-orange-500' },
    urgent: { label: 'Urgente', color: 'text-red-500' },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600" />
          </div>
          <p className="text-gray-500 text-sm">Carregando tarefa...</p>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="size-8 text-red-500" />
          </div>
          <h1 className="text-xl font-semibold mb-2 dark:text-white">Link Indisponível</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error || 'Tarefa não encontrada'}</p>
          <a 
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ir para Isacar
            <ExternalLink className="size-4" />
          </a>
        </motion.div>
      </div>
    );
  }

  const status = statusConfig[task.status] || statusConfig.todo;
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Share2 className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Tarefa Compartilhada</h1>
              <p className="text-sm text-gray-500">{viewCount + 1} visualizações</p>
            </div>
          </div>
          <a 
            href="https://isacar.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            Powered by Isacar
            <ExternalLink className="size-3" />
          </a>
        </motion.div>

        {/* Task Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Status Bar */}
          <div className={`h-1 ${status.color}`} />
          
          <div className="p-6 md:p-8">
            {/* Title */}
            <div className="flex items-start gap-4 mb-6">
              <div className={`w-10 h-10 rounded-xl ${status.color} bg-opacity-20 flex items-center justify-center flex-shrink-0`}>
                <StatusIcon className={`size-5 ${status.color.replace('bg-', 'text-')}`} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{task.title}</h2>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1">
                    <StatusIcon className="size-3" />
                    {status.label}
                  </Badge>
                  <Badge variant="outline" className={`gap-1 ${priority.color}`}>
                    <Flag className="size-3" />
                    {priority.label}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Descrição</h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{task.description}</p>
              </div>
            )}

            {/* Meta Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Due Date */}
              {task.due_date && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <Calendar className="size-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Data de Entrega</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {format(new Date(task.due_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}

              {/* Created By */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <User className="size-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Criada por</p>
                  <p className="font-medium text-gray-900 dark:text-white">{task.created_by_name}</p>
                </div>
              </div>

              {/* Assignees */}
              {task.assignees.length > 0 && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="flex -space-x-2">
                    {task.assignees.slice(0, 3).map((name, idx) => (
                      <Avatar key={idx} className="size-8 border-2 border-white dark:border-gray-800">
                        <AvatarFallback className="text-xs bg-blue-500 text-white">
                          {name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Responsáveis</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {task.assignees.join(', ')}
                    </p>
                  </div>
                </div>
              )}

              {/* Created At */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <Clock className="size-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Criada em</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {format(new Date(task.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 md:px-8 py-4 bg-gray-50 dark:bg-gray-700/30 border-t dark:border-gray-700">
            <p className="text-sm text-gray-500 text-center">
              Esta é uma visualização somente leitura. 
              <a href="https://isacar.dev" className="text-blue-600 hover:underline ml-1">
                Crie sua conta no Isacar
              </a> para gerenciar suas tarefas.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
