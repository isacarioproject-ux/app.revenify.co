/**
 * Helper de Notificações do Navegador
 * 
 * Funções utilitárias para gerenciar permissões de notificação
 * de forma segura e com boa UX.
 * 
 * REGRAS:
 * - Nunca pedir permissão automaticamente
 * - Sempre explicar o motivo antes de pedir
 * - Tratar navegadores sem suporte
 */

// Tipos
export type NotificationPermissionResult = 'granted' | 'denied' | 'default' | 'unsupported'

// Storage key para evitar pedir múltiplas vezes
const NOTIFICATION_ASKED_KEY = 'isacar_notification_permission_asked'

/**
 * Verifica se o navegador suporta Notification API
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

/**
 * Retorna o status atual da permissão de notificação
 */
export function getNotificationPermission(): NotificationPermissionResult {
  if (!isNotificationSupported()) {
    return 'unsupported'
  }
  return Notification.permission as NotificationPermissionResult
}

/**
 * Verifica se já pedimos permissão antes (evitar spam)
 */
export function hasAskedPermissionBefore(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(NOTIFICATION_ASKED_KEY) === 'true'
}

/**
 * Marca que já pedimos permissão
 */
function markPermissionAsked(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(NOTIFICATION_ASKED_KEY, 'true')
  }
}

/**
 * Pede permissão de notificação com UX amigável
 * 
 * IMPORTANTE: Só chamar após ação explícita do usuário (ex: clique em toggle)
 * 
 * @returns Promise com resultado: 'granted', 'denied', ou 'unsupported'
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionResult> {
  // Verificar suporte
  if (!isNotificationSupported()) {
    console.warn('[Notifications] Browser does not support Notification API')
    return 'unsupported'
  }

  // Se já temos permissão, retornar direto
  const currentPermission = Notification.permission
  if (currentPermission === 'granted') {
    return 'granted'
  }

  // Se já foi negado, não podemos pedir de novo (browser bloqueia)
  if (currentPermission === 'denied') {
    console.warn('[Notifications] Permission was previously denied by user')
    return 'denied'
  }

  // Pedir permissão (só funciona se status é 'default')
  try {
    markPermissionAsked()
    const result = await Notification.requestPermission()
    console.log('[Notifications] Permission result:', result)
    return result as NotificationPermissionResult
  } catch (error) {
    console.error('[Notifications] Error requesting permission:', error)
    return 'denied'
  }
}

/**
 * Envia uma notificação (se permitido)
 * 
 * @param title Título da notificação
 * @param options Opções adicionais (body, icon, etc)
 * @returns true se enviou, false se não pôde enviar
 */
export function sendNotification(
  title: string,
  options?: NotificationOptions
): boolean {
  if (!isNotificationSupported()) {
    return false
  }

  if (Notification.permission !== 'granted') {
    console.warn('[Notifications] Cannot send notification: permission not granted')
    return false
  }

  try {
    const notification = new Notification(title, {
      icon: '/icons/icon-192x192.png', // Ícone do app
      badge: '/icons/icon-72x72.png',
      ...options,
    })

    // Auto-fechar após 5 segundos
    setTimeout(() => notification.close(), 5000)

    return true
  } catch (error) {
    console.error('[Notifications] Error sending notification:', error)
    return false
  }
}

/**
 * Envia uma notificação de lembrete de tarefa
 */
export function sendTaskReminderNotification(
  taskTitle: string,
  taskDescription?: string
): boolean {
  return sendNotification(`📋 Lembrete: ${taskTitle}`, {
    body: taskDescription || 'Você tem uma tarefa pendente!',
    tag: 'task-reminder', // Evita duplicatas
    requireInteraction: false,
  })
}
