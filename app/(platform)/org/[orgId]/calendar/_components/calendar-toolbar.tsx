'use client'

import { useEffect } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Grid3x3,
  List,
  Plus,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  KURO_CLASS_TYPE_COLORS,
  type EventManagerView,
} from '@/components/ui/event-manager'
import type { ClassSessionStatus, ClassType } from '@/lib/api/types'
import { cn } from '@/lib/utils'

const VIEW_LABEL: Record<EventManagerView, string> = {
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  list: 'Lista',
}

const VIEW_ICON: Record<
  EventManagerView,
  React.ComponentType<{ className?: string }>
> = {
  month: CalendarIcon,
  week: Grid3x3,
  day: Clock,
  list: List,
}

const STATUS_LABEL: Record<ClassSessionStatus, string> = {
  SCHEDULED: 'Programada',
  COMPLETED: 'Completada',
  CANCELED: 'Cancelada',
}

const STATUS_TONE: Record<ClassSessionStatus, string> = {
  SCHEDULED: 'border-blue-400/50 text-blue-700 dark:text-blue-300',
  COMPLETED: 'border-emerald-500/50 text-emerald-700 dark:text-emerald-300',
  CANCELED: 'border-red-500/50 text-red-700 dark:text-red-300',
}

export interface CalendarToolbarProps {
  view: EventManagerView
  currentDate: Date
  rangeLabel: string
  selectedClassTypes: Set<ClassType | string>
  selectedStatuses: Set<ClassSessionStatus>
  onViewChange: (view: EventManagerView) => void
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onToggleClassType: (value: ClassType | string) => void
  onToggleStatus: (value: ClassSessionStatus) => void
  onClearFilters: () => void
}

export function CalendarToolbar({
  view,
  rangeLabel,
  selectedClassTypes,
  selectedStatuses,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  onToggleClassType,
  onToggleStatus,
  onClearFilters,
}: CalendarToolbarProps) {
  // Keyboard ← / → para navegar rango. Ignora cuando el foco está en
  // un input/textarea/contenteditable para no romper la búsqueda interna.
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      if (target) {
        const tag = target.tagName
        if (
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return
        }
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        onPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        onNext()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onPrev, onNext])

  const hasActiveFilters =
    selectedClassTypes.size > 0 || selectedStatuses.size > 0

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-base font-semibold text-foreground sm:text-lg">
            {rangeLabel}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={onPrev}
              className="h-8 w-8"
              aria-label="Rango anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onToday} className="h-8">
              Hoy
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onNext}
              className="h-8 w-8"
              aria-label="Rango siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="flex items-center gap-1 rounded-lg border bg-background p-1"
            role="tablist"
            aria-label="Vista del calendario"
          >
            {(['month', 'week', 'day', 'list'] as const).map((v) => {
              const Icon = VIEW_ICON[v]
              const active = view === v
              return (
                <Button
                  key={v}
                  variant={active ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => onViewChange(v)}
                  className="h-8"
                  role="tab"
                  aria-selected={active}
                >
                  <Icon className="h-4 w-4" />
                  <span className="ml-1">{VIEW_LABEL[v]}</span>
                </Button>
              )
            })}
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="default"
                  size="sm"
                  disabled
                  className="h-8 opacity-60 cursor-not-allowed"
                  aria-label="Nueva clase (próximamente)"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Nueva clase
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Próximamente</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Filtros — chips multi-select */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Tipo de clase
          </span>
          {KURO_CLASS_TYPE_COLORS.map((c) => {
            const active = selectedClassTypes.has(c.value)
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => onToggleClassType(c.value)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                  active
                    ? 'border-foreground/50 bg-foreground/10 text-foreground'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted',
                )}
                aria-pressed={active}
              >
                <span className={cn('h-2 w-2 rounded-full', c.bg)} />
                {c.name}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Estado
          </span>
          {(['SCHEDULED', 'COMPLETED', 'CANCELED'] as const).map((s) => {
            const active = selectedStatuses.has(s)
            return (
              <button
                key={s}
                type="button"
                onClick={() => onToggleStatus(s)}
                className={cn(
                  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                  active
                    ? cn('bg-foreground/10', STATUS_TONE[s])
                    : 'border-border bg-background text-muted-foreground hover:bg-muted',
                )}
                aria-pressed={active}
              >
                {STATUS_LABEL[s]}
              </button>
            )
          })}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="ml-1 h-7 gap-1 text-xs"
            >
              <X className="h-3 w-3" />
              Limpiar filtros
            </Button>
          )}
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs text-muted-foreground">Activos:</span>
            {Array.from(selectedClassTypes).map((value) => {
              const meta =
                KURO_CLASS_TYPE_COLORS.find((c) => c.value === value)
              return (
                <Badge
                  key={`ct-${value}`}
                  variant="secondary"
                  className="gap-1"
                >
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      meta?.bg ?? 'bg-neutral-400',
                    )}
                  />
                  {meta?.name ?? value}
                  <button
                    onClick={() => onToggleClassType(value)}
                    className="ml-1 hover:text-foreground"
                    aria-label={`Quitar ${meta?.name ?? value}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )
            })}
            {Array.from(selectedStatuses).map((s) => (
              <Badge key={`st-${s}`} variant="secondary" className="gap-1">
                {STATUS_LABEL[s]}
                <button
                  onClick={() => onToggleStatus(s)}
                  className="ml-1 hover:text-foreground"
                  aria-label={`Quitar ${STATUS_LABEL[s]}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
