/**
 * INICIALIZADOR CENTRAL DE INTEGRAÇÕES
 * 
 * Importe este arquivo UMA VEZ no App.tsx
 */

// import { initWhiteboardToTasks } from './handlers/whiteboard-to-tasks';
// import { initWhiteboardToGerenciador } from './handlers/whiteboard-to-gerenciador';
import { initTasksToFinance } from './handlers/tasks-to-finance';
import { INTEGRATION_CONFIG } from './config';

let initialized = false;

/**
 * Inicializar TODAS as integrações
 * Chame esta função uma vez no App.tsx
 */
export function initIntegrations() {
  // Evitar inicializar múltiplas vezes
  if (initialized) {
    console.warn('[Integrations] Already initialized, skipping...');
    return;
  }

  if (!INTEGRATION_CONFIG.ENABLED) {
    console.log('[Integrations] System DISABLED via config');
    return;
  }

  console.log('[Integrations] Initializing...');

  // Inicializar cada integração
  // initWhiteboardToTasks();
  // initWhiteboardToGerenciador();
  initTasksToFinance();

  initialized = true;
  console.log('[Integrations] ✅ All integrations initialized!');
}

/**
 * Exportar para uso externo
 */
export { eventBus } from '@/lib/event-bus';
export { tasksAdapter } from './adapters/tasks-adapter';
export { gerenciadorAdapter } from './adapters/gerenciador-adapter';
export { INTEGRATION_CONFIG, isIntegrationEnabled } from './config';
export type * from './types/integration-events';
