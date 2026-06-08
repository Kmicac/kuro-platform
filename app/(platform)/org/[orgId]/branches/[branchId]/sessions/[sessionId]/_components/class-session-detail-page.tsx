'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { CalendarDays } from 'lucide-react'

import { ApiError } from '@/lib/api/client'
import { isAttendanceWindowError } from '@/lib/api/error-parsers'
import {
  useCapabilities,
  useRecordAttendance,
  useSession,
  useSessionRoster,
} from '@/lib/hooks'
import { usePromotionRankResolver } from '@/lib/hooks/use-catalogs'
import { ErrorState, ForbiddenState, EmptyState } from '@/components/shared'
import { notifyError, notifySuccess } from '@/lib/utils/toast'
import type { AttendanceStatus, TechnicalRosterItem } from '@/lib/api/types'

import { SessionDetailHeader } from './session-detail-header'
import { AttendanceOverviewCard } from './attendance-overview-card'
import { TechnicalCurriculumCard } from './technical-curriculum-card'
import { RegisteredStudentsTable } from './registered-students-table'
import { ComplianceStrip } from './compliance-strip'
import { QrModal } from './qr-modal'
import { SuggestionsSummaryCard } from '@/components/attendance/suggestions-summary-card'
import { SuggestionsListSheet } from '@/components/attendance/suggestions-list-sheet'
import { SuggestAttendanceDialog } from '@/components/attendance/suggest-attendance-dialog'

export interface ClassSessionDetailPageProps {
  orgId: string
  branchId: string
  sessionId: string
}

export function ClassSessionDetailPage({
  orgId,
  branchId,
  sessionId,
}: ClassSessionDetailPageProps) {
  const t = useTranslations('class-detail')
  const router = useRouter()

  const sessionQuery = useSession(sessionId)
  const rosterQuery = useSessionRoster(sessionId)
  const caps = useCapabilities(orgId)
  const resolveRank = usePromotionRankResolver()
  const record = useRecordAttendance(sessionId)

  const [suggestionsSheetOpen, setSuggestionsSheetOpen] = useState(false)
  const [suggestOpen, setSuggestOpen] = useState(false)

  const goBack = () => router.push(`/org/${orgId}/calendar`)

  const attendanceCaps = caps.data?.capabilities?.attendance
  const canValidate = Boolean(attendanceCaps?.canValidateAttendance)
  const canSuggest = Boolean(attendanceCaps?.canSuggestAttendance)
  const canManage = Boolean(
    caps.data?.capabilities?.classes?.canManageSchedules,
  )

  const allItems = useMemo<TechnicalRosterItem[]>(
    () => rosterQuery.data?.items ?? [],
    [rosterQuery.data],
  )

  // "Check-in" = asistencia marcada presente/tarde (no solo intent).
  const checkedInCount = useMemo(
    () =>
      allItems.filter(
        (it) =>
          it.attendance?.status === 'PRESENT' ||
          it.attendance?.status === 'LATE',
      ).length,
    [allItems],
  )

  // Handler de error compartido para check-in (403 / 409 ventana / genérico).
  const handleCheckInError = (error: unknown) => {
    if (error instanceof ApiError && error.status === 403)
      return notifyError(t('errors.forbidden'))
    if (isAttendanceWindowError(error))
      return notifyError(t('errors.outOfWindow'), error)
    notifyError(t('errors.loadErrorTitle'), error)
  }

  const checkIn = (studentId: string) => {
    record.mutate(
      { records: [{ studentId, status: 'PRESENT' as AttendanceStatus }] },
      {
        onSuccess: () => notifySuccess(t('students.checkedInSuccess')),
        onError: handleCheckInError,
      },
    )
  }

  // ── States ─────────────────────────────────────────────────
  if (sessionQuery.isLoading || caps.isLoading) {
    return <DetailSkeleton />
  }

  const forbidden =
    sessionQuery.error instanceof ApiError && sessionQuery.error.status === 403
  if (forbidden) {
    return (
      <div className="p-6">
        <ForbiddenState
          title={t('errors.forbiddenTitle')}
          description={t('errors.forbiddenDescription')}
        />
      </div>
    )
  }

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

  return (
    <div className="space-y-6 p-6">
      <SessionDetailHeader
        session={session}
        orgId={orgId}
        branchId={branchId}
        canManage={canManage}
        canValidate={canValidate}
        canSuggest={canSuggest}
        onBack={goBack}
        onCanceled={goBack}
      />

      {/* ÁREA 1 — Overview + currícula */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <AttendanceOverviewCard
          checkedIn={checkedInCount}
          capacityMax={session.capacity.max}
          isLoading={rosterQuery.isLoading}
        />
        <TechnicalCurriculumCard
          sessionId={sessionId}
          notes={session.description ?? session.notes}
          canManage={canManage}
          disabled={isCanceled}
        />
      </div>

      {/* ÁREA 2 — Alumnos registrados */}
      <RegisteredStudentsTable
        items={allItems}
        isLoading={rosterQuery.isLoading}
        error={rosterQuery.error}
        onRetry={() => rosterQuery.refetch()}
        resolveRank={resolveRank}
        canValidate={canValidate}
        disabled={isCanceled}
        pendingStudentId={record.isPending ? record.variables?.records[0]?.studentId : undefined}
        onCheckIn={checkIn}
      />

      {/* ÁREA 2.5 — Sugerencias de asistencia (summary inline + lista en sheet) */}
      <SuggestionsSummaryCard
        summary={session.suggestions}
        sessionId={sessionId}
        canSuggest={canSuggest}
        onViewAll={() => setSuggestionsSheetOpen(true)}
        onSuggestMore={() => setSuggestOpen(true)}
      />

      {/* ÁREA 3 — Compliance (provider-aware, sin backend aún) */}
      <ComplianceStrip />

      {/* Sheet con la lista completa + cancelar (gateado por canSuggest) */}
      {canSuggest && (
        <SuggestionsListSheet
          open={suggestionsSheetOpen}
          onOpenChange={setSuggestionsSheetOpen}
          orgId={orgId}
          branchId={branchId}
          sessionId={sessionId}
          sessionTitle={session.title}
          sessionStartAt={session.startAt}
        />
      )}

      {/* Dialog para sugerir más alumnos desde la summary card */}
      {canSuggest && (
        <SuggestAttendanceDialog
          open={suggestOpen}
          onOpenChange={setSuggestOpen}
          sessionId={sessionId}
          branchId={branchId}
          orgId={orgId}
          excludeStudentIds={[]}
        />
      )}

      {/* QR como modal (FAB esquina inferior derecha) */}
      {canValidate && !isCanceled && (
        <QrModal
          sessionId={sessionId}
          orgId={orgId}
          branchId={branchId}
        />
      )}
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-3">
        <div className="h-3 w-28 animate-pulse rounded bg-muted/60" />
        <div className="h-8 w-96 animate-pulse rounded bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded bg-muted/60" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="h-40 animate-pulse rounded bg-muted/40" />
        <div className="h-40 animate-pulse rounded bg-muted/40" />
      </div>
      <div className="h-64 animate-pulse rounded bg-muted/40" />
    </div>
  )
}
