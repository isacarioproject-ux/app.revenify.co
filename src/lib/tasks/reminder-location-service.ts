// Serviço de geolocalização para lembretes baseados em localização
// Usa Geolocation API e Geofencing

export interface LocationReminder {
  id: string;
  latitude: number;
  longitude: number;
  radius: number; // em metros
  name?: string;
}

class ReminderLocationService {
  private watchId: number | null = null;
  private locationReminders: Map<string, LocationReminder> = new Map();
  private currentPosition: { latitude: number; longitude: number } | null = null;
  private onEnterCallback?: (reminderId: string) => void;
  private onExitCallback?: (reminderId: string) => void;

  async initialize() {
    if (!('geolocation' in navigator)) {
      console.warn('Geolocalização não disponível neste navegador');
      return false;
    }

    // Solicitar permissão de localização
    try {
      const position = await this.getCurrentPosition();
      this.currentPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      return true;
    } catch (error) {
      // Não logar erros de permissão negada ou timeout como erros críticos
      if (error instanceof GeolocationPositionError) {
        if (error.code === error.PERMISSION_DENIED) {
          console.warn('Permissão de geolocalização negada pelo usuário');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          console.warn('Posição de geolocalização indisponível');
        } else if (error.code === error.TIMEOUT) {
          console.warn('Timeout ao obter localização');
        } else {
          console.warn('Erro ao obter localização:', error.message);
        }
      } else {
        console.warn('Erro ao obter localização:', error);
      }
      return false;
    }
  }

  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      });
    });
  }

  startWatching(onEnter?: (reminderId: string) => void, onExit?: (reminderId: string) => void) {
    if (!('geolocation' in navigator)) {
      return;
    }

    this.onEnterCallback = onEnter;
    this.onExitCallback = onExit;

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000, // Atualizar a cada 30 segundos
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.currentPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        this.checkLocationReminders();
      },
      (error) => {
        // Não logar erros de permissão negada ou timeout como erros críticos
        if (error instanceof GeolocationPositionError) {
          if (error.code === error.PERMISSION_DENIED) {
            // Silenciar - usuário negou permissão
            return;
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            console.warn('Posição de geolocalização indisponível');
          } else if (error.code === error.TIMEOUT) {
            // Silenciar timeouts - são comuns
            return;
          } else {
            console.warn('Erro ao monitorar localização:', error.message);
          }
        } else {
          console.warn('Erro ao monitorar localização:', error);
        }
      },
      options
    );
  }

  stopWatching() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  addLocationReminder(reminder: LocationReminder) {
    this.locationReminders.set(reminder.id, reminder);
  }

  removeLocationReminder(reminderId: string) {
    this.locationReminders.delete(reminderId);
  }

  private checkLocationReminders() {
    if (!this.currentPosition) return;

    for (const [reminderId, reminder] of this.locationReminders.entries()) {
      const distance = this.calculateDistance(
        this.currentPosition.latitude,
        this.currentPosition.longitude,
        reminder.latitude,
        reminder.longitude
      );

      if (distance <= reminder.radius) {
        // Dentro do raio - disparar lembrete
        this.onEnterCallback?.(reminderId);
      }
    }
  }

  // Fórmula de Haversine para calcular distância entre dois pontos
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Raio da Terra em metros
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distância em metros
  }

  async getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const position = await this.getCurrentPosition();
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch (error) {
      console.error('Erro ao obter localização atual:', error);
      return null;
    }
  }

  isSupported(): boolean {
    return 'geolocation' in navigator;
  }
}

export const reminderLocationService = new ReminderLocationService();

