// Service Worker para lembretes e notificações offline
// Permite notificações mesmo quando o app está fechado

const CACHE_NAME = 'reminders-v1';
const NOTIFICATION_TAG = 'reminder';

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('🔔 Service Worker de lembretes instalado');
  self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('🔔 Service Worker de lembretes ativado');
  event.waitUntil(self.clients.claim());
});

// Interceptar notificações
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notificação clicada:', event.notification.tag);
  
  event.notification.close();

  const reminderId = event.notification.data?.reminderId;
  const action = event.action;

  // Ações customizadas
  if (action === 'snooze') {
    // Adiar 10 minutos
    event.waitUntil(
      fetch('/api/reminders/snooze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminderId, minutes: 10 }),
      })
    );
    
    // Agendar nova notificação
    const snoozeDate = new Date(Date.now() + 10 * 60 * 1000);
    event.waitUntil(
      self.registration.showNotification(event.notification.title, {
        ...event.notification,
        tag: `snooze-${reminderId}`,
        body: `Adiado para ${snoozeDate.toLocaleTimeString('pt-BR')}`,
        data: { reminderId, snoozed: true },
      })
    );
  } else if (action === 'complete') {
    // Marcar como concluído
    event.waitUntil(
      fetch('/api/reminders/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminderId }),
      })
    );
  } else {
    // Abrir/focar na aplicação
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Sincronização em background (quando online novamente)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reminders') {
    event.waitUntil(syncReminders());
  }
});

async function syncReminders() {
  try {
    // Sincronizar lembretes pendentes
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await fetch(request);
      if (response.ok) {
        await cache.delete(request);
      }
    }
  } catch (error) {
    console.error('Erro ao sincronizar lembretes:', error);
  }
}

// Push notifications (para notificações do servidor)
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification recebida');
  
  const data = event.data?.json() || {};
  
  const options = {
    title: data.title || 'Novo lembrete',
    body: data.body || 'Você tem um lembrete',
    icon: data.icon || '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: data.tag || NOTIFICATION_TAG,
    data: data.data || {},
    requireInteraction: true,
    vibrate: [200, 100, 200],
    actions: [
      { action: 'snooze', title: 'Adiar 10 min' },
      { action: 'complete', title: 'Concluir' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

