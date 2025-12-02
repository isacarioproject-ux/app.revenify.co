// Serviço avançado de notificações para lembretes
// Suporta Browser Notifications API, Service Workers, e notificações offline

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  actions?: NotificationAction[];
  image?: string;
  dir?: 'auto' | 'ltr' | 'rtl';
  lang?: string;
  renotify?: boolean;
  timestamp?: number;
}

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

class ReminderNotificationService {
  private permission: NotificationPermission = 'default';
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private notificationCheckInterval: number | null = null;

  async initialize() {
    // Solicitar permissão de notificações
    if ('Notification' in window) {
      this.permission = Notification.permission;
      
      if (this.permission === 'default') {
        this.permission = await Notification.requestPermission();
      }
    }

    // Registrar service worker para notificações push e offline
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw-reminders.js', {
          scope: '/'
        });
        console.log('✅ Service Worker registrado para lembretes');
      } catch (error) {
        console.warn('⚠️ Service Worker não disponível:', error);
      }
    }

    // Iniciar verificação periódica de lembretes
    this.startPeriodicCheck();
  }

  async showNotification(options: NotificationOptions) {
    if (!('Notification' in window)) {
      console.warn('Este navegador não suporta notificações');
      return;
    }

    if (this.permission !== 'granted') {
      this.permission = await Notification.requestPermission();
    }

    if (this.permission !== 'granted') {
      console.warn('Permissão de notificação não concedida');
      return;
    }

    const notificationOptions: NotificationOptions = {
      requireInteraction: true,
      silent: false,
      vibrate: [200, 100, 200],
      badge: '/icon-192x192.png',
      icon: '/icon-192x192.png',
      tag: options.tag || 'reminder',
      ...options,
    };

    // Adicionar ações padrão se não especificadas
    if (!notificationOptions.actions || notificationOptions.actions.length === 0) {
      notificationOptions.actions = [
        {
          action: 'snooze',
          title: 'Adiar 10 min',
          icon: '/icons/snooze.png',
        },
        {
          action: 'complete',
          title: 'Concluir',
          icon: '/icons/check.png',
        },
      ];
    }

    try {
      if (this.serviceWorkerRegistration) {
        // Usar service worker para notificações persistentes
        await this.serviceWorkerRegistration.showNotification(
          options.title,
          notificationOptions as any
        );
      } else {
        // Fallback para notificação simples
        const notification = new Notification(options.title, notificationOptions as any);
        
        // Adicionar event listeners
        notification.onclick = (event) => {
          event.preventDefault();
          window.focus();
          if (options.data?.reminderId) {
            // Abrir página de lembretes ou modal
            window.dispatchEvent(new CustomEvent('reminder-clicked', { 
              detail: { reminderId: options.data.reminderId } 
            }));
          }
          notification.close();
        };
      }
    } catch (error) {
      console.error('Erro ao exibir notificação:', error);
    }
  }

  async scheduleNotification(
    reminderId: string,
    reminderDate: Date,
    options: NotificationOptions
  ) {
    const now = new Date();
    const delay = reminderDate.getTime() - now.getTime();

    if (delay <= 0) {
      // Se já passou, mostrar imediatamente
      await this.showNotification(options);
      return;
    }

    // Agendar notificação
    setTimeout(async () => {
      await this.showNotification({
        ...options,
        data: { reminderId, ...options.data },
      });
    }, delay);

    // Também salvar no IndexedDB para persistência offline
    if ('indexedDB' in window) {
      await this.saveScheduledNotification(reminderId, reminderDate, options);
    }
  }

  private async saveScheduledNotification(
    reminderId: string,
    reminderDate: Date,
    options: NotificationOptions
  ) {
    // Implementar salvamento no IndexedDB
    // Isso permite que notificações funcionem mesmo offline
  }

  private startPeriodicCheck() {
    // Verificar lembretes a cada minuto
    this.notificationCheckInterval = window.setInterval(async () => {
      await this.checkUpcomingReminders();
    }, 60000); // 1 minuto

    // Verificar imediatamente
    this.checkUpcomingReminders();
  }

  private async checkUpcomingReminders() {
    try {
      // Buscar lembretes próximos do Supabase
      const { getUpcomingReminders } = await import('./reminders-db');
      const reminders = await getUpcomingReminders(5); // Próximos 5 minutos

      if (!reminders || reminders.length === 0) {
        return;
      }

      // Verificar se já notificamos este lembrete recentemente
      const now = Date.now();
      const recentNotifications = new Set<string>();

      for (const reminder of reminders) {
        // Evitar notificações duplicadas
        const notificationKey = `reminder-${reminder.id}`;
        if (recentNotifications.has(notificationKey)) {
          continue;
        }

        // Verificar se já foi notificado recentemente (últimos 4 minutos)
        if (reminder.last_notified_at) {
          const lastNotified = new Date(reminder.last_notified_at).getTime();
          if (now - lastNotified < 4 * 60 * 1000) {
            continue;
          }
        }

        recentNotifications.add(notificationKey);

        await this.showNotification({
          title: reminder.title,
          body: reminder.description || `Lembrete: ${reminder.title}`,
          tag: notificationKey,
          data: { reminderId: reminder.id },
          requireInteraction: true,
        });
      }
    } catch (error: any) {
      // Não logar como erro crítico se for apenas a RPC não encontrada
      if (error?.message?.includes('does not exist') || error?.message?.includes('404')) {
        // A função já tem fallback, apenas silenciar
        return;
      }
      console.warn('Erro ao verificar lembretes:', error?.message || error);
    }
  }

  stopPeriodicCheck() {
    if (this.notificationCheckInterval) {
      clearInterval(this.notificationCheckInterval);
      this.notificationCheckInterval = null;
    }
  }

  getPermission(): NotificationPermission {
    return this.permission;
  }

  isSupported(): boolean {
    return 'Notification' in window;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }
    this.permission = await Notification.requestPermission();
    return this.permission;
  }
}

export const reminderNotificationService = new ReminderNotificationService();

// Inicializar automaticamente quando o módulo é carregado
if (typeof window !== 'undefined') {
  reminderNotificationService.initialize().catch(console.error);
}
