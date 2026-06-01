'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
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
import { useClassTypeLabel } from '@/components/kuro'
import type { ClassSessionStatus, ClassType } from '@/lib/api/types'
import { cn } from '@/lib/utils'

// Mapea cada view a su key en calendar.toolbar.*
const VIEW_LABEL_KEY: Record<
  EventManagerView,
  'viewMonth' | 'viewWeek' | 'viewDay' | 'viewList'
> = {
  month: 'viewMonth',
  week: 'viewWeek',
  day: 'viewDay',
  list: 'viewList',
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
  const t = useTranslations('calendar.toolbar')
  const tStatus = useTranslations('calendar.sessionStatus')
  const tc = useTranslations('common')
  const classTypeLabel = useClassTypeLabel()
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
              aria-label={t('prevRange')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onToday} className="h-8">
              {tc('today')}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onNext}
              className="h-8 w-8"
              aria-label={t('nextRange')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="flex items-center gap-1 rounded-lg border bg-background p-1"
            role="tablist"
            aria-label={t('viewAria')}
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
                  <span className="ml-1">{t(VIEW_LABEL_KEY[v])}</span>
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
                  aria-label={t('newClassSoon')}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  {t('newClass')}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{tc('actions.comingSoon')}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Filtros — chips multi-select */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('classTypeLabel')}
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
                {classTypeLabel(c.value)}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('statusLabel')}
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
                {tStatus(s)}
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
              {tc('actions.clearFilters')}
            </Button>
          )}
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs text-muted-foreground">
              {t('activeLabel')}
            </span>
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
                  {classTypeLabel(value)}
                  <button
                    onClick={() => onToggleClassType(value)}
                    className="ml-1 hover:text-foreground"
                    aria-label={t('removeFilter', {
                      label: classTypeLabel(value),
                    })}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )
            })}
            {Array.from(selectedStatuses).map((s) => (
              <Badge key={`st-${s}`} variant="secondary" className="gap-1">
                {tStatus(s)}
                <button
                  onClick={() => onToggleStatus(s)}
                  className="ml-1 hover:text-foreground"
                  aria-label={t('removeFilter', { label: tStatus(s) })}
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
