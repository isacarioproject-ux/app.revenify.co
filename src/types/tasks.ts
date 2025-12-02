export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskTab = 'pendente' | 'feito' | 'delegado' | 'lembretes';
export type TaskGroup = 'hoje' | 'em_atraso' | 'proximo' | 'nao_programado';

export interface User {
  id: string;
  name: string;
  avatar?: string;
  email: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface Checklist {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploaded_at: string;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  user_name: string;
  text: string;
  created_at: string;
  mentions: string[];
}

export interface Activity {
  id: string;
  task_id: string;
  user_id: string;
  user_name: string;
  action: string;
  details: string;
  created_at: string;
}

export interface TaskLink {
  id: string;
  task_id: string;
  url: string;
  title?: string;
  description?: string;
  favicon_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect';
  value: any;
  options?: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  start_date: string | null;
  created_at: string;
  completed_at: string | null;
  assignee_ids: string[];
  created_by: string; // ✅ Corrigido: usar created_by (consistente com o banco)
  tag_ids: string[];
  project_id: string | null;
  finance_document_id: string | null; // ✨ Vinculação com documentos financeiros
  list_id: string | null;
  parent_task_id: string | null;
  custom_fields: CustomField[];
  location?: string;
  workspace?: string;
}

export interface TaskWithDetails extends Task {
  subtasks: Task[];
  checklists: Checklist[];
  attachments: Attachment[];
  comments: Comment[];
  activities: Activity[];
  links?: TaskLink[];
}

export interface TaskGroups {
  hoje: Task[];
  em_atraso: Task[];
  proximo: Task[];
  nao_programado: Task[];
}

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'pessoal' | 'trabalho' | 'ti' | 'geral';
  task: Partial<Task> & {
    subtasks?: Partial<Task>[];
    checklists?: Checklist[];
  };
}
