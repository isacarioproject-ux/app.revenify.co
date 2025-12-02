import { useEffect, useState } from 'react';
import { reminderNotificationService } from '@/lib/tasks/reminder-notification-service';
import { reminderLocationService } from '@/lib/tasks/reminder-location-service';

export function useReminderServices() {
  const [notificationReady, setNotificationReady] = useState(false);
  const [locationReady, setLocationReady] = useState(false);

  useEffect(() => {
    // Inicializar serviços de lembrete
    const initServices = async () => {
      try {
        // Inicializar notificações
        await reminderNotificationService.initialize();
        setNotificationReady(true);

        // Inicializar geolocalização
        const locationGranted = await reminderLocationService.initialize();
        setLocationReady(locationGranted);

        // Iniciar monitoramento de localização para lembretes baseados em localização
        reminderLocationService.startWatching(
          (reminderId) => {
            // Quando entrar em uma área de lembrete
            console.log('🔔 Lembrete de localização ativado:', reminderId);
            reminderNotificationService.showNotification({
              title: 'Lembrete de Localização',
              body: 'Você chegou ao local do lembrete!',
              tag: `location-${reminderId}`,
              data: { reminderId },
              requireInteraction: true,
            });
          },
          (reminderId) => {
            // Quando sair de uma área de lembrete
            console.log('📍 Saiu da área do lembrete:', reminderId);
          }
        );
      } catch (error) {
        console.error('Erro ao inicializar serviços de lembrete:', error);
      }
    };

    initServices();

    // Cleanup
    return () => {
      reminderLocationService.stopWatching();
      reminderNotificationService.stopPeriodicCheck();
    };
  }, []);

  return {
    notificationReady,
    locationReady,
    notificationPermission: reminderNotificationService.getPermission(),
    isNotificationSupported: reminderNotificationService.isSupported(),
    isLocationSupported: reminderLocationService.isSupported(),
  };
}

