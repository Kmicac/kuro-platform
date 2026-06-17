'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFormatter, useTranslations } from 'next-intl'
import {
  AlertCircle,
  ArrowUpRight,
  Ban,
  CalendarDays,
  ClipboardCheck,
  Clock,
  Pencil,
  QrCode,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api/client'
import { useSession } from '@/lib/hooks/use-sessions'
import { useCapabilities, useCurrentContext } from '@/lib/hooks'
import { SessionDialog } from '@/components/sessions/session-dialog'
import { CancelSessionDialog } from '@/components/sessions/cancel-session-dialog'
import { SuggestAttendanceDialog } from '@/components/attendance/suggest-attendance-dialog'
import {
  BeltBadge,
  ClassTypeChip,
  RoleBadge,
  SessionStatusBadge,
  useClassTypeLabel,
} from '@/components/kuro'
import {
  EmptyState,
  ErrorState,
  ForbiddenState,
  PageHeader,
} from '@/components/shared'
import { PersonAvatar } from '@/components/common/person-avatar'
import type {
  ClassSessionAttendanceCounts,
  ClassSessionCapacity,
  ClassSessionDetail as ClassSessionDetailType,
  ClassSessionInstructor,
  ClassSessionStatus,
} from '@/lib/api/types'

export interface SessionDetailProps {
  sessionId: string
  /** Cierra el contenedor (sheet). Lo usa, p.ej., cancelar la clase. */
  onClose?: () => void
}

export function SessionDetail({ sessionId, onClose }: SessionDetailProps) {
  const te = useTranslations('errors.session')
  const tEmpty = useTranslations('empty-states.session')
  const query = useSession(sessionId)

  if (query.isLoading) return <DetailSkeleton />

  if (query.error instanceof ApiError && query.error.status === 403) {
    return (
      <div className="p-8">
        <ForbiddenState
          title={te('forbiddenTitle')}
          description={te('forbiddenDescription')}
        />
      </div>
    )
  }

  if (query.error instanceof ApiError && query.error.status === 404) {
    return (
      <div className="p-8">
        <EmptyState
          icon={CalendarDays}
          title={tEmpty('notFoundTitle')}
          description={tEmpty('notFoundDescription')}
        />
      </div>
    )
  }

  if (query.error) {
    return (
      <div className="p-8">
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      </div>
    )
  }

  const session = query.data
  if (!session) {
    return (
      <div className="p-8">
        <EmptyState
          icon={AlertCircle}
          title={tEmpty('noDataTitle')}
          description={tEmpty('noDataDescription')}
        />
      </div>
    )
  }

  return (
    <div className="p-8">
      <Header session={session} />

      {/* Secciones verticales separadas por border sutil. */}
      <div className="mt-6 divide-y divide-border">
        <InstructorSection instructor={session.instructor} />
        <CapacitySection capacity={session.capacity} />
        <AttendanceSection
          attendance={session.attendance}
          status={session.status}
        />
        {session.notes && <NotesSection notes={session.notes} />}
        {session.status === 'CANCELED' && (
          <CancellationSection session={session} />
        )}
      </div>

      <ActionsBar session={session} onClose={onClose} />
    </div>
  )
}

// ── Header (sin cambios de estructura) ─────────────────────

function Header({ session }: { session: ClassSessionDetailType }) {
  const format = useFormatter()
  const classTypeLabel = useClassTypeLabel()
  return (
    <PageHeader
      eyebrow={classTypeLabel(session.classType).toUpperCase()}
      title={session.title}
      subtitle={
        <span className="inline-flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatLongDate(format, session.startAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {formatTime(format, session.startAt)} –{' '}
            {formatTime(format, session.endAt)}
          </span>
        </span>
      }
      meta={
        <div className="flex items-center gap-2 flex-wrap">
          <SessionStatusBadge status={session.status} />
          <ClassTypeChip classType={session.classType} />
        </div>
      }
    />
  )
}

// ── Section primitive (label mono + contenido) ─────────────

function Section({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <section className="py-6 first:pt-0 last:pb-0">
      <p className="label-mono">{label}</p>
      <div className="mt-3">{children}</div>
    </section>
  )
}

// ── Instructor ─────────────────────────────────────────────

function InstructorSection({
  instructor,
}: {
  instructor: ClassSessionInstructor | null
}) {
  const t = useTranslations('calendar.session')
  return (
    <Section label={t('instructor')}>
      {instructor ? (
        <div className="flex items-center gap-3">
          <PersonAvatar
            avatarUrl={instructor.avatarUrl}
            firstName={instructor.firstName}
            lastName={instructor.lastName}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-foreground">
              {instructor.firstName} {instructor.lastName}
            </p>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <BeltBadge rank={instructor.primaryBelt} size="sm" />
              <RoleBadge role={instructor.role} />
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t('noInstructor')}</p>
      )}
    </Section>
  )
}

// ── Capacidad ──────────────────────────────────────────────

function CapacitySection({ capacity }: { capacity: ClassSessionCapacity }) {
  const t = useTranslations('calendar.session')
  const pct =
    capacity.max > 0
      ? Math.min(100, Math.round((capacity.enrolled / capacity.max) * 100))
      : 0
  const available = Math.max(0, capacity.max - capacity.enrolled)

  return (
    <Section label={t('capacity')}>
      <div className="space-y-2.5">
        <p className="leading-none">
          <span className="text-3xl font-medium tabular-nums text-foreground">
            {capacity.enrolled}
          </span>
          <span className="text-xl tabular-nums text-muted-foreground">
            {' '}
            / {capacity.max}
          </span>
        </p>
        <p className="text-xs text-[var(--text-tertiary)]">
          {t('enrolledLabel')}
        </p>

        <div
          className="h-0.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={capacity.max}
          aria-valuenow={capacity.enrolled}
        >
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className="text-xs text-[var(--text-tertiary)]">
          {t('occupancy', { pct, available })}
        </p>
      </div>
    </Section>
  )
}

// ── Asistencia ─────────────────────────────────────────────

function AttendanceSection({
  attendance,
  status,
}: {
  attendance: ClassSessionAttendanceCounts
  status: ClassSessionStatus
}) {
  const t = useTranslations('calendar.session.attendance')

  if (status !== 'COMPLETED') {
    return (
      <Section label={t('title')}>
        <p className="text-sm text-[var(--text-tertiary)]">
          {t('notRecorded')}
        </p>
      </Section>
    )
  }

  // Lista vertical, sin colores por estado (solo tipografía + posición).
  const rows: { label: string; value: number }[] = [
    { label: t('present'), value: attendance.present },
    { label: t('late'), value: attendance.late },
    { label: t('absent'), value: attendance.absent },
    { label: t('excused'), value: attendance.excused },
    { label: t('expected'), value: attendance.expected },
  ]

  return (
    <Section label={t('title')}>
      <div>
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between border-b border-border/60 py-2 last:border-b-0"
          >
            <span className="text-sm text-muted-foreground">{row.label}</span>
            <span className="text-sm font-medium tabular-nums text-foreground">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </Section>
  )
}

// ── Notas ──────────────────────────────────────────────────

function NotesSection({ notes }: { notes: string }) {
  const t = useTranslations('calendar.session')
  return (
    <Section label={t('notes')}>
      <p className="whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-sm text-foreground">
        {notes}
      </p>
    </Section>
  )
}

// ── Cancelación ────────────────────────────────────────────

function CancellationSection({
  session,
}: {
  session: ClassSessionDetailType
}) {
  const t = useTranslations('calendar.session')
  const format = useFormatter()
  return (
    <section className="py-6 first:pt-0 last:pb-0">
      <div
        role="alert"
        className="rounded-lg border border-destructive/30 bg-destructive/5 p-3"
      >
        <p className="text-sm font-medium text-foreground">{t('cancelled')}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {session.cancellationReason ?? t('noReason')}
        </p>
        {session.cancelledAt && (
          <p className="mt-1 text-[11px] tabular-nums text-muted-foreground/80">
            {t('cancelledOn', {
              date: formatLongDate(format, session.cancelledAt),
              time: formatTime(format, session.cancelledAt),
            })}
          </p>
        )}
      </div>
    </section>
  )
}

// ── Acciones (footer — sin cambios funcionales) ────────────

function ActionsBar({
  session,
  onClose,
}: {
  session: ClassSessionDetailType
  onClose?: () => void
}) {
  const t = useTranslations('calendar.session.actions')
  const tCancel = useTranslations('calendar.cancelDialog')
  const router = useRouter()
  const { orgId, branchId } = useCurrentContext()
  const caps = useCapabilities(orgId ?? '')
  const canManage = Boolean(
    caps.data?.capabilities?.classes?.canManageSchedules,
  )
  const canValidate = Boolean(
    caps.data?.capabilities?.attendance?.canValidateAttendance,
  )
  const isEditable =
    session.status !== 'CANCELED' && session.status !== 'COMPLETED'
  const canCancel = session.status === 'SCHEDULED'
  const isCanceled = session.status === 'CANCELED'
  // El branchId del detalle es la fuente de verdad (la sesión puede verse
  // desde el calendar org-level, donde la URL no trae branchId).
  const sessionBranchId = session.branchId || branchId
  const canSuggest = Boolean(
    caps.data?.capabilities?.attendance?.canSuggestAttendance,
  )
  const [editOpen, setEditOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [suggestOpen, setSuggestOpen] = useState(false)

  // Solo push: NO llamar onClose() — en el calendario onClose hace un
  // router.replace que cancelaría esta navegación. Al cambiar de ruta, el
  // calendario (y su Sheet) se desmontan solos.
  const goToDetail = () =>
    router.push(
      `/org/${orgId}/branches/${sessionBranchId}/sessions/${session.id}`,
    )
  const goToAttendance = () =>
    router.push(
      `/org/${orgId}/branches/${sessionBranchId}/sessions/${session.id}/attendance`,
    )
  const goToQR = () =>
    router.push(
      `/org/${orgId}/branches/${sessionBranchId}/sessions/${session.id}/qr`,
    )

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border pt-6">
        <span className="label-mono mr-2">{t('title')}</span>
        <Button variant="default" size="sm" onClick={goToDetail}>
          <ArrowUpRight className="h-3.5 w-3.5" />
          {t('viewDetail')}
        </Button>
        {canManage && (
          <Button
            variant="outline"
            size="sm"
            disabled={!isEditable}
            title={!isEditable ? t('notAvailableForStatus') : undefined}
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
            {t('edit')}
          </Button>
        )}
        {canManage && (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled={!canCancel}
            title={!canCancel ? tCancel('notAllowed') : undefined}
            onClick={() => setCancelOpen(true)}
          >
            <Ban className="h-3.5 w-3.5" />
            {t('cancel')}
          </Button>
        )}
        {canValidate && (
          <Button
            variant="outline"
            size="sm"
            disabled={isCanceled}
            title={isCanceled ? t('notAvailableForStatus') : undefined}
            onClick={goToAttendance}
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
            {t('markAttendance')}
          </Button>
        )}
        {canValidate && (
          <Button
            variant="outline"
            size="sm"
            disabled={isCanceled}
            title={isCanceled ? t('notAvailableForStatus') : undefined}
            onClick={goToQR}
          >
            <QrCode className="h-3.5 w-3.5" />
            {t('generateQr')}
          </Button>
        )}
        {canSuggest && (
          <Button
            variant="outline"
            size="sm"
            disabled={isCanceled}
            title={isCanceled ? t('notAvailableForStatus') : undefined}
            onClick={() => setSuggestOpen(true)}
          >
            <Send className="h-3.5 w-3.5" />
            {t('suggestAttendance')}
          </Button>
        )}
      </div>

      <SessionDialog
        mode="edit"
        open={editOpen}
        onOpenChange={setEditOpen}
        sessionId={session.id}
      />

      <CancelSessionDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        sessionId={session.id}
        sessionTitle={session.title}
        sessionStartAt={session.startAt}
        sessionEndAt={session.endAt}
        onSuccess={() => onClose?.()}
      />

      {/* Desde el Sheet no cargamos el roster: excludeStudentIds vacío. El
          backend deduplica sugerencias ya existentes (alreadySuggested). */}
      {canSuggest && orgId && sessionBranchId && (
        <SuggestAttendanceDialog
          open={suggestOpen}
          onOpenChange={setSuggestOpen}
          sessionId={session.id}
          branchId={sessionBranchId}
          orgId={orgId}
          excludeStudentIds={[]}
        />
      )}
    </>
  )
}

// ── Skeleton ──────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="p-8">
      <div className="space-y-3">
        <div className="h-3 w-28 rounded-md bg-muted/60 animate-pulse" />
        <div className="h-7 w-64 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-56 rounded-md bg-muted/60 animate-pulse" />
      </div>
      <div className="mt-6 space-y-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2 border-t border-border pt-6">
            <div className="h-3 w-20 rounded bg-muted/60 animate-pulse" />
            <div className="h-10 w-full rounded bg-muted/40 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

type Formatter = ReturnType<typeof useFormatter>

function formatLongDate(format: Formatter, iso: string): string {
  try {
    return format.dateTime(new Date(iso), {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

function formatTime(format: Formatter, iso: string): string {
  try {
    return format.dateTime(new Date(iso), {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}
