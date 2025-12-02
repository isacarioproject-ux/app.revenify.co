import { Task, TaskWithDetails, Comment, Activity, User } from '@/types/tasks';

const STORAGE_KEYS = {
  TASKS: 'tasks_data',
  COMMENTS: 'tasks_comments',
  ACTIVITIES: 'tasks_activities',
  USERS: 'tasks_users',
  CURRENT_USER: 'current_user_id',
};

// Current user ID (simulando autenticação)
export const getCurrentUserId = (): string => {
  let userId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (!userId) {
    userId = 'user-1'; // Default user
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, userId);
  }
  return userId;
};

// Users
export const getUsers = (): User[] => {
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : [];
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

// Tasks
export const getTasks = (): Task[] => {
  const data = localStorage.getItem(STORAGE_KEYS.TASKS);
  return data ? JSON.parse(data) : [];
};

export const saveTasks = (tasks: Task[]) => {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
};

export const getTaskById = (id: string): Task | undefined => {
  const tasks = getTasks();
  return tasks.find(task => task.id === id);
};

export const getTaskWithDetails = (id: string): TaskWithDetails | undefined => {
  const task = getTaskById(id);
  if (!task) return undefined;

  const allTasks = getTasks();
  const subtasks = allTasks.filter(t => t.parent_task_id === id);
  const comments = getComments().filter(c => c.task_id === id);
  const activities = getActivities().filter(a => a.task_id === id);

  return {
    ...task,
    subtasks,
    checklists: [], // Would be stored separately in a real app
    attachments: [], // Would be stored separately in a real app
    comments,
    activities,
  };
};

export const createTask = (task: Task): Task => {
  const tasks = getTasks();
  tasks.push(task);
  saveTasks(tasks);
  
  // Log activity
  logActivity({
    id: `activity-${Date.now()}`,
    task_id: task.id,
    user_id: getCurrentUserId(),
    user_name: 'Você',
    action: 'created',
    details: `criou a tarefa`,
    created_at: new Date().toISOString(),
  });
  
  return task;
};

export const updateTask = (id: string, updates: Partial<Task>): Task | undefined => {
  const tasks = getTasks();
  const index = tasks.findIndex(task => task.id === id);
  
  if (index === -1) return undefined;
  
  const oldTask = tasks[index];
  const updatedTask = { ...oldTask, ...updates };
  tasks[index] = updatedTask;
  saveTasks(tasks);
  
  // Log activity for significant changes
  const userId = getCurrentUserId();
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

export const deleteTask = (id: string): boolean => {
  const tasks = getTasks();
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

export const addComment = (comment: Comment): Comment => {
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