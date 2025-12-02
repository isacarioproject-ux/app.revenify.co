import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/hooks/use-i18n';
import { Save, Settings, Bell, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
} from '@/lib/notifications';
import { isGeolocationSupported } from '@/lib/geolocation';

// Interface para as configurações
export interface TaskSettings {
  autoSave: boolean;
  notifications: boolean;
  showCompleted: boolean;
  locationReminders: boolean; // Feature futura
}

// Hook para usar as configurações em outros componentes
export const useTaskSettings = () => {
  const getSettings = (): TaskSettings => {
    try {
      const saved = localStorage.getItem('isacar-task-settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Erro ao carregar configurações:', e);
    }
    return { autoSave: true, notifications: true, showCompleted: true, locationReminders: false };
  };

  const [settings, setSettings] = useState<TaskSettings>(getSettings);

  useEffect(() => {
    const handleStorage = () => setSettings(getSettings());
    window.addEventListener('task-settings-changed', handleStorage);
    return () => window.removeEventListener('task-settings-changed', handleStorage);
  }, []);

  return settings;
};

interface TasksSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TasksSettingsDialog({ open, onOpenChange }: TasksSettingsDialogProps) {
  const { t } = useI18n();
  const [requestingPermission, setRequestingPermission] = useState(false);
  
  // Carregar do localStorage
  const loadSettings = (): TaskSettings => {
    try {
      const saved = localStorage.getItem('isacar-task-settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Erro ao carregar configurações:', e);
    }
    return { autoSave: true, notifications: true, showCompleted: true, locationReminders: false };
  };

  const [settings, setSettings] = useState<TaskSettings>(loadSettings);

  // Salvar no localStorage quando mudar
  const updateSetting = (key: keyof TaskSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('isacar-task-settings', JSON.stringify(newSettings));
    // Disparar evento para outros componentes
    window.dispatchEvent(new Event('task-settings-changed'));
  };

  // Handler especial para notificações (precisa pedir permissão)
  const handleNotificationToggle = async (checked: boolean) => {
    if (!checked) {
      // Desativar é simples
      updateSetting('notifications', false);
      return;
    }

    // Verificar suporte
    if (!isNotificationSupported()) {
      toast.error(t('tasks.notifications.unsupported'));
      return;
    }

    // Verificar se já foi negado
    const currentPermission = getNotificationPermission();
    if (currentPermission === 'denied') {
      toast.error(t('tasks.notifications.denied'), {
        duration: 8000,
        description: t('tasks.notifications.howToEnable'),
      });
      return;
    }

    // Se já tem permissão, ativar direto
    if (currentPermission === 'granted') {
      updateSetting('notifications', true);
      toast.success(t('tasks.notifications.enabled'));
      return;
    }

    // Pedir permissão
    setRequestingPermission(true);
    toast.info(t('tasks.notifications.explain'));
    
    const result = await requestNotificationPermission();
    setRequestingPermission(false);

    if (result === 'granted') {
      updateSetting('notifications', true);
      toast.success(t('tasks.notifications.enabled'));
    } else {
      toast.error(t('tasks.notifications.denied'));
    }
  };

  // Handler especial para localização (feature futura)
  const handleLocationToggle = async (checked: boolean) => {
    if (!checked) {
      updateSetting('locationReminders', false);
      return;
    }

    // Verificar suporte
    if (!isGeolocationSupported()) {
      toast.error(t('tasks.location.unsupported'), {
        duration: 6000,
      });
      return;
    }

    // Testar se temos permissão tentando obter localização
    try {
      const { getCurrentPosition } = await import('@/lib/geolocation');
      const result = await getCurrentPosition();
      
      if (!result.success) {
        if (result.error === 'denied') {
          toast.error(t('tasks.location.denied'), {
            duration: 8000,
            description: t('tasks.location.howToEnable'),
          });
        } else {
          toast.error(t('tasks.location.error'));
        }
        return;
      }

      // Sucesso - ativar toggle
      updateSetting('locationReminders', true);
      toast.success(t('tasks.location.enabled'));
    } catch {
      toast.error(t('tasks.location.error'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('tasks.settings.title')}
          </DialogTitle>
          <DialogDescription>
            {t('tasks.settings.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-save" className="flex items-center gap-2">
                  <Save className="h-4 w-4 text-muted-foreground" />
                  {t('tasks.settings.autoSave')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('tasks.settings.autoSaveDesc')}
                </p>
              </div>
              <Switch
                id="auto-save"
                checked={settings.autoSave}
                onCheckedChange={(checked) => updateSetting('autoSave', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications" className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  {t('tasks.settings.notifications')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('tasks.settings.notificationsDesc')}
                </p>
              </div>
              {requestingPermission ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Switch
                  id="notifications"
                  checked={settings.notifications}
                  onCheckedChange={handleNotificationToggle}
                />
              )}
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-completed">{t('tasks.settings.showCompleted')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('tasks.settings.showCompletedDesc')}
                </p>
              </div>
              <Switch
                id="show-completed"
                checked={settings.showCompleted}
                onCheckedChange={(checked) => updateSetting('showCompleted', checked)}
              />
            </div>

            <Separator />

            {/* Lembrete por Localização (Feature Futura) */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="location-reminders" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {t('tasks.location.title')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('tasks.location.description')}
                </p>
              </div>
              <Switch
                id="location-reminders"
                checked={settings.locationReminders}
                onCheckedChange={handleLocationToggle}
              />
            </div>
          </motion.div>
          
          {/* Indicador de salvamento automático */}
          <p className="text-xs text-center text-muted-foreground">
            {t('tasks.settings.autoSaved')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

