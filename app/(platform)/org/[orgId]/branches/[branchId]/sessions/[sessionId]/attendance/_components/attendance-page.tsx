'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFormatter, useNow, useTranslations } from 'next-intl'
import { AlertTriangle, CalendarDays, Clock } from 'lucide-react'

import { ApiError } from '@/lib/api/client'
import {
  useCapabilities,
  useRecordAttendance,
  useSession,
  useSessionRoster,
} from '@/lib/hooks'
import { usePromotionRankResolver } from '@/lib/hooks/use-catalogs'
import { ErrorState, ForbiddenState, EmptyState } from '@/components/shared'
import type {
  AttendanceStatus,
  TechnicalRosterItem,
} from '@/lib/api/types'
import {
  isAdministrativeAttendanceStatus,
  isCheckedInAttendanceStatus,
} from '@/lib/attendance/attendance-status'
import { notifyInfo, notifySuccess } from '@/lib/utils/toast'

import { AttendanceHeader } from './attendance-header'
import { AttendanceToolbar, type AttendanceFilter } from './attendance-toolbar'
import { AttendanceTable } from './attendance-table'
import { WalkInDialog } from './walk-in-dialog'
import { AttendanceEmptyState } from './empty-state'
import { useAttendanceErrorHandler } from './use-attendance-error'

export interface AttendancePageProps {
  orgId: string
  branchId: string
  sessionId: string
}

export function AttendancePage({
  orgId,
  branchId,
  sessionId,
}: AttendancePageProps) {
  const t = useTranslations('attendance')
  const router = useRouter()
  const now = useNow()
  const format = useFormatter()
  const handleError = useAttendanceErrorHandler()

  const sessionQuery = useSession(sessionId)
  const rosterQuery = useSessionRoster(sessionId)
  const caps = useCapabilities(orgId)
  const resolveRank = usePromotionRankResolver()

  const sessionDetailHref = `/org/${orgId}/branches/${branchId}/sessions/${sessionId}`
  const goBack = () => router.push(sessionDetailHref)

  // ── Permission gating ──────────────────────────────────────
  const attendanceCaps = caps.data?.capabilities?.attendance
  const canValidate = Boolean(attendanceCaps?.canValidateAttendance)
  const canCorrectInWindow = Boolean(
    attendanceCaps?.canCorrectAttendanceWithinWindow,
  )
  const canCorrectAsAdmin = Boolean(
    attendanceCaps?.canCorrectAttendanceAsAdmin,
  )

  // ── Toolbar state ──────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<AttendanceFilter>('all')
  const [walkInOpen, setWalkInOpen] = useState(false)
  const [pendingWalkInStudentId, setPendingWalkInStudentId] = useState<
    string | null
  >(null)

  const record = useRecordAttendance(sessionId)

  const allItems = useMemo<TechnicalRosterItem[]>(
    () => rosterQuery.data?.items ?? [],
    [rosterQuery.data],
  )

  const checkedInCount = useMemo(
    () =>
      allItems.filter((it) =>
        isCheckedInAttendanceStatus(it.attendance?.status),
      ).length,
    [allItems],
  )

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allItems.filter((it) => {
      if (q) {
        const name = `${it.student.firstName} ${it.student.lastName}`.toLowerCase()
        if (!name.includes(q)) return false
      }
      if (filter === 'expected') return it.intent != null
      if (filter === 'marked') {
        return isCheckedInAttendanceStatus(it.attendance?.status)
      }
      return true
    })
  }, [allItems, search, filter])

  // ── Bulk seguro: no sobrescribe estados administrativos sin confirmación. ──
  const markAllPresent = () => {
    const administrativeCount = allItems.filter((it) =>
      isAdministrativeAttendanceStatus(it.attendance?.status),
    ).length
    const targets = allItems.filter(
      (it) =>
        !isCheckedInAttendanceStatus(it.attendance?.status) &&
        !isAdministrativeAttendanceStatus(it.attendance?.status),
    )
    if (administrativeCount > 0) {
      notifyInfo(t('toolbar.administrativeExcluded'))
    }
    if (targets.length === 0) return
    record.mutate(
      {
        records: targets.map((it) => ({
          studentId: it.studentId,
          status: 'PRESENT' as AttendanceStatus,
        })),
      },
      {
        onSuccess: () => notifySuccess(t('success.marked')),
        onError: handleError,
      },
    )
  }

  // ── Agregar alumno (asistencia manual / walk-in): registra como PRESENT ──
  //
  // ⚠️ Usa el MISMO POST .../attendance que marcar asistencia, así que queda
  // sujeto a la ventana horaria STAFF_MANUAL (409 fuera de ella, manejado por
  // useAttendanceErrorHandler). NO confundir con "Sugerir asistencia" (Sheet),
  // que solo recomienda y no marca asistencia.
  const addWalkIn = (studentId: string) => {
    setPendingWalkInStudentId(studentId)
    record.mutate(
      { records: [{ studentId, status: 'PRESENT' as AttendanceStatus }] },
      {
        onSuccess: () => {
          notifySuccess(t('success.walkInAdded'))
          setWalkInOpen(false)
          setPendingWalkInStudentId(null)
        },
        onError: (error) => {
          setPendingWalkInStudentId(null)
          handleError(error)
        },
      },
    )
  }

  // ── States: loading ────────────────────────────────────────
  if (sessionQuery.isLoading || caps.isLoading) {
    return <AttendanceSkeleton />
  }

  // ── States: forbidden (capability or 403) ──────────────────
  const forbidden =
    sessionQuery.error instanceof ApiError && sessionQuery.error.status === 403
  if (forbidden || (caps.data && !canValidate)) {
    return (
      <div className="p-6">
        <ForbiddenState
          title={t('errors.forbiddenTitle')}
          description={t('errors.forbiddenDescription')}
        />
      </div>
    )
  }

  // ── States: not found ──────────────────────────────────────
  if (
    sessionQuery.error instanceof ApiError &&
    sessionQuery.error.status === 404
  ) {
    return (
      <div className="p-6">
        <EmptyState
          icon={CalendarDays}
          title={t('errors.notFoundTitle')}
          description={t('errors.notFoundDescription')}
        />
      </div>
    )
  }

  // ── States: error ──────────────────────────────────────────
  if (sessionQuery.error) {
    return (
      <div className="p-6">
        <ErrorState
          title={t('errors.loadErrorTitle')}
          error={sessionQuery.error}
          onRetry={() => sessionQuery.refetch()}
        />
      </div>
    )
  }

  const session = sessionQuery.data
  if (!session) return null

  const isCanceled = session.status === 'CANCELED'
  // Si NO puede corregir ni en ventana ni como admin, las correcciones se
  // deshabilitan; igual puede registrar asistencia nueva (canValidate).
  const canCorrect = canCorrectInWindow || canCorrectAsAdmin

  // El backend solo permite operar asistencia STAFF_MANUAL dentro de una
  // ventana alrededor del horario de la clase (responde 409 fuera de ella).
  // No conocemos el rango exacto sin disparar la operación, así que usamos una
  // heurística honesta para un banner proactivo: si la clase aún no empieza
  // (con una gracia de ~2h antes) o ya terminó hace rato (~3h después), la
  // ventana probablemente esté cerrada. El backend sigue siendo la verdad: el
  // 409 se maneja con un toast claro (useAttendanceErrorHandler).
  const PRE_GRACE_MS = 2 * 60 * 60_000
  const POST_GRACE_MS = 3 * 60 * 60_000
  const nowMs = now.getTime()
  const startMs = new Date(session.startAt).getTime()
  const endMs = new Date(session.endAt).getTime()
  const windowLikelyClosed =
    !isCanceled && (nowMs < startMs - PRE_GRACE_MS || nowMs > endMs + POST_GRACE_MS)

  // Heurística de "fuera de ventana estándar" (corrección admin): la sesión ya
  // terminó y el usuario solo tiene corrección administrativa.
  const outsideWindow =
    nowMs > endMs && !canCorrectInWindow && canCorrectAsAdmin

  return (
    <div className="space-y-6 p-6">
      <AttendanceHeader session={session} onBack={goBack} />

      {isCanceled && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-foreground"
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-destructive" />
          <span>{t('errors.sessionCanceled')}</span>
        </div>
      )}

      {windowLikelyClosed && (
        <div
          role="status"
          className="surface-warning flex flex-col gap-1 rounded-lg border p-3 text-sm"
        >
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4 flex-shrink-0" />
            {t('warnings.windowClosed')}
          </span>
          <span className="pl-6 text-xs text-muted-foreground">
            {t('warnings.windowRange', {
              start: formatTime(format, session.startAt),
              end: formatTime(format, session.endAt),
            })}
          </span>
        </div>
      )}

      {outsideWindow && (
        <div
          role="alert"
          className="surface-warning flex items-center gap-2 rounded-lg border p-3 text-sm"
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{t('warnings.outsideWindow')}</span>
        </div>
      )}

      <AttendanceToolbar
        search={search}
        onSearchChange={setSearch}
        filter={filter}
        onFilterChange={setFilter}
        checkedInCount={checkedInCount}
        totalCount={allItems.length}
        onMarkAllPresent={markAllPresent}
        onAddWalkIn={() => setWalkInOpen(true)}
        disabled={isCanceled}
        bulkPending={record.isPending}
      />

      <RosterBody
        isLoading={rosterQuery.isLoading}
        error={rosterQuery.error}
        items={filteredItems}
        hasAny={allItems.length > 0}
        sessionId={sessionId}
        canCorrect={canCorrect}
        disabled={isCanceled}
        resolveRank={resolveRank}
        onRetry={() => rosterQuery.refetch()}
        onAddWalkIn={() => setWalkInOpen(true)}
      />

      <footer className="flex items-center justify-between border-t border-border pt-6">
        <span className="label-mono">
          {t('toolbar.counter', {
            checkedIn: checkedInCount,
            total: allItems.length,
          })}
        </span>
        <button
          type="button"
          onClick={goBack}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {t('page.back')}
        </button>
      </footer>

      <WalkInDialog
        open={walkInOpen}
        onOpenChange={setWalkInOpen}
        orgId={orgId}
        branchId={branchId}
        rosterStudentIds={allItems.map((it) => it.studentId)}
        onSelect={addWalkIn}
        pending={record.isPending}
        pendingStudentId={pendingWalkInStudentId}
      />
    </div>
  )
}

// ── Roster body (loading/error/empty/list) ─────────────────────

function RosterBody({
  isLoading,
  error,
  items,
  hasAny,
  sessionId,
  canCorrect,
  disabled,
  resolveRank,
  onRetry,
  onAddWalkIn,
}: {
  isLoading: boolean
  error: unknown
  items: TechnicalRosterItem[]
  hasAny: boolean
  sessionId: string
  canCorrect: boolean
  disabled: boolean
  resolveRank: ReturnType<typeof usePromotionRankResolver>
  onRetry: () => void
  onAddWalkIn: () => void
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/50" />
        ))}
      </div>
    )
  }

  if (error instanceof ApiError && error.status === 403) {
    return <ForbiddenState />
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />
  }

  if (!hasAny) {
    return <AttendanceEmptyState onAddWalkIn={onAddWalkIn} disabled={disabled} />
  }

  return (
    <AttendanceTable
      items={items}
      sessionId={sessionId}
      canCorrect={canCorrect}
      disabled={disabled}
      resolveRank={resolveRank}
    />
  )
}

// ── Helpers ────────────────────────────────────────────────────

function formatTime(
  format: ReturnType<typeof useFormatter>,
  iso: string,
): string {
  try {
    return format.dateTime(new Date(iso), { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

// ── Skeleton ───────────────────────────────────────────────────

function AttendanceSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-3">
        <div className="h-3 w-28 animate-pulse rounded-md bg-muted/60" />
        <div className="h-7 w-64 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-muted/60" />
      </div>
      <div className="h-10 w-full animate-pulse rounded-lg bg-muted/40" />
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/50" />
        ))}
      </div>
    </div>
  )
}
