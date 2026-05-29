'use client'

import Link from 'next/link'
import {
  Award,
  Calendar,
  ClipboardCheck,
  Hash,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
  UserCircle2,
  Users,
} from 'lucide-react'
import {
  TextureCard,
  TextureCardContent,
} from '@/components/ui/texture-card'
import { ApiError } from '@/lib/api/client'
import { usePromotionRankResolver, useStudent } from '@/lib/hooks'
import { BeltBadge, StatusBadge } from '@/components/kuro'
import { ErrorState, PageHeader } from '@/components/shared'
import type { StudentDetail as StudentDetailType } from '@/lib/api/types'
import { cn } from '@/lib/utils'

interface StudentDetailProps {
  orgId: string
  studentId: string
}

export function StudentDetail({ orgId, studentId }: StudentDetailProps) {
  const query = useStudent(orgId, studentId)
  const resolveBelt = usePromotionRankResolver()

  if (query.isLoading) {
    return <DetailSkeleton />
  }

  if (query.error instanceof ApiError && query.error.status === 403) {
    return (
      <CenteredState
        icon={Lock}
        title="Sin acceso a esta ficha"
        description="No tenés permisos para ver los datos de este alumno."
        backHref={`/org/${orgId}`}
      />
    )
  }

  if (query.error instanceof ApiError && query.error.status === 404) {
    return (
      <CenteredState
        icon={User}
        title="Alumno no encontrado"
        description="La ficha no existe o pertenece a otra organización."
        backHref={`/org/${orgId}`}
      />
    )
  }

  if (query.error) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      </div>
    )
  }

  const student = query.data
  if (!student) return null

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <Header
        student={student}
        orgId={orgId}
        beltEntry={resolveBelt(student.currentBelt)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <BjjJourneyCard student={student} />
          <TechnicalNotesCard notes={student.technicalNotes} />
          <CertificatesCard
            count={student.promotionCertificates?.length ?? 0}
          />
        </div>
        <div className="space-y-4">
          <IdentityCard student={student} />
          <GuardianCard student={student} />
          <BranchAssignmentCard
            student={student}
            primaryBranchName={primaryBranchName(student)}
            orgId={orgId}
          />
        </div>
      </div>
    </div>
  )
}

// ── Header ─────────────────────────────────────────────────

function Header({
  student,
  orgId,
  beltEntry,
}: {
  student: StudentDetailType
  orgId: string
  beltEntry: import('@/lib/api/types').PromotionRankCatalogEntry | null
}) {
  const fullName = `${student.firstName} ${student.lastName}`.trim()
  const initials = `${student.firstName[0] ?? ''}${student.lastName[0] ?? ''}`
  const branchName = primaryBranchName(student)

  const breadcrumbs = [
    { label: 'Organización', href: `/org/${orgId}` },
    ...(student.primaryBranchId
      ? [
          {
            label: 'Alumnos',
            href: `/org/${orgId}/branches/${student.primaryBranchId}/students`,
          },
        ]
      : []),
    { label: fullName },
  ]

  return (
    <PageHeader
      breadcrumbs={breadcrumbs}
      title={fullName}
      subtitle={
        <span className="inline-flex items-center gap-3 flex-wrap">
          {branchName && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {branchName}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <ClipboardCheck className="h-3.5 w-3.5" />
            {humanizeTrack(student.promotionTrack)}
          </span>
        </span>
      }
      meta={
        <div className="flex items-center gap-3 flex-wrap">
          <BigAvatar initials={initials} />
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={student.status} />
            <BeltBadge
              rank={beltEntry}
              stripes={student.currentStripes}
            />
          </div>
        </div>
      }
    />
  )
}

function BigAvatar({ initials }: { initials: string }) {
  return (
    <span
      className="w-14 h-14 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0"
      style={{
        background: 'color-mix(in srgb, var(--primary) 14%, transparent)',
        color: 'var(--primary)',
        border:
          '0.5px solid color-mix(in srgb, var(--primary) 30%, transparent)',
      }}
    >
      {initials.toUpperCase() || '—'}
    </span>
  )
}

// ── Cards ──────────────────────────────────────────────────

function BjjJourneyCard({ student }: { student: StudentDetailType }) {
  const items = [
    { label: 'Inicio en BJJ', value: formatDate(student.startedBjjAt) ?? '—' },
    {
      label: 'Ingreso a la organización',
      value: formatDate(student.joinedOrganizationAt) ?? '—',
    },
    {
      label: 'Última actualización',
      value: formatDate(student.updatedAt) ?? '—',
    },
  ]
  return (
    <SectionCard title="Trayectoria BJJ" icon={Award}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.map((it) => (
          <div key={it.label}>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {it.label}
            </p>
            <p className="text-sm font-medium text-foreground mt-1">
              {it.value}
            </p>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

function TechnicalNotesCard({ notes }: { notes: string | null }) {
  return (
    <SectionCard title="Notas técnicas" icon={ClipboardCheck}>
      {notes ? (
        <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
          {notes}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          Sin notas técnicas registradas todavía.
        </p>
      )}
    </SectionCard>
  )
}

function CertificatesCard({ count }: { count: number }) {
  return (
    <SectionCard title="Certificados de promoción" icon={Award}>
      {count > 0 ? (
        <p className="text-sm text-foreground">
          <span className="text-2xl font-semibold tabular-nums">{count}</span>{' '}
          <span className="text-muted-foreground">
            {count === 1 ? 'certificado emitido' : 'certificados emitidos'}
          </span>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Aún no hay certificados emitidos para este alumno.
        </p>
      )}
    </SectionCard>
  )
}

function IdentityCard({ student }: { student: StudentDetailType }) {
  const items: {
    label: string
    value: React.ReactNode
    icon: React.ComponentType<{ className?: string }>
  }[] = [
    {
      label: 'Email',
      icon: Mail,
      value: (
        <a
          href={`mailto:${student.email}`}
          className="text-foreground hover:text-primary break-all"
        >
          {student.email}
        </a>
      ),
    },
    { label: 'Teléfono', icon: Phone, value: student.phone ?? '—' },
    {
      label: 'Fecha de nacimiento',
      icon: Calendar,
      value: formatDate(student.dateOfBirth) ?? '—',
    },
    {
      label: 'ID interno',
      icon: Hash,
      value: <code className="font-mono text-xs">{student.id}</code>,
    },
  ]
  return (
    <SectionCard title="Identidad" icon={UserCircle2}>
      <ul className="space-y-3">
        {items.map(({ label, value, icon: Icon }) => (
          <li key={label} className="flex items-start gap-2.5">
            <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <div className="text-sm mt-0.5">{value}</div>
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  )
}

function GuardianCard({ student }: { student: StudentDetailType }) {
  const hasGuardian =
    student.parentTutorName ||
    student.parentTutorPhone ||
    student.parentTutorRelation
  return (
    <SectionCard title="Tutor responsable" icon={Users}>
      {hasGuardian ? (
        <ul className="space-y-2.5 text-sm">
          {student.parentTutorName && (
            <li>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Nombre
              </p>
              <p className="text-foreground mt-0.5">
                {student.parentTutorName}
              </p>
            </li>
          )}
          {student.parentTutorRelation && (
            <li>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Relación
              </p>
              <p className="text-foreground mt-0.5">
                {student.parentTutorRelation}
              </p>
            </li>
          )}
          {student.parentTutorPhone && (
            <li>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Teléfono
              </p>
              <p className="text-foreground mt-0.5 flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-muted-foreground" />
                {student.parentTutorPhone}
              </p>
            </li>
          )}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          Sin tutor responsable registrado.
        </p>
      )}
    </SectionCard>
  )
}

function BranchAssignmentCard({
  student,
  primaryBranchName,
  orgId,
}: {
  student: StudentDetailType
  primaryBranchName: string | null
  orgId: string
}) {
  const assignments = student.branchAssignments?.length ?? 0
  const visits = student.branchVisits?.length ?? 0
  return (
    <SectionCard title="Asignación de filial" icon={MapPin}>
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Filial principal
          </p>
          {primaryBranchName ? (
            <Link
              href={`/org/${orgId}/branches/${student.primaryBranchId}`}
              className="text-foreground hover:text-primary font-medium mt-0.5 inline-block"
            >
              {primaryBranchName}
            </Link>
          ) : (
            <p className="text-muted-foreground mt-0.5">—</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Asignaciones activas
            </p>
            <p className="text-lg font-semibold tabular-nums mt-0.5">
              {assignments}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Visitas registradas
            </p>
            <p className="text-lg font-semibold tabular-nums mt-0.5">
              {visits}
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

// ── Section primitives ─────────────────────────────────────

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

// ── Skeleton / centered state ──────────────────────────────

function DetailSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="space-y-3">
        <div className="h-3 w-40 rounded-md bg-muted/60 animate-pulse" />
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-64 rounded-md bg-muted animate-pulse" />
            <div className="h-3 w-40 rounded-md bg-muted/60 animate-pulse" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn(
              'h-40 rounded-[24px] bg-muted/40 animate-pulse',
              i < 3 && 'lg:col-span-2'
            )}
          />
        ))}
      </div>
    </div>
  )
}

function CenteredState({
  icon: Icon,
  title,
  description,
  backHref,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  backHref?: string
  action?: React.ReactNode
}) {
  return (
    <div className="p-6">
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-10 text-center max-w-md mx-auto">
        <Icon className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground mt-3">{title}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        <div className="mt-4 flex items-center justify-center gap-2">
          {action}
          {backHref && (
            <Link
              href={backHref}
              className="text-xs text-primary hover:underline"
            >
              ← Volver
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────

function humanizeTrack(t: string) {
  const map: Record<string, string> = {
    ADULT: 'Adultos',
    KIDS: 'Niños',
    MASTER: 'Máster',
  }
  return map[t] ?? t
}

function formatDate(iso?: string | null) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return null
  }
}

function primaryBranchName(student: StudentDetailType): string | null {
  const pb = student.primaryBranch as { name?: string } | null | undefined
  return pb?.name ?? null
}

