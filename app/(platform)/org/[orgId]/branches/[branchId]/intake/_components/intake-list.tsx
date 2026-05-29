'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Inbox,
  Mail,
  Phone,
  Search,
  X,
} from 'lucide-react'
import {
  TextureCard,
  TextureCardContent,
} from '@/components/ui/texture-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api/client'
import { useBranch, useIntakeRequests } from '@/lib/hooks'
import { IntakeStatusBadge } from '@/components/kuro'
import {
  EmptyState,
  ErrorState,
  ForbiddenState,
  PageHeader,
} from '@/components/shared'
import type { IntakeRequest, IntakeStatus } from '@/lib/api/types'
import { cn } from '@/lib/utils'

interface IntakeListProps {
  orgId: string
  branchId: string
}

const PAGE_SIZE = 20

const STATUS_FILTERS: { value: IntakeStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'NEW', label: 'Nuevas' },
  { value: 'REVIEWING', label: 'En revisión' },
  { value: 'CONTACTED', label: 'Contactadas' },
  { value: 'VISIT_SCHEDULED', label: 'Con visita' },
  { value: 'READY_TO_CONVERT', label: 'Listas' },
  { value: 'CONVERTED', label: 'Convertidas' },
]

export function IntakeList({ orgId, branchId }: IntakeListProps) {
  const [status, setStatus] = useState<IntakeStatus | 'ALL'>('NEW')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const branchQuery = useBranch(orgId, branchId)
  const listQuery = useIntakeRequests(orgId, branchId, {
    page,
    limit: PAGE_SIZE,
    status: status === 'ALL' ? undefined : status,
  })

  const items = useMemo(() => listQuery.data?.items ?? [], [listQuery.data])
  const meta = listQuery.data?.meta

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (it) =>
        it.fullName.toLowerCase().includes(q) ||
        it.email.toLowerCase().includes(q) ||
        (it.phone ?? '').toLowerCase().includes(q)
    )
  }, [items, search])

  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Organización', href: `/org/${orgId}` },
          {
            label: branchQuery.data?.name ?? '…',
            href: `/org/${orgId}/branches/${branchId}`,
          },
          { label: 'Academy Intake' },
        ]}
        title="Academy Intake"
        subtitle="Solicitudes de ingreso de prospectos a esta filial."
        meta={
          meta?.total != null && (
            <Badge variant="outline" className="text-xs">
              {meta.total.toLocaleString('es-AR')} solicitudes
            </Badge>
          )
        }
      />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((f) => {
            const active = f.value === status
            return (
              <button
                key={f.value}
                onClick={() => {
                  setStatus(f.value)
                  setPage(1)
                }}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors border',
                  active
                    ? 'bg-primary/15 text-primary border-primary/30'
                    : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {f.label}
              </button>
            )
          })}

          <div className="ml-auto relative w-full max-w-xs">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, email o teléfono"
              className="w-full pl-8 pr-8 py-1.5 text-xs rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <ListBody
          isLoading={listQuery.isLoading}
          error={listQuery.error}
          items={filteredItems}
          rawCount={items.length}
          search={search}
          onRetry={() => listQuery.refetch()}
          orgId={orgId}
        />

        {meta && meta.total > 0 && !listQuery.error && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={meta.total}
            isFetching={listQuery.isFetching}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        )}
      </div>
    </div>
  )
}

// ── List body ──────────────────────────────────────────────

function ListBody({
  isLoading,
  error,
  items,
  rawCount,
  search,
  onRetry,
  orgId,
}: {
  isLoading: boolean
  error: unknown
  items: IntakeRequest[]
  rawCount: number
  search: string
  onRetry: () => void
  orgId: string
}) {
  if (isLoading) {
    return (
      <TextureCard>
        <TextureCardContent className="p-3 space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-14 rounded-lg bg-muted/50 animate-pulse"
            />
          ))}
        </TextureCardContent>
      </TextureCard>
    )
  }

  if (error instanceof ApiError && error.status === 403) {
    return (
      <ForbiddenState
        title="Sin acceso a las solicitudes"
        description="No tenés permisos para ver el intake de esta filial."
      />
    )
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />
  }

  if (items.length === 0) {
    if (search && rawCount > 0) {
      return (
        <EmptyState
          icon={Search}
          title={`Sin resultados para "${search}"`}
          description="Ajustá la búsqueda o el filtro de estado."
        />
      )
    }
    return (
      <EmptyState
        icon={Inbox}
        title="Sin solicitudes en este estado"
        description="Cuando ingresen nuevas solicitudes aparecerán acá."
      />
    )
  }

  return (
    <TextureCard>
      <TextureCardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border">
                <th className="font-medium px-4 py-3">Solicitante</th>
                <th className="font-medium px-4 py-3 hidden md:table-cell">
                  Contacto
                </th>
                <th className="font-medium px-4 py-3 hidden lg:table-cell">
                  Tipo / Nivel
                </th>
                <th className="font-medium px-4 py-3">Estado</th>
                <th className="font-medium px-4 py-3 hidden md:table-cell">
                  Recibida
                </th>
                <th className="font-medium px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((it) => (
                <IntakeRow key={it.id} item={it} orgId={orgId} />
              ))}
            </tbody>
          </table>
        </div>
      </TextureCardContent>
    </TextureCard>
  )
}

function IntakeRow({ item, orgId }: { item: IntakeRequest; orgId: string }) {
  const converted = item.status === 'CONVERTED' && item.convertedStudentId
  return (
    <tr className="hover:bg-muted/40 transition-colors">
      <td className="px-4 py-3">
        <p className="font-medium text-foreground">{item.fullName}</p>
        {item.message && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-xs">
            {item.message}
          </p>
        )}
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <div className="flex flex-col gap-0.5 text-xs">
          <a
            href={`mailto:${item.email}`}
            className="flex items-center gap-1 text-foreground hover:text-primary"
          >
            <Mail className="h-3 w-3" />
            <span className="truncate max-w-[180px]">{item.email}</span>
          </a>
          {item.phone && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Phone className="h-3 w-3" />
              {item.phone}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <div className="flex flex-col gap-0.5 text-xs">
          <span className="text-foreground">
            {humanizeRequestType(item.requestType)}
          </span>
          <span className="text-muted-foreground">
            {humanizeExperience(item.experienceLevel)}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <IntakeStatusBadge status={item.status} />
      </td>
      <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground tabular-nums">
        {formatRelativeDate(item.createdAt)}
      </td>
      <td className="px-4 py-3 text-right">
        {converted ? (
          <Link
            href={`/org/${orgId}/students/${item.convertedStudentId}`}
            className="text-xs text-primary hover:underline"
          >
            Ver alumno →
          </Link>
        ) : (
          <Button variant="outline" size="xs" disabled title="Próximamente">
            Gestionar
          </Button>
        )}
      </td>
    </tr>
  )
}

// ── Pagination ─────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  total,
  isFetching,
  onPrev,
  onNext,
}: {
  page: number
  totalPages: number
  total: number
  isFetching: boolean
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
      <span>
        Página {page} de {totalPages}
        {' · '}
        <span className="tabular-nums">{total.toLocaleString('es-AR')}</span>{' '}
        solicitudes
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1 || isFetching}
          onClick={onPrev}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages || isFetching}
          onClick={onNext}
        >
          Siguiente
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────

function humanizeRequestType(t: string) {
  const map: Record<string, string> = {
    TRIAL_CLASS: 'Clase de prueba',
    MEMBERSHIP: 'Membresía',
    PRIVATE_LESSON: 'Clase privada',
    INFORMATION: 'Información general',
  }
  return map[t] ?? t
}

function humanizeExperience(e: string) {
  const map: Record<string, string> = {
    BEGINNER: 'Principiante',
    INTERMEDIATE: 'Intermedio',
    ADVANCED: 'Avanzado',
    NONE: 'Sin experiencia',
  }
  return map[e] ?? e
}

function formatRelativeDate(iso?: string | null) {
  if (!iso) return '—'
  try {
    const date = new Date(iso)
    const diffMs = Date.now() - date.getTime()
    const mins = Math.floor(diffMs / (1000 * 60))
    if (mins < 1) return 'Ahora'
    if (mins < 60) return `Hace ${mins} min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `Hace ${hours} h`
    const days = Math.floor(hours / 24)
    if (days < 30) return days === 1 ? 'Ayer' : `Hace ${days} días`
    const months = Math.floor(days / 30)
    return months === 1 ? 'Hace 1 mes' : `Hace ${months} meses`
  } catch {
    return '—'
  }
}
