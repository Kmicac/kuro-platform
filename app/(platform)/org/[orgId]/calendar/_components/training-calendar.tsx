'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useFormatter, useTranslations } from 'next-intl'
import { Calendar as CalendarIcon, Layers } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { ForbiddenState } from '@/components/shared/forbidden-state'
import { Button } from '@/components/ui/button'
import {
  EventManager,
  type EventManagerView,
  type Event,
} from '@/components/ui/event-manager'
import { ApiError } from '@/lib/api/client'
import { useCalendarRange, useCurrentContext } from '@/lib/hooks'
import { useAuthStore } from '@/stores/auth.store'
import type { ClassSessionStatus, ClassType } from '@/lib/api/types'
import { useClassTypeLabel } from '@/components/kuro'
import { CalendarToolbar } from './calendar-toolbar'
import { SessionPopover } from './session-popover'
import { adaptSessionsToEvents } from './calendar-event-adapter'

// ── Helpers de fecha (lunes-domingo, ISO-style) ──────────────────────────

function startOfDay(d: Date) {
  const r = new Date(d)
  r.setHours(0, 0, 0, 0)
  return r
}

function startOfWeek(d: Date) {
  // Semana comienza el lunes (es-AR).
  const r = startOfDay(d)
  const dow = r.getDay() // 0=domingo..6=sábado
  const diff = (dow + 6) % 7 // mover hacia atrás al lunes
  r.setDate(r.getDate() - diff)
  return r
}

function endOfWeek(d: Date) {
  const r = startOfWeek(d)
  r.setDate(r.getDate() + 6)
  r.setHours(23, 59, 59, 999)
  return r
}

function startOfMonthGrid(d: Date) {
  // Primer lunes visible en una grilla de mes (incluye días del mes anterior).
  const firstOfMonth = new Date(d.getFullYear(), d.getMonth(), 1)
  return startOfWeek(firstOfMonth)
}

function endOfMonthGrid(d: Date) {
  // 42 celdas (6 semanas) — cubre cualquier configuración de mes.
  const start = startOfMonthGrid(d)
  const end = new Date(start)
  end.setDate(start.getDate() + 41)
  end.setHours(23, 59, 59, 999)
  return end
}

function rangeForView(view: EventManagerView, anchor: Date) {
  switch (view) {
    case 'day': {
      const s = startOfDay(anchor)
      const e = new Date(s)
      e.setHours(23, 59, 59, 999)
      return { from: s, to: e }
    }
    case 'week':
      return { from: startOfWeek(anchor), to: endOfWeek(anchor) }
    case 'month':
    case 'list':
      return { from: startOfMonthGrid(anchor), to: endOfMonthGrid(anchor) }
  }
}

type Formatter = ReturnType<typeof useFormatter>
type CalendarTranslator = ReturnType<typeof useTranslations<'calendar'>>

function formatRangeLabel(
  format: Formatter,
  t: CalendarTranslator,
  view: EventManagerView,
  anchor: Date,
) {
  const opts = {
    month: 'long',
    day: 'numeric',
  } as const
  switch (view) {
    case 'day':
      return format.dateTime(anchor, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    case 'week': {
      const s = startOfWeek(anchor)
      const e = endOfWeek(anchor)
      const sameMonth = s.getMonth() === e.getMonth()
      const sameYear = s.getFullYear() === e.getFullYear()
      const left = format.dateTime(s, opts)
      const right = sameMonth ? String(e.getDate()) : format.dateTime(e, opts)
      const year = sameYear ? String(s.getFullYear()) : ''
      return t('weekRange', { left, right, year }).trim()
    }
    case 'month':
    case 'list':
      return format.dateTime(anchor, {
        month: 'long',
        year: 'numeric',
      })
  }
}

// ── Componente ────────────────────────────────────────────────────────────

export interface TrainingCalendarProps {
  orgId: string
}

export function TrainingCalendar({ orgId }: TrainingCalendarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { branchId } = useCurrentContext()
  const currentBranch = useAuthStore((s) => s.currentBranch)

  const format = useFormatter()
  const t = useTranslations('calendar')
  const tn = useTranslations('navigation.labels')
  const tErr = useTranslations('errors.calendar')
  const tEmpty = useTranslations('empty-states.calendar')
  const tc = useTranslations('common')

  // ── Estado local de UI ──
  const [view, setView] = useState<EventManagerView>('week')
  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date())
  const [selectedClassTypes, setSelectedClassTypes] = useState<
    Set<ClassType | string>
  >(new Set())
  const [selectedStatuses, setSelectedStatuses] = useState<
    Set<ClassSessionStatus>
  >(new Set())

  // ── Rango derivado para el fetch ──
  const range = useMemo(() => rangeForView(view, anchorDate), [view, anchorDate])

  const sessionsQuery = useCalendarRange({
    startDate: range.from,
    endDate: range.to,
  })

  // ── Mapeo crudo → events + extras ──
  const classTypeLabel = useClassTypeLabel()
  const { events, extras } = useMemo(
    () => adaptSessionsToEvents(sessionsQuery.items, classTypeLabel),
    [sessionsQuery.items, classTypeLabel],
  )

  // ── Filtrado client-side por classType + status ──
  const filteredEvents = useMemo<Event[]>(() => {
    if (selectedClassTypes.size === 0 && selectedStatuses.size === 0) {
      return events
    }
    return events.filter((event) => {
      const meta = extras.get(event.id)
      if (!meta) return false
      if (
        selectedClassTypes.size > 0 &&
        !selectedClassTypes.has(meta.classType)
      ) {
        return false
      }
      if (selectedStatuses.size > 0 && !selectedStatuses.has(meta.status)) {
        return false
      }
      return true
    })
  }, [events, extras, selectedClassTypes, selectedStatuses])

  // ── Toolbar handlers ──
  const handlePrev = useCallback(() => {
    setAnchorDate((prev) => {
      const next = new Date(prev)
      if (view === 'day') next.setDate(prev.getDate() - 1)
      else if (view === 'week') next.setDate(prev.getDate() - 7)
      else next.setMonth(prev.getMonth() - 1)
      return next
    })
  }, [view])

  const handleNext = useCallback(() => {
    setAnchorDate((prev) => {
      const next = new Date(prev)
      if (view === 'day') next.setDate(prev.getDate() + 1)
      else if (view === 'week') next.setDate(prev.getDate() + 7)
      else next.setMonth(prev.getMonth() + 1)
      return next
    })
  }, [view])

  const handleToday = useCallback(() => setAnchorDate(new Date()), [])

  const handleViewChange = useCallback((next: EventManagerView) => {
    setView(next)
  }, [])

  const toggleClassType = useCallback((value: ClassType | string) => {
    setSelectedClassTypes((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }, [])

  const toggleStatus = useCallback((value: ClassSessionStatus) => {
    setSelectedStatuses((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }, [])

  const clearFilters = useCallback(() => {
    setSelectedClassTypes(new Set())
    setSelectedStatuses(new Set())
  }, [])

  // ── Selección de sesión vía searchParam ?session= ──
  const selectedSessionId = searchParams.get('session')

  const handleEventClick = useCallback(
    (event: Event) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('session', event.id)
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  const handleClosePopover = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('session')
    const qs = params.toString()
    router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false })
  }, [router, searchParams])

  // ── Render ────────────────────────────────────────────────────

  const header = (
    <PageHeader
      breadcrumbs={[
        { label: tn('organization'), href: `/org/${orgId}` },
        { label: tn('calendar') },
      ]}
      title={t('title')}
      subtitle={
        currentBranch
          ? t('subtitleWithBranch', { branch: currentBranch.name })
          : t('subtitle')
      }
    />
  )

  // 1) Sin branch seleccionada → prompt explicativo.
  if (!branchId) {
    return (
      <div className="p-6 space-y-6">
        {header}
        <EmptyState
          icon={Layers}
          title={tEmpty('selectBranchTitle')}
          description={tEmpty('selectBranchDescription')}
        />
      </div>
    )
  }

  const status = (() => {
    if (sessionsQuery.isLoading) return 'loading'
    const error = sessionsQuery.error
    if (error instanceof ApiError && error.status === 403) return 'forbidden'
    if (error) return 'error'
    if (filteredEvents.length === 0) return 'empty'
    return 'ready'
  })()

  const rangeLabel = formatRangeLabel(format, t, view, anchorDate)

  return (
    <div className="p-6 space-y-6">
      {header}

      <CalendarToolbar
        view={view}
        currentDate={anchorDate}
        rangeLabel={rangeLabel}
        selectedClassTypes={selectedClassTypes}
        selectedStatuses={selectedStatuses}
        onViewChange={handleViewChange}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        onToggleClassType={toggleClassType}
        onToggleStatus={toggleStatus}
        onClearFilters={clearFilters}
      />

      {status === 'loading' && <CalendarSkeleton view={view} />}

      {status === 'forbidden' && (
        <ForbiddenState
          title={tErr('forbiddenTitle')}
          description={tErr('forbiddenDescription')}
        />
      )}

      {status === 'error' && (
        <ErrorState
          error={sessionsQuery.error}
          onRetry={() => sessionsQuery.refetch()}
          title={tErr('loadErrorTitle')}
          description={tErr('loadErrorDescription')}
        />
      )}

      {status === 'empty' && (
        <EmptyState
          icon={CalendarIcon}
          title={tEmpty('noClassesTitle')}
          description={
            selectedClassTypes.size > 0 || selectedStatuses.size > 0
              ? tEmpty('noClassesFiltered')
              : tEmpty('noClassesEmpty')
          }
          action={
            selectedClassTypes.size > 0 || selectedStatuses.size > 0 ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                {tc('actions.clearFilters')}
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href={`/org/${orgId}/branches/${branchId}`}>
                  {t('backToBranch')}
                </Link>
              </Button>
            )
          }
        />
      )}

      {status === 'ready' && (
        <EventManager
          events={filteredEvents}
          view={view}
          onViewChange={handleViewChange}
          currentDate={anchorDate}
          onDateChange={setAnchorDate}
          onEventClick={handleEventClick}
          hideHeader
          hideFilters
        />
      )}

      <SessionPopover
        sessionId={selectedSessionId}
        onClose={handleClosePopover}
      />
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────

function CalendarSkeleton({ view }: { view: EventManagerView }) {
  const t = useTranslations('calendar')
  // Una grilla genérica con la forma del contenido final.
  const rows = view === 'day' ? 8 : view === 'list' ? 6 : 6
  const cols = view === 'week' ? 7 : view === 'day' ? 1 : view === 'list' ? 1 : 7

  return (
    <div
      aria-busy="true"
      aria-label={t('loadingAria')}
      className="rounded-lg border bg-card overflow-hidden"
    >
      <div
        className="grid border-b"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="border-r p-2 last:border-r-0">
            <div className="h-3 w-12 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: rows * cols }).map((_, i) => (
          <div
            key={i}
            className="min-h-20 border-b border-r p-2 last:border-r-0 space-y-1.5"
          >
            <div className="h-3 w-6 rounded bg-muted/60 animate-pulse" />
            <div className="h-2.5 w-full rounded bg-muted/40 animate-pulse" />
            <div className="h-2.5 w-2/3 rounded bg-muted/40 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
