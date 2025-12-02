import { useState, useEffect, useCallback } from 'react';
import { Task, TaskGroups, TaskTab } from '@/types/tasks';
import { getTasks, getCurrentUserId } from '@/lib/tasks/tasks-storage';

export function useTasksCard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<TaskTab>('pendente');
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([
    'hoje',
    'em_atraso',
    'proximo',
    'nao_programado',
  ]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const allTasks = await getTasks();
      setTasks(allTasks);
    } catch (error: any) {
      console.error('Error loading tasks:', error);
      
      // Se o erro for de workspace não encontrado, mostrar mensagem específica
      if (error?.message?.includes('workspace')) {
        console.warn('⚠️ Nenhum workspace ativo. As tasks não serão carregadas até que um workspace seja selecionado.');
      }
      
      // Continuar com array vazio para não quebrar a UI
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupName)
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    );
  };

  const isGroupExpanded = (groupName: string) => {
    return expandedGroups.includes(groupName);
  };

  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    getCurrentUserId().then(setUserId);
  }, []);

  const getFilteredTasks = useCallback((): Task[] | TaskGroups => {
    if (!userId) return { hoje: [], em_atraso: [], proximo: [], nao_programado: [] };
    
    const today = new Date().toISOString().split('T')[0];
    console.log('📊 Calculando grupos de tarefas. Data de hoje:', today);

    if (activeTab === 'feito') {
      // Aba Feito: tarefas concluídas
      return tasks
        .filter(
          task =>
            task.status === 'done' &&
            (task.assignee_ids.includes(userId) || task.created_by === userId)
        )
        .sort((a, b) => {
          const dateA = new Date(a.completed_at || a.created_at).getTime();
          const dateB = new Date(b.completed_at || b.created_at).getTime();
          return dateB - dateA; // Mais recentes primeiro
        });
    }

    if (activeTab === 'delegado') {
      // Aba Delegado: tarefas criadas por mim mas atribuídas a outros
      return tasks
        .filter(
          task =>
            task.created_by === userId &&
            !task.assignee_ids.includes(userId) &&
            task.status !== 'done'
        )
        .sort((a, b) => {
          const dateA = new Date(a.due_date || '9999-12-31').getTime();
          const dateB = new Date(b.due_date || '9999-12-31').getTime();
          return dateA - dateB;
        });
    }

    // Aba Pendente: agrupar por período
    const pendingTasks = tasks.filter(
      task =>
        task.status !== 'done' &&
        (task.assignee_ids.includes(userId) || task.created_by === userId)
    );

    const groups: TaskGroups = {
      hoje: [],
      em_atraso: [],
      proximo: [],
      nao_programado: [],
    };

    pendingTasks.forEach(task => {
      if (!task.due_date) {
        groups.nao_programado.push(task);
        console.log(`  📌 ${task.title} → Não programado (sem due_date)`);
      } else if (task.due_date < today) {
        groups.em_atraso.push(task);
        console.log(`  ⏰ ${task.title} → Em atraso (${task.due_date} < ${today})`);
      } else if (task.due_date === today) {
        groups.hoje.push(task);
        console.log(`  ✅ ${task.title} → Hoje (${task.due_date})`);
      } else {
        groups.proximo.push(task);
        console.log(`  📅 ${task.title} → Próximo (${task.due_date} > ${today})`);
      }
    });

    // Ordenar cada grupo por prioridade e data
    const sortByPriorityAndDate = (a: Task, b: Task) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff =
        priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      const dateA = new Date(a.due_date || '9999-12-31').getTime();
      const dateB = new Date(b.due_date || '9999-12-31').getTime();
      return dateA - dateB;
    };

    groups.hoje.sort(sortByPriorityAndDate);
    groups.em_atraso.sort(sortByPriorityAndDate);
    groups.proximo.sort(sortByPriorityAndDate);
    groups.nao_programado.sort(sortByPriorityAndDate);

    console.log('📊 Resultado dos grupos:', {
      hoje: groups.hoje.length,
      em_atraso: groups.em_atraso.length,
      proximo: groups.proximo.length,
      nao_programado: groups.nao_programado.length,
    });

    return groups;
  }, [tasks, activeTab, userId]); // ✨ Adicionar userId para recalcular quando mudar

  const refetch = useCallback(() => {
    loadTasks();
  }, [loadTasks]);

  return {
    tasks: getFilteredTasks(),
    activeTab,
    setActiveTab,
    loading,
    refetch,
    toggleGroup,
    isGroupExpanded,
  };
}