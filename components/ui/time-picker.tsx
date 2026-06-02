'use client'

/**
 * TimePicker — selector de horario custom (HH:MM, 24h) sobre el Select de
 * shadcn. Controlado: `value` es un string "HH:MM" y emite el mismo formato.
 * Pensado para campos startTime/endTime de schedules/sessions.
 */
import * as React from 'react'
import { Clock } from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export interface TimePickerProps {
  /** Valor en formato "HH:MM" (24h). */
  value?: string
  onChange?: (value: string) => void
  /** Granularidad de minutos. Default 5. */
  minuteStep?: number
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

const pad = (n: number) => String(n).padStart(2, '0')

export function TimePicker({
  value,
  onChange,
  minuteStep = 5,
  disabled,
  className,
  'aria-label': ariaLabel,
}: TimePickerProps) {
  const [hh = '', mm = ''] = (value ?? '').split(':')

  const hours = React.useMemo(
    () => Array.from({ length: 24 }, (_, i) => pad(i)),
    [],
  )

  const minutes = React.useMemo(() => {
    const stepped = Array.from(
      { length: Math.ceil(60 / minuteStep) },
      (_, i) => pad(i * minuteStep),
    )
    // Incluir el minuto actual aunque no caiga en el step (evita un Select vacío).
    if (mm && !stepped.includes(mm)) {
      return [...stepped, mm].sort()
    }
    return stepped
  }, [minuteStep, mm])

  const emit = (h: string, m: string) => onChange?.(`${h}:${m}`)

  return (
    <div
      className={cn('flex items-center gap-1.5', className)}
      aria-label={ariaLabel}
    >
      <Clock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <Select
        value={hh || undefined}
        onValueChange={(h) => emit(h, mm || '00')}
        disabled={disabled}
      >
        <SelectTrigger className="w-[68px] tabular-nums">
          <SelectValue placeholder="--" />
        </SelectTrigger>
        <SelectContent>
          {hours.map((h) => (
            <SelectItem key={h} value={h} className="tabular-nums">
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground">:</span>
      <Select
        value={mm || undefined}
        onValueChange={(m) => emit(hh || '00', m)}
        disabled={disabled}
      >
        <SelectTrigger className="w-[68px] tabular-nums">
          <SelectValue placeholder="--" />
        </SelectTrigger>
        <SelectContent>
          {minutes.map((m) => (
            <SelectItem key={m} value={m} className="tabular-nums">
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
