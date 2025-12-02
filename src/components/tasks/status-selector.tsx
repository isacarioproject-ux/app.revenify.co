import { Check } from 'lucide-react';
import { TaskStatus } from '@/types/tasks';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { i18n } from '@/lib/i18n';

interface StatusSelectorProps {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const statusConfig: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  todo: { 
    label: 'TO DO', 
    color: 'text-gray-700 dark:text-gray-300', 
    bg: 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700' 
  },
  in_progress: { 
    label: 'IN PROGRESS', 
    color: 'text-purple-700 dark:text-purple-300', 
    bg: 'bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50' 
  },
  review: { 
    label: 'REVIEW', 
    color: 'text-yellow-700 dark:text-yellow-300', 
    bg: 'bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50' 
  },
  done: { 
    label: 'COMPLETE', 
    color: 'text-green-700 dark:text-green-300', 
    bg: 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50' 
  },
};

export function StatusSelector({ value, onChange, open, onOpenChange }: StatusSelectorProps) {
  const t = i18n.translate.bind(i18n);
  const current = statusConfig[value] || statusConfig['todo'];

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-2',
            current.bg,
            current.color
          )}
        >
          <span className="size-2 rounded-full bg-current" />
          {current.label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-1">
          {(Object.entries(statusConfig) as [TaskStatus, typeof statusConfig[TaskStatus]][]).map(([status, config]) => (
            <button
              key={status}
              onClick={() => {
                onChange(status);
                onOpenChange?.(false);
              }}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors',
                config.bg,
                config.color
              )}
            >
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-current" />
                {config.label}
              </div>
              {value === status && <Check className="size-4" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
