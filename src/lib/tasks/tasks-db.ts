import { supabase } from '@/lib/supabase';
import { Task, TaskWithDetails, Comment, Activity, User, CustomField, Checklist, Attachment, TaskLink } from '@/types/tasks';

// =====================================================
// HELPER: Converter DB Task para Task do Frontend
// =====================================================

function dbTaskToTask(dbTask: any): Task {
  return {
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description || '',
    status: dbTask.status,
    priority: dbTask.priority,
    due_date: dbTask.due_date,
    start_date: dbTask.start_date,
    created_at: dbTask.created_at,
    completed_at: dbTask.completed_at,
    assignee_ids: dbTask.assigned_to || [],
    created_by: dbTask.created_by, // ✅ Corrigido: usar created_by consistentemente
    tag_ids: dbTask.labels || [],
    project_id: dbTask.project_id,
    finance_document_id: dbTask.finance_document_id || null, // ✨ Vinculação com finance
    list_id: null, // Não existe na tabela atual
    parent_task_id: dbTask.parent_task_id,
    custom_fields: dbTask.custom_fields ? Object.entries(dbTask.custom_fields).map(([key, value]: [string, any]) => ({
      id: key,
      name: key,
      type: 'text',
      value: value,
    })) : [],
  };
}

// =====================================================
// WORKSPACE & USER
// =====================================================

export async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Usuário não autenticado');
  return user.id;
}

export async function getCurrentWorkspaceId(): Promise<string | null> {
  // Buscar workspace ativo do localStorage
  const savedWorkspaceId = localStorage.getItem('currentWorkspaceId');
  
  // Se for 'null' (string), retornar null (modo Pessoal)
  if (savedWorkspaceId === 'null') {
    return null;
  }
  
  // Se tiver um ID válido, retornar
  if (savedWorkspaceId) {
    return savedWorkspaceId;
  }
  
  // Se não tiver no localStorage, buscar o primeiro workspace do usuário
  const userId = await getCurrentUserId();
  
  const { data, error } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .single();

  // Se não encontrar workspace, retornar null (modo Pessoal)
  if (error || !data) {
    localStorage.setItem('currentWorkspaceId', 'null');
    return null;
  }

  // Salvar no localStorage para próximas chamadas
  localStorage.setItem('currentWorkspaceId', data.workspace_id);

  return data.workspace_id;
}

export async function getUsers(): Promise<User[]> {
  const workspaceId = await getCurrentWorkspaceId();
  
  // Modo Pessoal: retornar apenas o usuário atual
  if (!workspaceId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single();
    
    return [{
      id: user.id,
      name: profile?.full_name || user.email?.split('@')[0] || 'Eu',
      email: user.email || '',
      avatar: profile?.avatar_url,
    }];
  }
  
  // Modo Workspace: buscar membros do workspace
  const { data, error } = await supabase
    .from('workspace_members')
    .select(`
      user_id,
      profiles:user_id (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('workspace_id', workspaceId);

  if (error) throw error;

  return data.map((member: any) => ({
    id: member.user_id,
    name: member.profiles?.full_name || 'Usuário',
    email: '', // Email não está disponível em profiles
    avatar: member.profiles?.avatar_url,
  }));
}

// =====================================================
// TASKS
// =====================================================

export async function getTasks(): Promise<Task[]> {
  const workspaceId = await getCurrentWorkspaceId();

  let query = supabase
    .from('tasks')
    .select('*');

  // Se workspaceId for null (modo Pessoal), buscar tasks sem workspace
  if (workspaceId === null) {
    query = query.is('workspace_id', null);
  } else {
    query = query.eq('workspace_id', workspaceId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(dbTaskToTask);
}

export async function getTaskById(id: string): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return dbTaskToTask(data);
}

export async function getTaskWithDetails(id: string): Promise<TaskWithDetails | null> {
  const task = await getTaskById(id);
  if (!task) return null;

  // Buscar subtarefas
  const { data: subtasksData } = await supabase
    .from('tasks')
    .select('*')
    .eq('parent_task_id', id);

  const subtasks = subtasksData ? subtasksData.map(dbTaskToTask) : [];

  // Buscar checklists
  const { data: checklistsData } = await supabase
    .from('task_checklists')
    .select('*')
    .eq('task_id', id)
    .order('position');

  const checklists: Checklist[] = checklistsData ? checklistsData.map((cl: any) => ({
    id: cl.id,
    title: cl.title,
    items: cl.items || [],
  })) : [];

  // Buscar attachments
  const { data: attachmentsData } = await supabase
    .from('task_attachments')
    .select('*')
    .eq('task_id', id)
    .order('created_at', { ascending: false });

  const attachments: Attachment[] = attachmentsData ? attachmentsData.map((att: any) => ({
    id: att.id,
    name: att.file_name,
    url: att.file_url,
    type: att.file_type || '',
    size: att.file_size || 0,
    uploaded_at: att.created_at,
  })) : [];

  // Buscar comments
  const { data: commentsData } = await supabase
    .from('task_comments')
    .select(`
      *,
      profiles:user_id (
        full_name
      )
    `)
    .eq('task_id', id)
    .order('created_at', { ascending: false });

  const comments: Comment[] = commentsData ? commentsData.map((c: any) => ({
    id: c.id,
    task_id: c.task_id,
    user_id: c.user_id,
    user_name: c.profiles?.full_name || 'Usuário',
    text: c.content,
    created_at: c.created_at,
    mentions: c.mentions || [],
  })) : [];

  // Buscar activities
  const { data: activitiesData } = await supabase
    .from('task_activities')
    .select(`
      *,
      profiles:user_id (
        full_name
      )
    `)
    .eq('task_id', id)
    .order('created_at', { ascending: false });

  // Função para formatar detalhes de atividades de forma legível
  const formatActivityDetails = (action: string, changes: any): string => {
    // Se não tem changes, usar mensagem padrão baseada na ação
    if (!changes) {
      const defaultMessages: Record<string, string> = {
        'created': 'criou a tarefa',
        'updated': 'atualizou a tarefa',
        'deleted': 'excluiu a tarefa',
        'commented': 'comentou',
        'link_added': 'adicionou um link',
      };
      return defaultMessages[action] || 'realizou uma alteração';
    }

    // Se tem changes (JSONB), formatar baseado na ação
    try {
      const changesObj = typeof changes === 'string' ? JSON.parse(changes) : changes;
      
      // Se changes é um objeto muito grande (contém toda a tarefa), extrair apenas mudanças relevantes
      if (changesObj.title && changesObj.status && changesObj.priority && changesObj.assigned_to) {
        // É um objeto completo da tarefa, não apenas mudanças
        // Extrair apenas o que mudou comparando com valores anteriores (se disponível)
        const changesList: string[] = [];
        
        // Verificar mudanças específicas
        if (changesObj.status) {
          const statusLabels: Record<string, string> = {
            'todo': 'A fazer',
            'in_progress': 'Em progresso',
            'review': 'Em revisão',
            'done': 'Concluída'
          };
          changesList.push(`status: ${statusLabels[changesObj.status] || changesObj.status}`);
        }
        if (changesObj.priority) {
          const priorityLabels: Record<string, string> = {
            'low': 'Baixa',
            'medium': 'Normal',
            'high': 'Alta',
            'urgent': 'Urgente'
          };
          changesList.push(`prioridade: ${priorityLabels[changesObj.priority] || changesObj.priority}`);
        }
        if (changesObj.due_date) {
          changesList.push('data de vencimento');
        }
        if (changesObj.assigned_to && Array.isArray(changesObj.assigned_to)) {
          changesList.push('responsáveis');
        }
        if (changesObj.labels && Array.isArray(changesObj.labels) && changesObj.labels.length > 0) {
          changesList.push('etiquetas');
        }
        if (changesObj.title) {
          changesList.push('título');
        }
        if (changesObj.description !== undefined) {
          changesList.push('descrição');
        }
        
        return changesList.length > 0 
          ? `atualizou ${changesList.slice(0, 3).join(', ')}${changesList.length > 3 ? '...' : ''}`
          : 'atualizou a tarefa';
      }
      
      // Se é um objeto de mudanças específico, formatar baseado na ação
      switch (action) {
        case 'created':
          return 'criou a tarefa';
        case 'status_changed':
          const status = changesObj.status || changesObj.new_status;
          const statusLabels: Record<string, string> = {
            'todo': 'A fazer',
            'in_progress': 'Em progresso',
            'review': 'Em revisão',
            'done': 'Concluída'
          };
          return `alterou o status para ${statusLabels[status] || status}`;
        case 'priority_changed':
          const priority = changesObj.priority || changesObj.new_priority;
          const priorityLabels: Record<string, string> = {
            'low': 'Baixa',
            'medium': 'Normal',
            'high': 'Alta',
            'urgent': 'Urgente'
          };
          return `definiu a prioridade como ${priorityLabels[priority] || priority}`;
        case 'commented':
          return 'comentou';
        case 'link_added':
          const linkTitle = changesObj.link || changesObj.title || 'um link';
          return `adicionou ${linkTitle}`;
        case 'assignee_changed':
          return 'alterou os responsáveis';
        case 'title_changed':
          return 'alterou o título';
        case 'description_changed':
          return 'alterou a descrição';
        case 'due_date_changed':
          return 'alterou a data de vencimento';
        case 'updated':
          // Para updated, tentar extrair informações úteis
          const updates: string[] = [];
          if (changesObj.status) {
            const statusLabels: Record<string, string> = {
              'todo': 'A fazer',
              'in_progress': 'Em progresso',
              'review': 'Em revisão',
              'done': 'Concluída'
            };
            updates.push(`status: ${statusLabels[changesObj.status] || changesObj.status}`);
          }
          if (changesObj.priority) {
            const priorityLabels: Record<string, string> = {
              'low': 'Baixa',
              'medium': 'Normal',
              'high': 'Alta',
              'urgent': 'Urgente'
            };
            updates.push(`prioridade: ${priorityLabels[changesObj.priority] || changesObj.priority}`);
          }
          if (changesObj.due_date) updates.push('data');
          if (changesObj.assigned_to) updates.push('responsáveis');
          if (changesObj.labels) updates.push('etiquetas');
          if (changesObj.title) updates.push('título');
          if (changesObj.description !== undefined) updates.push('descrição');
          
          return updates.length > 0 
            ? `atualizou ${updates.slice(0, 3).join(', ')}${updates.length > 3 ? '...' : ''}`
            : 'atualizou a tarefa';
        default:
          return 'realizou uma alteração';
      }
    } catch {
      // Se não conseguir parsear, retornar mensagem padrão
      return 'realizou uma alteração';
    }
  };

  const activities: Activity[] = activitiesData ? activitiesData.map((a: any) => ({
    id: a.id,
    task_id: a.task_id,
    user_id: a.user_id,
    user_name: a.profiles?.full_name || 'Usuário',
    action: a.action,
    details: formatActivityDetails(a.action, a.changes),
    created_at: a.created_at,
  })) : [];

  // Buscar links
  const links = await getTaskLinks(id);

  return {
    ...task,
    subtasks,
    checklists,
    attachments,
    comments,
    activities,
    links,
  };
}

export async function createTask(task: Omit<Task, 'id' | 'created_at'>): Promise<Task> {
  const userId = await getCurrentUserId();
  const workspaceId = await getCurrentWorkspaceId();

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      workspace_id: workspaceId,
      created_by: userId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      start_date: task.start_date,
      due_date: task.due_date,
      parent_task_id: task.parent_task_id,
      finance_document_id: task.finance_document_id || null, // ✨ Vinculação com finance
      assigned_to: task.assignee_ids,
      labels: task.tag_ids,
      custom_fields: task.custom_fields.reduce((acc: any, field) => {
        acc[field.name] = field.value;
        return acc;
      }, {}),
    })
    .select()
    .single();

  if (error) throw error;

  // Atividade será registrada automaticamente pelo trigger log_task_activity()
  // Não precisa inserir manualmente aqui

  return dbTaskToTask(data);
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  const userId = await getCurrentUserId();

  const updateData: any = {};
  
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.priority !== undefined) updateData.priority = updates.priority;
  if (updates.start_date !== undefined) updateData.start_date = updates.start_date;
  if (updates.due_date !== undefined) updateData.due_date = updates.due_date;
  if (updates.finance_document_id !== undefined) updateData.finance_document_id = updates.finance_document_id; // ✨ Vinculação com finance
  if (updates.assignee_ids !== undefined) updateData.assigned_to = updates.assignee_ids;
  if (updates.tag_ids !== undefined) updateData.labels = updates.tag_ids;
  if (updates.completed_at !== undefined) updateData.completed_at = updates.completed_at;
  
  if (updates.custom_fields !== undefined) {
    updateData.custom_fields = updates.custom_fields.reduce((acc: any, field) => {
      acc[field.name] = field.value;
      return acc;
    }, {});
  }

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Não inserir atividade manualmente aqui
  // O trigger log_task_activity() já registra mudanças de status e priority automaticamente
  // Para outras mudanças, podemos adicionar lógica específica se necessário

  return dbTaskToTask(data);
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// =====================================================
// COMMENTS
// =====================================================

export async function addComment(taskId: string, text: string, mentions: string[] = []): Promise<Comment> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('task_comments')
    .insert({
      task_id: taskId,
      user_id: userId,
      content: text,
      mentions,
    })
    .select(`
      *,
      profiles:user_id (
        full_name
      )
    `)
    .single();

  if (error) throw error;

  // Registrar atividade (comentários são mostrados separadamente, não precisa de atividade)

  return {
    id: data.id,
    task_id: data.task_id,
    user_id: data.user_id,
    user_name: data.profiles?.full_name || 'Você',
    text: data.content,
    created_at: data.created_at,
    mentions: data.mentions || [],
  };
}

// =====================================================
// LINKS
// =====================================================

export async function getTaskLinks(taskId: string): Promise<TaskLink[]> {
  const { data, error } = await supabase
    .from('task_links')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map((link: any) => ({
    id: link.id,
    task_id: link.task_id,
    url: link.url,
    title: link.title,
    description: link.description,
    favicon_url: link.favicon_url,
    created_by: link.created_by,
    created_at: link.created_at,
    updated_at: link.updated_at,
  }));
}

export async function addTaskLink(taskId: string, url: string, title?: string, description?: string): Promise<TaskLink> {
  const userId = await getCurrentUserId();

  // Tentar obter metadata da URL (opcional, pode ser feito no frontend)
  const { data, error } = await supabase
    .from('task_links')
    .insert({
      task_id: taskId,
      url,
      title: title || url,
      description,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;

  // Registrar atividade
  await supabase.from('task_activities').insert({
    task_id: taskId,
    user_id: userId,
    action: 'link_added',
    details: `adicionou link: ${title || url}`,
  });

  return {
    id: data.id,
    task_id: data.task_id,
    url: data.url,
    title: data.title,
    description: data.description,
    favicon_url: data.favicon_url,
    created_by: data.created_by,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function deleteTaskLink(linkId: string): Promise<void> {
  const { error } = await supabase
    .from('task_links')
    .delete()
    .eq('id', linkId);

  if (error) throw error;
}
