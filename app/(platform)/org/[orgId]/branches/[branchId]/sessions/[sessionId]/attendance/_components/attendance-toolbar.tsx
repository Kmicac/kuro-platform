'use client'

import { useTranslations } from 'next-intl'
import { CheckCheck, Search, UserPlus } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type AttendanceFilter = 'all' | 'expected' | 'marked'

export interface AttendanceToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  filter: AttendanceFilter
  onFilterChange: (filter: AttendanceFilter) => void
  markedCount: number
  totalCount: number
  onMarkAllPresent: () => void
  /** Abre el dialog de agregar alumno (asistencia manual / walk-in). */
  onAddWalkIn: () => void
  disabled: boolean
  bulkPending: boolean
}

const FILTERS: AttendanceFilter[] = ['all', 'expected', 'marked']

export function AttendanceToolbar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  markedCount,
  totalCount,
  onMarkAllPresent,
  onAddWalkIn,
  disabled,
  bulkPending,
}: AttendanceToolbarProps) {
  const t = useTranslations('attendance.toolbar')

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Búsqueda */}
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('search')}
          className="pl-9"
          aria-label={t('search')}
        />
      </div>

      {/* Filter chips */}
      <div
        role="tablist"
        aria-label={t('filter.all')}
        className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1"
      >
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => onFilterChange(f)}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-colors',
              filter === f
                ? 'bg-primary/15 text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t(`filter.${f}`)}
          </button>
        ))}
      </div>

      {/* Contador */}
      <span className="text-xs tabular-nums text-muted-foreground">
        {t('counter', { marked: markedCount, total: totalCount })}
      </span>

      {/* Bulk + agregar alumno (asistencia manual) */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onMarkAllPresent}
          disabled={disabled || bulkPending || totalCount === 0}
        >
          <CheckCheck className="h-3.5 w-3.5" />
          {t('markAllPresent')}
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={onAddWalkIn}
          disabled={disabled}
        >
          <UserPlus className="h-3.5 w-3.5" />
          {t('addWalkIn')}
        </Button>
      </div>
    </div>
  )
}
