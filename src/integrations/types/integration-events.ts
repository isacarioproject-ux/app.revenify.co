/**
 * TIPOS DOS EVENTOS DE INTEGRAÇÃO
 */

// Eventos do Whiteboard
export interface WhiteboardActionItemCreatedEvent {
  whiteboardId: string;
  elementId: string;
  content: string;
  metadata?: {
    cost?: number;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    dueDate?: string;
    assignee?: string;
  };
}

export interface WhiteboardMetaItemCreatedEvent {
  whiteboardId: string;
  elementId: string;
  goalName: string;
  targetAmount: number;
  category?: string;
  deadline?: string;
}

// Eventos de Tasks
export interface TaskCreatedEvent {
  taskId: string;
  title: string;
  cost?: number;
  linkedTo?: string; // whiteboardId ou outro ID
  source: 'manual' | 'whiteboard' | 'integration';
}

export interface TaskCompletedEvent {
  taskId: string;
  title: string;
  cost?: number;
  completedAt: string;
}

// Eventos de Finance
export interface ExpenseCreatedEvent {
  expenseId: string;
  category: string;
  amount: number;
  linkedTask?: string;
  linkedWhiteboard?: string;
  source: 'manual' | 'task' | 'whiteboard';
}

// Eventos de Gerenciador
export interface GoalCreatedEvent {
  goalId: string;
  name: string;
  targetAmount: number;
  linkedWhiteboard?: string;
  source: 'manual' | 'whiteboard';
}

// Mapa de todos os eventos
export type IntegrationEvents = {
  // Whiteboard
  'whiteboard.action-item.created': WhiteboardActionItemCreatedEvent;
  'whiteboard.meta-item.created': WhiteboardMetaItemCreatedEvent;
  'whiteboard.element.updated': { elementId: string; updates: any };
  'whiteboard.element.deleted': { elementId: string };

  // Tasks
  'task.created': TaskCreatedEvent;
  'task.completed': TaskCompletedEvent;
  'task.updated': { taskId: string; updates: any };
  'task.deleted': { taskId: string };

  // Finance
  'finance.expense.created': ExpenseCreatedEvent;
  'finance.income.created': { amount: number; source: string };

  // Gerenciador
  'gerenciador.goal.created': GoalCreatedEvent;
  'gerenciador.expense.created': { amount: number; category: string };

  // Cross-module
  'sync.update': { moduleId: string; entityId: string; updates: any };
};
