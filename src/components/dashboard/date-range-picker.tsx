import { useState } from 'react'
import { CalendarIcon, ChevronDown } from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface DateRange {
  startDate: Date
  endDate: Date
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
  className?: string
}

const presets = [
  {
    label: 'Últimos 7 dias',
    getValue: () => ({
      startDate: subDays(new Date(), 7),
      endDate: new Date(),
    }),
  },
  {
    label: 'Últimos 30 dias',
    getValue: () => ({
      startDate: subDays(new Date(), 30),
      endDate: new Date(),
    }),
  },
  {
    label: 'Últimos 90 dias',
    getValue: () => ({
      startDate: subDays(new Date(), 90),
      endDate: new Date(),
    }),
  },
  {
    label: 'Este mês',
    getValue: () => ({
      startDate: startOfMonth(new Date()),
      endDate: new Date(),
    }),
  },
  {
    label: 'Mês passado',
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1)
      return {
        startDate: startOfMonth(lastMonth),
        endDate: endOfMonth(lastMonth),
      }
    },
  },
]

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)

  const handlePresetClick = (preset: typeof presets[0]) => {
    onChange(preset.getValue())
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('justify-start text-left font-normal', className)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {format(value.startDate, 'dd MMM', { locale: ptBR })} -{' '}
          {format(value.endDate, 'dd MMM yyyy', { locale: ptBR })}
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="p-2 space-y-1">
          {presets.map((preset) => (
            <Button
              key={preset.label}
              variant="ghost"
              className="w-full justify-start font-normal"
              onClick={() => handlePresetClick(preset)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
