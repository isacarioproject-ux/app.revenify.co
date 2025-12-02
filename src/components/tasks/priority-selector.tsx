import { Flag, X } from 'lucide-react';
import { TaskPriority } from '@/types/tasks';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { i18n } from '@/lib/i18n';

interface PrioritySelectorProps {
  value: TaskPriority;
  onChange: (priority: TaskPriority) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const priorityConfig: Record<TaskPriority, { label: string; icon: string; color: string }> = {
  urgent: { label: 'Urgente', icon: '🔴', color: 'text-red-600 dark:text-red-400' },
  high: { label: 'Alta', icon: '🟠', color: 'text-orange-600 dark:text-orange-400' },
  medium: { label: 'Normal', icon: '🔵', color: 'text-blue-600 dark:text-blue-400' },
  low: { label: 'Baixa', icon: '⚪', color: 'text-gray-600 dark:text-gray-400' },
};

export function PrioritySelector({ value, onChange, open, onOpenChange }: PrioritySelectorProps) {
  const t = i18n.translate.bind(i18n);
  const current = priorityConfig[value] || priorityConfig['medium'];

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Flag className={cn('size-4', current.color)} />
          <span className="text-sm font-medium dark:text-gray-200">{current.icon} {current.label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="space-y-1">
          {(Object.entries(priorityConfig) as [TaskPriority, typeof priorityConfig[TaskPriority]][]).map(([priority, config]) => (
            <button
              key={priority}
              onClick={() => {
                onChange(priority);
                onOpenChange?.(false);
              }}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800',
                value === priority && 'bg-gray-100 dark:bg-gray-800'
              )}
            >
              <div className="flex items-center gap-2">
                <span>{config.icon}</span>
                <span className={config.color}>{config.label}</span>
              </div>
              {value === priority && (
                <div className="size-2 rounded-full bg-blue-500" />
              )}
            </button>
          ))}
          <div className="border-t dark:border-gray-700 my-1" />
          <button 
            onClick={() => {
              onChange('medium');
              onOpenChange?.(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="size-4" />
            Limpar
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
