import { useState, useEffect, useRef } from 'react';
import { Clock, Play, Pause, Plus, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';

interface TimeTrackerProps {
  taskId: string;
  totalMinutes?: number;
  onTimeAdd: (minutes: number) => void;
}

export function TimeTracker({ taskId, totalMinutes = 0, onTimeAdd }: TimeTrackerProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [manualHours, setManualHours] = useState('');
  const [manualMinutes, setManualMinutes] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [savedTotalMinutes, setSavedTotalMinutes] = useState(totalMinutes);
  const startTimeRef = useRef<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar tempo salvo no localStorage para esta tarefa
  useEffect(() => {
    const savedTracking = localStorage.getItem(`time-tracking-${taskId}`);
    if (savedTracking) {
      const { startTime, isActive } = JSON.parse(savedTracking);
      if (isActive && startTime) {
        startTimeRef.current = new Date(startTime);
        setIsTracking(true);
        const elapsed = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
        setElapsedSeconds(elapsed);
      }
    }
  }, [taskId]);

  // Timer ativo
  useEffect(() => {
    if (isTracking) {
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000);
          setElapsedSeconds(elapsed);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTracking]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTotalTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleStart = () => {
    startTimeRef.current = new Date();
    setIsTracking(true);
    setElapsedSeconds(0);
    localStorage.setItem(`time-tracking-${taskId}`, JSON.stringify({
      startTime: startTimeRef.current.toISOString(),
      isActive: true
    }));
    toast.success(t('tasks.timeTracker.started'));
  };

  const handlePause = async () => {
    if (!startTimeRef.current) return;

    const minutesTracked = Math.floor(elapsedSeconds / 60);
    setIsTracking(false);
    localStorage.removeItem(`time-tracking-${taskId}`);

    if (minutesTracked > 0) {
      // Salvar no Supabase
      await saveTimeEntry(minutesTracked);
      setSavedTotalMinutes(prev => prev + minutesTracked);
      onTimeAdd(minutesTracked);
    }
    
    setElapsedSeconds(0);
    startTimeRef.current = null;
    toast.success(t('tasks.timeTracker.paused'));
  };

  const handleStop = async () => {
    if (isTracking && startTimeRef.current) {
      const minutesTracked = Math.floor(elapsedSeconds / 60);
      if (minutesTracked > 0) {
        await saveTimeEntry(minutesTracked);
        setSavedTotalMinutes(prev => prev + minutesTracked);
        onTimeAdd(minutesTracked);
      }
    }
    
    setIsTracking(false);
    setElapsedSeconds(0);
    startTimeRef.current = null;
    localStorage.removeItem(`time-tracking-${taskId}`);
    toast.success(t('tasks.timeTracker.stopped'));
  };

  const saveTimeEntry = async (minutes: number) => {
    if (!user) return;

    try {
      // Atualizar tempo total na tarefa
      await supabase
        .from('tasks')
        .update({ 
          time_tracked: (savedTotalMinutes + minutes),
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);
    } catch (error) {
      console.error('Erro ao salvar tempo:', error);
    }
  };

  const handleManualAdd = async () => {
    const hours = parseInt(manualHours) || 0;
    const mins = parseInt(manualMinutes) || 0;
    const totalMins = hours * 60 + mins;
    
    if (totalMins > 0) {
      await saveTimeEntry(totalMins);
      setSavedTotalMinutes(prev => prev + totalMins);
      onTimeAdd(totalMins);
      setManualHours('');
      setManualMinutes('');
      toast.success(t('tasks.timeTracker.timeAdded', { time: formatTotalTime(totalMins) }));
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium flex items-center gap-1">
          {savedTotalMinutes > 0 ? (
            <>
              <Clock className="size-3" />
              {formatTotalTime(savedTotalMinutes)}
            </>
          ) : (
            t('tasks.timeTracker.addTime')
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold dark:text-gray-200">{t('tasks.timeTracker.title')}</h4>
            <div className="flex items-center gap-2">
              {savedTotalMinutes > 0 && (
                <span className="text-sm text-gray-500">{t('tasks.timeTracker.total')}: {formatTotalTime(savedTotalMinutes)}</span>
              )}
              <Clock className="size-4 text-gray-500" />
            </div>
          </div>

          {/* Timer Display */}
          {isTracking && (
            <div className="text-center py-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">
                {formatTime(elapsedSeconds)}
              </span>
            </div>
          )}

          {/* Timer Controls */}
          <div className="flex items-center gap-2">
            {!isTracking ? (
              <Button
                size="sm"
                onClick={handleStart}
                className="flex-1"
              >
                <Play className="size-4 mr-2" />
                {t('tasks.timeTracker.start')}
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePause}
                  className="flex-1"
                >
                  <Pause className="size-4 mr-2" />
                  {t('tasks.timeTracker.pause')}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleStop}
                >
                  <Square className="size-4" />
                </Button>
              </>
            )}
          </div>

          <div className="border-t dark:border-gray-700 pt-4 space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('tasks.timeTracker.addManually')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">{t('tasks.timeTracker.hours')}</label>
                <Input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={manualHours}
                  onChange={(e) => setManualHours(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">{t('tasks.timeTracker.minutes')}</label>
                <Input
                  type="number"
                  placeholder="0"
                  min="0"
                  max="59"
                  value={manualMinutes}
                  onChange={(e) => setManualMinutes(e.target.value)}
                />
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={handleManualAdd} 
              className="w-full"
              disabled={!manualHours && !manualMinutes}
            >
              <Plus className="size-4 mr-2" />
              {t('tasks.timeTracker.addTimeBtn')}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
