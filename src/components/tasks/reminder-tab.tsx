import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Bell, 
  Repeat, 
  MapPin,
  Settings,
  ChevronRight,
  Paperclip,
  ChevronUp,
  ChevronDown,
  Plus,
  X,
  Check,
  AlertCircle,
  Image,
  FileUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useDateFnsLocale } from '@/hooks/use-date-fns-locale';
import { createReminder } from '@/lib/tasks/reminders-db';
import { reminderNotificationService } from '@/lib/tasks/reminder-notification-service';
import { reminderLocationService } from '@/lib/tasks/reminder-location-service';
import { useWorkspace } from '@/contexts/workspace-context';
import { ReminderTabSkeleton } from './reminder-tab-skeleton';

interface ReminderTabProps {
  onCreateReminder?: (data: any) => void;
}

type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
type NotificationTime = 'at_time' | '5min' | '10min' | '30min' | '1hour' | '1day' | 'custom';

export function ReminderTab({ onCreateReminder }: ReminderTabProps) {
  const { t } = useI18n();
  const { currentWorkspace } = useWorkspace();
  const dateFnsLocale = useDateFnsLocale();
  const [reminderText, setReminderText] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('none');
  const [recurrenceConfig, setRecurrenceConfig] = useState<any>({});
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [notificationTimes, setNotificationTimes] = useState<NotificationTime[]>(['at_time']);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [tags, setTags] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showRecurrence, setShowRecurrence] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showLocationSettings, setShowLocationSettings] = useState(false);
  const [showMediaSettings, setShowMediaSettings] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [locationPermission, setLocationPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Verificar permissões
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    
    // Inicializar serviços
    Promise.all([
      reminderNotificationService.initialize(),
      reminderLocationService.initialize()
    ]).then(([, granted]) => {
      setLocationPermission(granted);
      setIsInitializing(false);
    }).catch(() => {
      setIsInitializing(false);
    });
  }, []);

  const quickTimeOptions = [
    { label: t('tasks.reminder.today'), time: new Date() },
    { label: t('tasks.reminder.tomorrow'), time: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; })() },
    { label: t('tasks.reminder.in1hour'), time: (() => { const d = new Date(); d.setHours(d.getHours() + 1); return d; })() },
    { label: t('tasks.reminder.in2hours'), time: (() => { const d = new Date(); d.setHours(d.getHours() + 2); return d; })() },
  ];

  const recurrenceOptions: { value: RecurrenceType; label: string; icon: any }[] = [
    { value: 'none', label: t('tasks.reminder.noRepeat'), icon: X },
    { value: 'daily', label: t('tasks.reminder.daily'), icon: Repeat },
    { value: 'weekly', label: t('tasks.reminder.weekly'), icon: Repeat },
    { value: 'monthly', label: t('tasks.reminder.monthly'), icon: Repeat },
    { value: 'yearly', label: t('tasks.reminder.yearly'), icon: Repeat },
    { value: 'custom', label: t('tasks.reminder.custom'), icon: Settings },
  ];

  const notificationTimeOptions: { value: NotificationTime; label: string }[] = [
    { value: 'at_time', label: t('tasks.reminder.atTime') },
    { value: '5min', label: t('tasks.reminder.5minBefore') },
    { value: '10min', label: t('tasks.reminder.10minBefore') },
    { value: '30min', label: t('tasks.reminder.30minBefore') },
    { value: '1hour', label: t('tasks.reminder.1hourBefore') },
    { value: '1day', label: t('tasks.reminder.1dayBefore') },
    { value: 'custom', label: t('tasks.reminder.customize') },
  ];

  const priorityOptions: { value: typeof priority; label: string; color: string }[] = [
    { value: 'low', label: t('tasks.reminder.low'), color: 'text-gray-500' },
    { value: 'medium', label: t('tasks.reminder.medium'), color: 'text-blue-500' },
    { value: 'high', label: t('tasks.reminder.high'), color: 'text-orange-500' },
    { value: 'urgent', label: t('tasks.reminder.urgent'), color: 'text-red-500' },
  ];

  const handleRequestNotificationPermission = async () => {
    // Verificar suporte
    if (!('Notification' in window)) {
      toast.error(`${t('tasks.reminder.browserNoSupport')} notificações`);
      return;
    }

    // Verificar se já foi bloqueado anteriormente
    if (Notification.permission === 'denied') {
      toast.error(t('tasks.reminder.locationBlocked').replace('Localização', 'Notificações'));
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        toast.success(t('tasks.reminder.notificationsActivated'));
        // Mostrar notificação de teste
        new Notification('Isacar', {
          body: t('tasks.reminder.notificationsTest'),
          icon: '/pwa-192x192.png'
        });
      } else if (permission === 'denied') {
        toast.error(t('tasks.reminder.notificationsBlockedDesc'));
      } else {
        toast.info(t('tasks.reminder.clickAllow'));
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      toast.error(t('tasks.reminder.errorRequestingPermission'));
    }
  };

  const handleRequestLocationPermission = async () => {
    console.log('🔵 handleRequestLocationPermission chamada');
    toast.info(t('tasks.reminder.requestingLocation'));
    
    // Verificar suporte
    if (!('geolocation' in navigator)) {
      toast.error(`${t('tasks.reminder.browserNoSupport')} geolocalização`);
      return;
    }

    try {
      // Solicitar permissão de localização
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      setLocationPermission(true);
      toast.success(`${t('tasks.reminder.locationActivated')} (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`);
    } catch (error: any) {
      console.error('Erro de geolocalização:', error);
      setLocationPermission(false);
      
      if (error.code === 1) {
        // PERMISSION_DENIED
        toast.error(t('tasks.reminder.locationBlocked'));
      } else if (error.code === 2) {
        // POSITION_UNAVAILABLE
        toast.error(t('tasks.reminder.locationUnavailable'));
      } else if (error.code === 3) {
        // TIMEOUT
        toast.error(t('tasks.reminder.locationTimeout'));
      } else {
        toast.error(t('tasks.reminder.locationError'));
      }
    }
  };

  const handleCreateReminder = async () => {
    if (!reminderText.trim()) {
      toast.error(t('tasks.reminder.enterReminder'));
      return;
    }

    if (!selectedDate) {
      toast.error(t('tasks.reminder.selectDateError'));
      return;
    }

    setIsLoading(true);
    try {
      // Combinar data e hora
      const reminderDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':').map(Number);
      reminderDateTime.setHours(hours, minutes, 0, 0);

      // Converter notification times para minutos
      const notificationTimesMinutes = notificationTimes.map(nt => {
        switch (nt) {
          case 'at_time': return 0;
          case '5min': return 5;
          case '10min': return 10;
          case '30min': return 30;
          case '1hour': return 60;
          case '1day': return 1440;
          default: return 0;
        }
      });

      // Obter localização se habilitado
      let locationData: any = {};
      if (locationEnabled) {
        const location = await reminderLocationService.getCurrentLocation();
        if (location) {
          locationData = {
            location_enabled: true,
            location_latitude: location.latitude,
            location_longitude: location.longitude,
            location_radius: 100, // 100 metros
            location_name: locationName || t('tasks.reminder.location'),
          };
        }
      }

      // Criar lembrete no Supabase
      const reminder = await createReminder({
        title: reminderText,
        description: '',
        reminder_date: reminderDateTime.toISOString(),
        reminder_time: selectedTime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        is_recurring: recurrenceType !== 'none',
        recurrence_type: recurrenceType !== 'none' ? recurrenceType : undefined,
        recurrence_config: recurrenceConfig,
        notification_enabled: notificationEnabled,
        notification_channels: ['browser'],
        notification_times: notificationTimesMinutes,
        priority,
        tags,
        status: 'active',
        workspace_id: currentWorkspace?.id,
        assigned_to: [],
        ...locationData,
      });

      // Agendar notificações
      if (notificationEnabled && notificationPermission === 'granted') {
        for (const minutesBefore of notificationTimesMinutes) {
          const notificationDate = new Date(reminderDateTime);
          notificationDate.setMinutes(notificationDate.getMinutes() - minutesBefore);

          await reminderNotificationService.scheduleNotification(
            reminder.id,
            notificationDate,
            {
              title: reminderText,
              body: `${t('tasks.reminder.title')}: ${reminderText}`,
              tag: `reminder-${reminder.id}-${minutesBefore}`,
              data: { reminderId: reminder.id },
              requireInteraction: priority === 'urgent' || priority === 'high',
            }
          );
        }
      }

      // Adicionar lembrete de localização se habilitado
      if (locationEnabled && locationData.location_latitude) {
        reminderLocationService.addLocationReminder({
          id: reminder.id,
          latitude: locationData.location_latitude,
          longitude: locationData.location_longitude,
          radius: locationData.location_radius,
          name: locationData.location_name,
        });
      }

      toast.success(t('tasks.reminder.createdSuccess'));
      onCreateReminder?.(reminder);
      
      // Reset form
    setReminderText('');
      setSelectedDate(new Date());
      setSelectedTime('09:00');
      setRecurrenceType('none');
      setNotificationTimes(['at_time']);
      setLocationEnabled(false);
    } catch (error: any) {
      console.error('Erro ao criar lembrete:', error);
      toast.error(`${t('tasks.reminder.createError')}: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return <ReminderTabSkeleton />;
  }

  return (
    <TooltipProvider>
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4 p-4"
    >
      {/* Input Principal */}
      <Input
        type="text"
        value={reminderText}
        onChange={(e) => setReminderText(e.target.value)}
        placeholder={t('tasks.reminder.name')}
        className="w-full text-base border-none px-0 focus-visible:ring-0 placeholder:text-gray-500"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter' && reminderText.trim()) {
            handleCreateReminder();
          }
        }}
      />

      {/* Opções Rápidas */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center gap-2"
      >
        {/* Data e Hora */}
        <Popover open={showCalendar} onOpenChange={setShowCalendar}>
          <PopoverTrigger asChild>
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 gap-1.5 transition-all hover:scale-105"
              title={t('tasks.reminder.dateTimeTooltip')}
            >
              <CalendarIcon className="size-3" />
              {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: dateFnsLocale }) : t('tasks.reminder.selectDate')}
              {selectedTime && ` ${t('tasks.reminder.at')} ${selectedTime}`}
            </Badge>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 space-y-3">
              {/* Opções Rápidas */}
              <div className="space-y-1">
                {quickTimeOptions.map((option, idx) => (
                  <motion.button
                  key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  onClick={() => {
                      setSelectedDate(option.time);
                      setShowCalendar(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {option.label}
                  </motion.button>
                ))}
              </div>

              <div className="border-t dark:border-gray-700 pt-3">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                    }
                  }}
                  locale={dateFnsLocale}
                />
              </div>

              {/* Seletor de Hora */}
              <div className="border-t dark:border-gray-700 pt-3">
                <Label className="text-xs text-gray-500 mb-2 block">{t('tasks.reminder.time')}</Label>
                <Input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Recorrência */}
        <Popover open={showRecurrence} onOpenChange={setShowRecurrence}>
          <PopoverTrigger asChild>
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 gap-1.5 transition-all hover:scale-105"
              title={t('tasks.reminder.repeatTooltip')}
            >
              <Repeat className="size-3" />
              {recurrenceType === 'none' ? t('tasks.reminder.noRepeat') : recurrenceOptions.find(o => o.value === recurrenceType)?.label}
            </Badge>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            <div className="space-y-1">
              {recurrenceOptions.map((option, idx) => {
                const Icon = option.icon;
                return (
                  <motion.button
                    key={option.value}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setRecurrenceType(option.value);
                      if (option.value !== 'custom') {
                        setShowRecurrence(false);
                      }
                    }}
                    className={cn(
                      'flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800',
                      recurrenceType === option.value && 'bg-gray-100 dark:bg-gray-800'
                    )}
                  >
                    <Icon className="size-4" />
                    <span>{option.label}</span>
                    {recurrenceType === option.value && (
                      <Check className="size-4 ml-auto text-blue-600" />
                    )}
                  </motion.button>
                );
              })}
                  </div>
          </PopoverContent>
        </Popover>

        {/* Notificações */}
        <Popover open={showNotificationSettings} onOpenChange={setShowNotificationSettings}>
          <PopoverTrigger asChild>
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 gap-1.5 transition-all hover:scale-105"
              title={t('tasks.reminder.notificationsTooltip')}
            >
              <Bell className="size-3" />
              {t('tasks.reminder.notifications')}
              {notificationPermission !== 'granted' && (
                <AlertCircle className="size-3 text-yellow-500" />
              )}
            </Badge>
          </PopoverTrigger>
          <PopoverContent 
            className="w-64 p-3" 
            align="start"
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
          >
            <div className="space-y-3">
              {notificationPermission !== 'granted' && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2 bg-yellow-50 dark:bg-yellow-950 rounded text-xs text-yellow-800 dark:text-yellow-200"
                >
                  <p className="mb-2 font-medium">
                    {notificationPermission === 'denied' 
                      ? t('tasks.reminder.notificationsBlocked')
                      : t('tasks.reminder.enableNotificationsTitle')}
                  </p>
                  <p className="mb-2 text-[11px] opacity-80">
                    {notificationPermission === 'denied'
                      ? t('tasks.reminder.notificationsBlockedDesc')
                      : t('tasks.reminder.enableNotificationsDesc')}
                  </p>
                  <Button
                    size="sm"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRequestNotificationPermission();
                    }}
                    className="w-full"
                  >
                    {notificationPermission === 'denied' ? t('tasks.reminder.seeInstructions') : t('tasks.reminder.allowNotifications')}
                  </Button>
                </motion.div>
              )}

              <div className="flex items-center justify-between">
                <Label>{t('tasks.reminder.enableNotifications')}</Label>
                <Switch
                  checked={notificationEnabled}
                  onCheckedChange={setNotificationEnabled}
                  disabled={notificationPermission !== 'granted'}
                />
                </div>

              {notificationEnabled && notificationPermission === 'granted' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label className="text-xs text-gray-500">{t('tasks.reminder.notify')}</Label>
                  {notificationTimeOptions.map((option, idx) => (
                    <motion.div
                      key={option.value}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        checked={notificationTimes.includes(option.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNotificationTimes([...notificationTimes, option.value]);
                          } else {
                            setNotificationTimes(notificationTimes.filter(t => t !== option.value));
                          }
                        }}
                        className="rounded"
                      />
                      <Label className="text-sm cursor-pointer">{option.label}</Label>
                    </motion.div>
                  ))}
                </motion.div>
              )}
                </div>
          </PopoverContent>
        </Popover>

        {/* Localização */}
        <Popover open={showLocationSettings} onOpenChange={setShowLocationSettings}>
          <PopoverTrigger asChild>
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 gap-1.5 transition-all hover:scale-105"
              title={t('tasks.reminder.locationTooltip')}
            >
              <MapPin className="size-3" />
              {t('tasks.reminder.location')}
              {locationEnabled && <Check className="size-3 text-green-500" />}
            </Badge>
          </PopoverTrigger>
          <PopoverContent 
            className="w-64 p-3" 
            align="start"
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
          >
            <div className="space-y-3">
              {!locationPermission && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2 bg-yellow-50 dark:bg-yellow-950 rounded text-xs text-yellow-800 dark:text-yellow-200"
                >
                  <p className="mb-2 font-medium">{t('tasks.reminder.enableLocation')}</p>
                  <p className="mb-2 text-[11px] opacity-80">
                    {t('tasks.reminder.enableLocationDesc')}
                  </p>
                  <Button
                    size="sm"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRequestLocationPermission();
                    }}
                    className="w-full"
                  >
                    {t('tasks.reminder.allowLocation')}
                  </Button>
                </motion.div>
              )}

              <div className="flex items-center justify-between">
                <Label>{t('tasks.reminder.locationReminder')}</Label>
                <Switch
                  checked={locationEnabled}
                  onCheckedChange={setLocationEnabled}
                  disabled={!locationPermission}
                />
              </div>

              {locationEnabled && locationPermission && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label className="text-xs text-gray-500">{t('tasks.reminder.locationName')}</Label>
                  <Input
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder={t('tasks.reminder.locationName')}
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    {t('tasks.reminder.locationHint')}
                  </p>
                </motion.div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Mídia/Anexos */}
        <Popover open={showMediaSettings} onOpenChange={setShowMediaSettings}>
          <PopoverTrigger asChild>
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 gap-1.5 transition-all hover:scale-105"
              title={t('tasks.reminder.mediaTooltip')}
            >
              <Image className="size-3" />
              {t('tasks.reminder.media')}
              {mediaFiles.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                  {mediaFiles.length}
                </span>
              )}
            </Badge>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="start">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium">{t('tasks.reminder.attachFiles')}</Label>
              </div>
              
              {/* Área de Upload */}
              <motion.label
                whileHover={{ scale: 1.02, borderColor: '#3b82f6' }}
                whileTap={{ scale: 0.98 }}
                className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <FileUp className="size-6 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">{t('tasks.reminder.dropOrClick')}</span>
                <span className="text-xs text-gray-400 mt-1">{t('tasks.reminder.maxSize')}</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setMediaFiles(prev => [...prev, ...files]);
                    toast.success(t('tasks.reminder.filesAdded', { count: files.length }));
                  }}
                />
              </motion.label>

              {/* Lista de Arquivos */}
              <AnimatePresence>
                {mediaFiles.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 max-h-32 overflow-y-auto"
                  >
                    {mediaFiles.map((file, idx) => (
                      <motion.div
                        key={`${file.name}-${idx}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {file.type.startsWith('image/') ? (
                            <Image className="size-4 text-blue-500" />
                          ) : (
                            <Paperclip className="size-4 text-gray-500" />
                          )}
                          <span className="truncate max-w-[150px]">{file.name}</span>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setMediaFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-500"
                        >
                          <X className="size-3" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              
              {mediaFiles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-gray-500 text-center"
                >
                  {mediaFiles.length} {t('tasks.reminder.filesSelected')}
                </motion.div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </motion.div>

      {/* Botão Criar */}
      <div className="flex items-center justify-end pt-2 border-t dark:border-gray-800">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          onClick={handleCreateReminder}
              disabled={!reminderText.trim() || !selectedDate || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="size-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                  />
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <Plus className="size-4 mr-2" />
                  {t('tasks.reminder.createReminder')}
                </>
              )}
        </Button>
          </motion.div>
      </div>
    </motion.div>
    </TooltipProvider>
  );
}
