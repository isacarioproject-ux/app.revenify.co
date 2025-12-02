import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard-layout';
import { TaskModal } from '@/components/tasks/task-modal';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function TaskViewPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [taskExists, setTaskExists] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkTask = async () => {
      if (!taskId) {
        setError('ID da tarefa não fornecido');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('tasks')
          .select('id')
          .eq('id', taskId)
          .single();

        if (fetchError) throw fetchError;

        if (data) {
          setTaskExists(true);
        }
      } catch (err: any) {
        console.error('Erro ao buscar tarefa:', err);
        setError(err.message || 'Erro ao carregar tarefa');
      } finally {
        setLoading(false);
      }
    };

    checkTask();
  }, [taskId]);

  const handleClose = () => {
    navigate('/meu-trabalho');
  };

  const handleUpdate = () => {
    // Não precisa fazer nada, o modal já atualiza
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="size-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !taskExists) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-4">
          <div className="text-red-500 text-lg">❌ {error || 'Tarefa não encontrada'}</div>
          <button 
            onClick={() => navigate('/meu-trabalho')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Voltar para Tarefas
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <TaskModal
        taskId={taskId || null}
        open={true}
        onClose={handleClose}
        onUpdate={handleUpdate}
      />
    </DashboardLayout>
  );
}
