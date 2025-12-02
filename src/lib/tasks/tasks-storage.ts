import { Task, TaskWithDetails, Comment, Activity, User } from '@/types/tasks';
import * as TasksDB from './tasks-db';

const STORAGE_KEYS = {
  TASKS: 'tasks_data',
  COMMENTS: 'tasks_comments',
  ACTIVITIES: 'tasks_activities',
  USERS: 'tasks_users',
  CURRENT_USER: 'current_user_id',
};

// SEMPRE usar Supabase - removido sistema de fallback
const shouldUseSupabase = (): boolean => {
  return true;
};

// Current user ID
export const getCurrentUserId = async (): Promise<string> => {
  if (shouldUseSupabase()) {
    try {
      return await TasksDB.getCurrentUserId();
    } catch (error) {
      console.error('Error getting user from Supabase:', error);
    }
  }
  
  // Fallback para localStorage
  let userId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (!userId) {
    userId = 'user-1'; // Default user
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, userId);
  }
  return userId;
};

// Users
export const getUsers = async (): Promise<User[]> => {
  if (shouldUseSupabase()) {
    try {
      return await TasksDB.getUsers();
    } catch (error) {
      console.error('Error getting users from Supabase:', error);
    }
  }
  
  // Fallback para localStorage
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : [];
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

// Tasks
export const getTasks = async (): Promise<Task[]> => {
  if (shouldUseSupabase()) {
    try {
      return await TasksDB.getTasks();
    } catch (error) {
      console.error('Error getting tasks from Supabase:', error);
    }
  }
  
  // Fallback para localStorage
  const data = localStorage.getItem(STORAGE_KEYS.TASKS);
  return data ? JSON.parse(data) : [];
};

export const saveTasks = (tasks: Task[]) => {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
};

export const getTaskById = async (id: string): Promise<Task | undefined> => {
  if (shouldUseSupabase()) {
    try {
      const task = await TasksDB.getTaskById(id);
      return task || undefined;
    } catch (error: any) {
      // Se for erro 400 (not found), não logar - é esperado
      if (error?.code !== 'PGRST116') {
        console.error('Error getting task from Supabase:', error);
      }
      return undefined;
    }
  }
  
  // Fallback para localStorage
  const tasks = await getTasks();
  return tasks.find(task => task.id === id);
};

export const getTaskWithDetails = async (id: string): Promise<TaskWithDetails | undefined> => {
  if (shouldUseSupabase()) {
    try {
      const task = await TasksDB.getTaskWithDetails(id);
      return task || undefined;
    } catch (error: any) {
      // Se for erro 400 (not found), não logar - é esperado
      if (error?.code !== 'PGRST116') {
        console.error('Error getting task details from Supabase:', error);
      }
      return undefined;
    }
  }
  
  // Fallback para localStorage
  const task = await getTaskById(id);
  if (!task) return undefined;

  const allTasks = await getTasks();
  const subtasks = allTasks.filter(t => t.parent_task_id === id);
  const comments = getComments().filter(c => c.task_id === id);
  const activities = getActivities().filter(a => a.task_id === id);

  return {
    ...task,
    subtasks,
    checklists: [],
    attachments: [],
    comments,
    activities,
    links: [],
  };
};

export const createTask = async (task: Partial<Task>): Promise<Task> => {
  if (shouldUseSupabase()) {
    try {
      // Remover campos que não devem ser enviados para o insert
      const { id, created_at, location, workspace, ...taskData } = task;
      const createdTask = await TasksDB.createTask(taskData as any);
      console.log('✅ Task criada no Supabase:', createdTask);
      return createdTask;
    } catch (error: any) {
      console.error('❌ Erro ao criar task no Supabase:', error);
      
      // Mensagem de erro mais amigável
      if (error?.message?.includes('workspace')) {
        throw new Error('Por favor, selecione um workspace antes de criar uma tarefa.');
      }
      
      throw error;
    }
  }
  
  // Fallback para localStorage
  const userId = await getCurrentUserId();
  const fullTask: Task = {
    id: task.id || `task-${Date.now()}`,
    created_at: task.created_at || new Date().toISOString(),
    created_by: task.created_by || userId,
    ...task,
  } as Task;
  
  const tasks = await getTasks();
  tasks.push(fullTask);
  saveTasks(tasks);
  
  // Log activity (reutilizar userId já declarado)
  logActivity({
    id: `activity-${Date.now()}`,
    task_id: fullTask.id,
    user_id: userId,
    user_name: 'Você',
    action: 'created',
    details: `criou a tarefa`,
    created_at: new Date().toISOString(),
  });
  
  return fullTask;
};

export const updateTask = async (id: string, updates: Partial<Task>): Promise<Task | undefined> => {
  if (shouldUseSupabase()) {
    try {
      return await TasksDB.updateTask(id, updates);
    } catch (error) {
      console.error('Error updating task in Supabase:', error);
    }
  }
  
  // Fallback para localStorage
  const tasks = await getTasks();
  const index = tasks.findIndex(task => task.id === id);
  
  if (index === -1) return undefined;
  
  const oldTask = tasks[index];
  const updatedTask = { ...oldTask, ...updates };
  tasks[index] = updatedTask;
  saveTasks(tasks);
  
  // Log activity for significant changes
  const userId = await getCurrentUserId();
  const userName = 'Você';
  
  if (updates.status && updates.status !== oldTask.status) {
    logActivity({
      id: `activity-${Date.now()}-status`,
      task_id: id,
      user_id: userId,
      user_name: userName,
      action: 'status_changed',
      details: `alterou o status para ${getStatusLabel(updates.status)}`,
      created_at: new Date().toISOString(),
    });
  }
  
  if (updates.priority && updates.priority !== oldTask.priority) {
    logActivity({
      id: `activity-${Date.now()}-priority`,
      task_id: id,
      user_id: userId,
      user_name: userName,
      action: 'priority_changed',
      details: `definiu a prioridade como ${getPriorityLabel(updates.priority)}`,
      created_at: new Date().toISOString(),
    });
  }
  
  if (updates.assignee_ids && JSON.stringify(updates.assignee_ids) !== JSON.stringify(oldTask.assignee_ids)) {
    logActivity({
      id: `activity-${Date.now()}-assignee`,
      task_id: id,
      user_id: userId,
      user_name: userName,
      action: 'assignee_changed',
      details: `alterou os responsáveis`,
      created_at: new Date().toISOString(),
    });
  }
  
  return updatedTask;
};

export const deleteTask = async (id: string): Promise<boolean> => {
  if (shouldUseSupabase()) {
    try {
      await TasksDB.deleteTask(id);
      return true;
    } catch (error) {
      console.error('Error deleting task from Supabase:', error);
      return false;
    }
  }
  
  // Fallback para localStorage
  const tasks = await getTasks();
  const filtered = tasks.filter(task => task.id !== id && task.parent_task_id !== id);
  saveTasks(filtered);
  return true;
};

// Comments
export const getComments = (): Comment[] => {
  const data = localStorage.getItem(STORAGE_KEYS.COMMENTS);
  return data ? JSON.parse(data) : [];
};

export const saveComments = (comments: Comment[]) => {
  localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
};

export const addComment = async (comment: Comment): Promise<Comment> => {
  if (shouldUseSupabase()) {
    try {
      const newComment = await TasksDB.addComment(comment.task_id, comment.text, comment.mentions);
      logActivity({
        id: `activity-${Date.now()}`,
        task_id: newComment.task_id,
        user_id: newComment.user_id,
        user_name: newComment.user_name,
        action: 'commented',
        details: `comentou`,
        created_at: newComment.created_at,
      });
      return newComment;
    } catch (error) {
      console.error('Error adding comment in Supabase:', error);
    }
  }
  
  // Fallback para localStorage
  const comments = getComments();
  comments.push(comment);
  saveComments(comments);
  logActivity({
    id: `activity-${Date.now()}`,
    task_id: comment.task_id,
    user_id: comment.user_id,
    user_name: comment.user_name,
    action: 'commented',
    details: `comentou`,
    created_at: comment.created_at,
  });
  
  return comment;
};

// Activities
export const getActivities = (): Activity[] => {
  const data = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
  return data ? JSON.parse(data) : [];
};

export const saveActivities = (activities: Activity[]) => {
  localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
};

export const logActivity = (activity: Activity) => {
  const activities = getActivities();
  activities.push(activity);
  saveActivities(activities);
};

// =====================================================
// LINKS
// =====================================================

export const addTaskLink = async (taskId: string, url: string, title?: string, description?: string) => {
  if (shouldUseSupabase()) {
    try {
      return await TasksDB.addTaskLink(taskId, url, title, description);
    } catch (error) {
      console.error('Error adding link in Supabase:', error);
      throw error;
    }
  }
  
  // Fallback para localStorage (não implementado ainda)
  throw new Error('Links não suportados em modo offline');
};

export const deleteTaskLink = async (linkId: string) => {
  if (shouldUseSupabase()) {
    try {
      return await TasksDB.deleteTaskLink(linkId);
    } catch (error) {
      console.error('Error deleting link in Supabase:', error);
      throw error;
    }
  }
  
  // Fallback para localStorage (não implementado ainda)
  throw new Error('Links não suportados em modo offline');
};

// Helper functions
const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    todo: 'A fazer',
    in_progress: 'Em progresso',
    review: 'Em revisão',
    done: 'Concluído',
  };
  return labels[status] || status;
};

const getPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    urgent: 'Urgente',
  };
  return labels[priority] || priority;
};