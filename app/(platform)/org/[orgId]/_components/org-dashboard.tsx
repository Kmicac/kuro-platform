'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Building2,
  Users,
  Calendar,
  Inbox,
  AlertCircle,
  Lock,
} from 'lucide-react'
import {
  TextureCard,
  TextureCardContent,
} from '@/components/ui/texture-card'
import { ApiError, analyticsApi, organizationsApi } from '@/lib/api/client'
import { cn } from '@/lib/utils'

interface OrgDashboardProps {
  orgId: string
}

export function OrgDashboard({ orgId }: OrgDashboardProps) {
  const orgQuery = useQuery({
    queryKey: ['organization', orgId],
    queryFn: () => organizationsApi.get(orgId),
  })

  const treeQuery = useQuery({
    queryKey: ['analytics', 'tree-summary', orgId],
    queryFn: () => analyticsApi.treeSummary(orgId),
  })

  const totals = treeQuery.data?.totals
  const branches = treeQuery.data?.branches ?? []

  const totalBranches =
    totals?.branches ?? (treeQuery.data ? branches.length : undefined)

  const sum = (key: 'activeStudents' | 'classesToday' | 'pendingIntake') =>
    totals?.[key] ??
    (treeQuery.data
      ? branches.reduce((acc, b) => acc + (b[key] ?? 0), 0)
      : undefined)

  const cards: StatCardConfig[] = [
    {
      label: 'Total filiales',
      value: totalBranches,
      icon: Building2,
      hint: 'Filiales activas en la organización',
    },
    {
      label: 'Alumnos activos',
      value: sum('activeStudents'),
      icon: Users,
      hint: 'Membresías al día',
    },
    {
      label: 'Clases hoy',
      value: sum('classesToday'),
      icon: Calendar,
      hint: 'Sesiones programadas para hoy',
    },
    {
      label: 'Intake pendiente',
      value: sum('pendingIntake'),
      icon: Inbox,
      hint: 'Solicitudes esperando revisión',
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        orgName={orgQuery.data?.name}
        orgSlug={orgQuery.data?.slug}
        isLoading={orgQuery.isLoading}
        error={orgQuery.error}
      />

      <section
        aria-label="Indicadores principales"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {cards.map((card) => (
          <StatCard
            key={card.label}
            config={card}
            isLoading={treeQuery.isLoading}
            error={treeQuery.error}
          />
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PanelPlaceholder
          title="Resumen por filial"
          description={
            treeQuery.isLoading
              ? 'Cargando filiales...'
              : branches.length === 0
                ? 'Todavía no hay filiales registradas en esta organización.'
                : `${branches.length} ${branches.length === 1 ? 'filial' : 'filiales'} conectadas — vista detallada próximamente.`
          }
        />
        <PanelPlaceholder
          title="Actividad reciente"
          description={`Próximo paso — conectar GET /organizations/${orgId}/audit`}
        />
      </div>
    </div>
  )
}

// ── Header ─────────────────────────────────────────────────

interface DashboardHeaderProps {
  orgName?: string
  orgSlug?: string
  isLoading: boolean
  error: unknown
}

function DashboardHeader({
  orgName,
  orgSlug,
  isLoading,
  error,
}: DashboardHeaderProps) {
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
      <header>
        <h1 className="text-xl font-semibold text-foreground">
          Sin acceso a esta organización
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          No tenés permisos para ver este panel.
        </p>
      </header>
    )
  }

  return (
    <header>
      <p className="text-[11px] tracking-widest uppercase text-muted-foreground font-medium">
        Organización
      </p>
      <h1 className="text-xl font-semibold text-foreground mt-1">
        {orgName ?? 'Dashboard'}
      </h1>
      <p className="text-sm text-muted-foreground mt-0.5">
        {orgSlug
          ? `Vista completa de todas las filiales · ${orgSlug}`
          : 'Vista completa de todas las filiales'}
      </p>
    </header>
  )
}

// ── Stat card ──────────────────────────────────────────────

interface StatCardConfig {
  label: string
  value: number | undefined
  icon: React.ComponentType<{ className?: string }>
  hint: string
}

interface StatCardProps {
  config: StatCardConfig
  isLoading: boolean
  error: unknown
}

function StatCard({ config, isLoading, error }: StatCardProps) {
  const { label, value, icon: Icon, hint } = config

  const status = resolveStatStatus({ isLoading, error, value })

  return (
    <TextureCard>
      <TextureCardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            <StatValue status={status} value={value} />
          </div>
          <span
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-md',
              'bg-primary/10 text-primary'
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          {status === 'error'
            ? 'No se pudo cargar este indicador.'
            : status === 'forbidden'
              ? 'Sin permiso para ver este dato.'
              : hint}
        </p>
      </TextureCardContent>
    </TextureCard>
  )
}

type StatStatus = 'loading' | 'forbidden' | 'error' | 'empty' | 'ready'

function resolveStatStatus({
  isLoading,
  error,
  value,
}: {
  isLoading: boolean
  error: unknown
  value: number | undefined
}): StatStatus {
  if (isLoading) return 'loading'
  if (error instanceof ApiError && error.status === 403) return 'forbidden'
  if (error) return 'error'
  if (value == null) return 'empty'
  return 'ready'
}

function StatValue({
  status,
  value,
}: {
  status: StatStatus
  value: number | undefined
}) {
  if (status === 'loading') {
    return <div className="h-7 w-16 rounded-md bg-muted animate-pulse mt-1" />
  }

  if (status === 'forbidden') {
    return (
      <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground mt-1">
        <Lock className="h-3.5 w-3.5" /> Restringido
      </p>
    )
  }

  if (status === 'error') {
    return (
      <p className="flex items-center gap-1.5 text-sm font-medium text-destructive mt-1">
        <AlertCircle className="h-3.5 w-3.5" /> Error
      </p>
    )
  }

  return (
    <p className="text-2xl font-semibold text-foreground tabular-nums mt-1">
      {(value ?? 0).toLocaleString('es-AR')}
    </p>
  )
}

// ── Panel placeholder ──────────────────────────────────────

function PanelPlaceholder({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <TextureCard>
      <TextureCardContent className="p-5">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-1.5">{description}</p>
      </TextureCardContent>
    </TextureCard>
  )
}
