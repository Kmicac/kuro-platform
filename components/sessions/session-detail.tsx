'use client'

import {
  AlertCircle,
  Ban,
  CalendarDays,
  ClipboardCheck,
  Clock,
  GraduationCap,
  Pencil,
  UserRound,
  Users,
} from 'lucide-react'
import {
  TextureCard,
  TextureCardContent,
} from '@/components/ui/texture-card'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api/client'
import { useSession } from '@/lib/hooks/use-sessions'
import {
  BeltBadge,
  ClassTypeChip,
  RoleBadge,
  SessionStatusBadge,
  classTypeLabel,
} from '@/components/kuro'
import {
  EmptyState,
  ErrorState,
  ForbiddenState,
  PageHeader,
} from '@/components/shared'
import type {
  ClassSessionAttendanceCounts,
  ClassSessionCapacity,
  ClassSessionDetail as ClassSessionDetailType,
  ClassSessionInstructor,
  ClassSessionStatus,
} from '@/lib/api/types'
import { cn } from '@/lib/utils'

export interface SessionDetailProps {
  sessionId: string
}

export function SessionDetail({ sessionId }: SessionDetailProps) {
  const query = useSession(sessionId)

  if (query.isLoading) return <DetailSkeleton />

  if (query.error instanceof ApiError && query.error.status === 403) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <ForbiddenState
          title="Sin acceso a la sesión"
          description="No tenés permisos para ver esta clase."
        />
      </div>
    )
  }

  if (query.error instanceof ApiError && query.error.status === 404) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <EmptyState
          icon={CalendarDays}
          title="Sesión no encontrada"
          description="La clase no existe o pertenece a otra filial."
        />
      </div>
    )
  }

  if (query.error) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      </div>
    )
  }

  const session = query.data
  if (!session) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <EmptyState
          icon={AlertCircle}
          title="Sin datos"
          description="Esta sesión no tiene información disponible."
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <Header session={session} />

      {session.status === 'CANCELED' && (
        <CancellationCard session={session} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <InstructorCard instructor={session.instructor} />
        <CapacityCard capacity={session.capacity} />
        <AttendanceCard
          attendance={session.attendance}
          status={session.status}
        />
      </div>

      <ActionsBar session={session} />
    </div>
  )
}

// ── Header ─────────────────────────────────────────────────

function Header({ session }: { session: ClassSessionDetailType }) {
  return (
    <PageHeader
      eyebrow={classTypeLabel(session.classType).toUpperCase()}
      title={session.title}
      subtitle={
        <span className="inline-flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatLongDate(session.startAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {formatTime(session.startAt)} – {formatTime(session.endAt)}
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

function CancellationCard({ session }: { session: ClassSessionDetailType }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3"
    >
      <Ban className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">
          Clase cancelada
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {session.cancellationReason ?? 'Sin motivo registrado.'}
        </p>
        {session.cancelledAt && (
          <p className="text-[11px] text-muted-foreground/80 mt-1 tabular-nums">
            Cancelada el {formatLongDate(session.cancelledAt)} ·{' '}
            {formatTime(session.cancelledAt)}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Instructor ─────────────────────────────────────────────

function InstructorCard({
  instructor,
}: {
  instructor: ClassSessionInstructor | null
}) {
  return (
    <SectionCard title="Instructor" icon={GraduationCap}>
      {instructor ? (
        <div className="flex items-start gap-3">
          <Avatar initials={initialsFor(instructor)} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">
              {instructor.firstName} {instructor.lastName}
            </p>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <RoleBadge role={instructor.role} />
              <BeltBadge rank={instructor.primaryBelt} size="sm" />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <UserRound className="h-4 w-4" />
          Sin instructor asignado
        </div>
      )}
    </SectionCard>
  )
}

function Avatar({ initials }: { initials: string }) {
  return (
    <span
      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
      style={{
        background: 'color-mix(in srgb, var(--primary) 14%, transparent)',
        color: 'var(--primary)',
        border:
          '0.5px solid color-mix(in srgb, var(--primary) 30%, transparent)',
      }}
    >
      {initials || '—'}
    </span>
  )
}

// ── Capacidad ──────────────────────────────────────────────

function CapacityCard({ capacity }: { capacity: ClassSessionCapacity }) {
  const ratio = capacity.max > 0 ? capacity.enrolled / capacity.max : 0
  const pct = Math.min(100, Math.round(ratio * 100))

  const barColor =
    ratio > 0.9
      ? 'bg-destructive'
      : ratio >= 0.7
        ? 'bg-amber-500'
        : 'bg-primary'

  const labelColor =
    ratio > 0.9
      ? 'text-destructive'
      : ratio >= 0.7
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-foreground'

  return (
    <SectionCard title="Capacidad" icon={Users}>
      <div className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              'text-3xl font-semibold tabular-nums leading-none',
              labelColor
            )}
          >
            {capacity.enrolled}
          </span>
          <span className="text-sm text-muted-foreground">
            / {capacity.max}
          </span>
          <span className="ml-auto text-xs text-muted-foreground tabular-nums">
            {pct}%
          </span>
        </div>

        <div
          className="h-2 w-full rounded-full bg-muted overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={capacity.max}
          aria-valuenow={capacity.enrolled}
        >
          <div
            className={cn('h-full transition-all', barColor)}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* waitlist: oculta cuando es 0 (siempre 0 hoy — no hay dominio) */}
        {capacity.waitlist > 0 && (
          <p className="text-xs text-muted-foreground">
            +{capacity.waitlist} en lista de espera
          </p>
        )}
      </div>
    </SectionCard>
  )
}

// ── Asistencia ─────────────────────────────────────────────

function AttendanceCard({
  attendance,
  status,
}: {
  attendance: ClassSessionAttendanceCounts
  status: ClassSessionStatus
}) {
  const notRecorded = status === 'SCHEDULED' && attendance.present === 0

  const cells: {
    label: string
    value: number
    tone: 'neutral' | 'success' | 'warning' | 'destructive' | 'muted'
  }[] = [
    { label: 'Esperados',    value: attendance.expected, tone: 'neutral' },
    { label: 'Presentes',    value: attendance.present,  tone: 'success' },
    { label: 'Ausentes',     value: attendance.absent,   tone: 'destructive' },
    { label: 'Justificados', value: attendance.excused,  tone: 'muted' },
    { label: 'Tarde',        value: attendance.late,     tone: 'warning' },
  ]

  return (
    <SectionCard title="Asistencia" icon={ClipboardCheck}>
      <div className="grid grid-cols-5 gap-2">
        {cells.map((c) => (
          <div
            key={c.label}
            className="rounded-lg border border-border bg-card px-2 py-2 text-center"
          >
            <p
              className={cn(
                'text-xl font-semibold tabular-nums leading-none',
                toneColor(c.tone)
              )}
            >
              {c.value}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">
              {c.label}
            </p>
          </div>
        ))}
      </div>
      {notRecorded && (
        <p className="text-xs text-muted-foreground italic">
          Asistencia aún no registrada.
        </p>
      )}
    </SectionCard>
  )
}

function toneColor(tone: 'neutral' | 'success' | 'warning' | 'destructive' | 'muted') {
  switch (tone) {
    case 'success':
      return 'text-emerald-600 dark:text-emerald-400'
    case 'warning':
      return 'text-amber-600 dark:text-amber-400'
    case 'destructive':
      return 'text-destructive'
    case 'muted':
      return 'text-muted-foreground'
    default:
      return 'text-foreground'
  }
}

// ── Acciones ───────────────────────────────────────────────

function ActionsBar({ session }: { session: ClassSessionDetailType }) {
  const canCancel = session.status === 'SCHEDULED'

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mr-2">
        Acciones
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled
        title="Próximamente"
        aria-label="Editar clase (próximamente)"
      >
        <Pencil className="h-3.5 w-3.5" />
        Editar
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled
        title={canCancel ? 'Próximamente' : 'No disponible para este estado'}
        aria-label="Cancelar clase (próximamente)"
      >
        <Ban className="h-3.5 w-3.5" />
        Cancelar clase
      </Button>
      <Button
        variant="default"
        size="sm"
        disabled
        title="Próximamente"
        aria-label="Marcar asistencia (próximamente)"
      >
        <ClipboardCheck className="h-3.5 w-3.5" />
        Marcar asistencia
      </Button>
    </div>
  )
}

// ── Section primitive ──────────────────────────────────────

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <TextureCard>
      <TextureCardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
          <p className="text-sm font-semibold text-foreground">{title}</p>
        </div>
        {children}
      </TextureCardContent>
    </TextureCard>
  )
}

// ── Skeleton ──────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="space-y-3">
        <div className="h-3 w-32 rounded-md bg-muted/60 animate-pulse" />
        <div className="h-7 w-80 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-64 rounded-md bg-muted/60 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-40 rounded-[24px] bg-muted/40 animate-pulse"
          />
        ))}
      </div>
      <div className="h-10 w-72 rounded-md bg-muted/40 animate-pulse" />
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────

function initialsFor(instructor: ClassSessionInstructor): string {
  const a = instructor.firstName?.[0] ?? ''
  const b = instructor.lastName?.[0] ?? ''
  return `${a}${b}`.toUpperCase()
}

function formatLongDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-AR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}
