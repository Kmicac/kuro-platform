'use client'

import Link from 'next/link'
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Calendar,
  ChevronRight,
  Inbox,
  Lock,
  Users,
} from 'lucide-react'
import {
  TextureCard,
  TextureCardContent,
} from '@/components/ui/texture-card'
import { Badge } from '@/components/ui/badge'
import { ApiError } from '@/lib/api/client'
import { useOrganization, useTreeSummary } from '@/lib/hooks'
import { EmptyState, KpiCard, PageHeader } from '@/components/shared'
import type { TreeSummaryBranchNode } from '@/lib/api/types'
import { cn } from '@/lib/utils'

interface OrgDashboardProps {
  orgId: string
}

export function OrgDashboard({ orgId }: OrgDashboardProps) {
  const orgQuery = useOrganization(orgId)
  const treeQuery = useTreeSummary(orgId)

  const totals = treeQuery.data?.totals
  const branches = treeQuery.data?.branches ?? []

  const totalBranches =
    totals?.branches ?? (treeQuery.data ? branches.length : undefined)

  const sumBranches = (
    pick: (b: TreeSummaryBranchNode) => number | undefined
  ) =>
    treeQuery.data
      ? branches.reduce((acc, b) => acc + (pick(b) ?? 0), 0)
      : undefined

  const activeStudents =
    totals?.activeStudents ??
    sumBranches((b) => b.population?.activeStudentsTotal)

  const classesToday =
    totals?.classesToday ?? sumBranches((b) => b.classes?.todayCount)

  const pendingIntake =
    totals?.pendingIntake ?? sumBranches((b) => b.requests?.pendingIntake)

  return (
    <div className="p-6 space-y-6">
      <HeaderSection
        orgName={orgQuery.data?.name}
        orgSlug={orgQuery.data?.slug}
        isLoading={orgQuery.isLoading}
        error={orgQuery.error}
      />

      <section
        aria-label="Indicadores principales"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <KpiCard
          label="Total filiales"
          value={totalBranches}
          icon={Building2}
          hint="Filiales activas en la organización"
          isLoading={treeQuery.isLoading}
          error={treeQuery.error}
        />
        <KpiCard
          label="Alumnos activos"
          value={activeStudents}
          icon={Users}
          hint="Membresías al día"
          isLoading={treeQuery.isLoading}
          error={treeQuery.error}
        />
        <KpiCard
          label="Clases hoy"
          value={classesToday}
          icon={Calendar}
          hint="Sesiones programadas para hoy"
          isLoading={treeQuery.isLoading}
          error={treeQuery.error}
        />
        <KpiCard
          label="Intake pendiente"
          value={pendingIntake}
          icon={Inbox}
          hint="Solicitudes esperando revisión"
          isLoading={treeQuery.isLoading}
          error={treeQuery.error}
        />
      </section>

      <BranchListSection
        orgId={orgId}
        branches={branches}
        isLoading={treeQuery.isLoading}
        error={treeQuery.error}
      />
    </div>
  )
}

// ── Header ─────────────────────────────────────────────────

function HeaderSection({
  orgName,
  orgSlug,
  isLoading,
  error,
}: {
  orgName?: string
  orgSlug?: string
  isLoading: boolean
  error: unknown
}) {
  if (isLoading) {
    return (
      <header className="space-y-2">
        <div className="h-6 w-64 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-80 rounded-md bg-muted/60 animate-pulse" />
      </header>
    )
  }

  if (error instanceof ApiError && error.status === 403) {
    return (
      <PageHeader
        title="Sin acceso a esta organización"
        subtitle="No tenés permisos para ver este panel."
      />
    )
  }

  return (
    <PageHeader
      eyebrow="Organización"
      title={orgName ?? 'Dashboard'}
      subtitle={
        orgSlug
          ? `Vista completa de todas las filiales · ${orgSlug}`
          : 'Vista completa de todas las filiales'
      }
    />
  )
}

// ── Branch list ────────────────────────────────────────────

function BranchListSection({
  orgId,
  branches,
  isLoading,
  error,
}: {
  orgId: string
  branches: TreeSummaryBranchNode[]
  isLoading: boolean
  error: unknown
}) {
  return (
    <section aria-label="Filiales" className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Filiales</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Seleccioná una filial para abrir su tablero operativo.
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-28 rounded-[24px] bg-muted/50 animate-pulse"
            />
          ))}
        </div>
      )}

      {error instanceof ApiError && error.status === 403 && (
        <EmptyState
          icon={Lock}
          title="Sin permisos sobre filiales"
          description="Tu rol no permite listar filiales de esta organización."
        />
      )}

      {Boolean(error) &&
        !(error instanceof ApiError && error.status === 403) && (
          <EmptyState
            icon={AlertCircle}
            title="No se pudo cargar el listado"
            description="Revisá la conexión e intentá nuevamente."
          />
        )}

      {!isLoading && !error && branches.length === 0 && (
        <EmptyState
          icon={Building2}
          title="Sin filiales todavía"
          description="No hay filiales registradas en esta organización."
        />
      )}

      {!isLoading && !error && branches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {branches.map((b) => (
            <BranchCard key={b.id} orgId={orgId} branch={b} />
          ))}
        </div>
      )}
    </section>
  )
}

function BranchCard({
  orgId,
  branch,
}: {
  orgId: string
  branch: TreeSummaryBranchNode
}) {
  const stats = [
    { label: 'Activos', value: branch.population?.activeStudentsTotal },
    { label: 'Clases hoy', value: branch.classes?.todayCount },
    { label: 'Intake', value: branch.requests?.pendingIntake },
  ]
  const needsReview = Boolean(branch.attention?.needsReview)

  return (
    <Link href={`/org/${orgId}/branches/${branch.id}`} className="block group">
      <TextureCard className="transition-transform group-hover:-translate-y-0.5">
        <TextureCardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground truncate">
                  {branch.name}
                </p>
                {branch.isHeadquarter && (
                  <Badge variant="outline" className="text-[10px]">
                    HQ
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {branch.city ?? branch.slug ?? '—'}
              </p>
            </div>
            <BranchStatusDot status={branch.status} />
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {s.label}
                </p>
                <p className="text-sm font-semibold text-foreground tabular-nums">
                  {s.value != null ? s.value.toLocaleString('es-AR') : '—'}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
            {needsReview ? (
              <span className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                Requiere revisión
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">
                Sin alertas
              </span>
            )}
            <span className="flex items-center gap-0.5 text-[11px] font-medium text-primary group-hover:gap-1 transition-all">
              Abrir
              <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </TextureCardContent>
      </TextureCard>
    </Link>
  )
}

function BranchStatusDot({ status }: { status?: string }) {
  const normalized = (status ?? 'ACTIVE').toUpperCase()
  const tone =
    normalized === 'SUSPENDED'
      ? 'bg-amber-500'
      : normalized === 'INACTIVE'
        ? 'bg-muted-foreground/40'
        : 'bg-primary'
  return (
    <span
      title={normalized}
      aria-label={`Estado ${normalized}`}
      className={cn('h-2 w-2 rounded-full flex-shrink-0 mt-1.5', tone)}
    />
  )
}
