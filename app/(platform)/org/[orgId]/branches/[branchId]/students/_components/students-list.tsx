'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Search,
  Users,
  X,
} from 'lucide-react'
import {
  TextureCard,
  TextureCardContent,
} from '@/components/ui/texture-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api/client'
import {
  useBranch,
  useBranchStudents,
  usePromotionRankResolver,
} from '@/lib/hooks'
import { BeltBadge, StatusBadge } from '@/components/kuro'
import {
  EmptyState,
  ErrorState,
  ForbiddenState,
  PageHeader,
} from '@/components/shared'
import type {
  PromotionRankCatalogEntry,
  StudentListItem,
  StudentStatus,
} from '@/lib/api/types'
import { cn } from '@/lib/utils'

interface StudentsListProps {
  orgId: string
  branchId: string
}

const PAGE_SIZE = 25

const STATUS_FILTERS: { value: StudentStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'ACTIVE', label: 'Activos' },
  { value: 'INACTIVE', label: 'Inactivos' },
  { value: 'SUSPENDED', label: 'Suspendidos' },
]

export function StudentsList({ orgId, branchId }: StudentsListProps) {
  const [status, setStatus] = useState<StudentStatus | 'ALL'>('ACTIVE')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const branchQuery = useBranch(orgId, branchId)
  const listQuery = useBranchStudents(orgId, branchId, {
    page,
    limit: PAGE_SIZE,
  })
  const resolveBelt = usePromotionRankResolver()

  const items = useMemo(() => listQuery.data?.items ?? [], [listQuery.data])
  const meta = listQuery.data?.meta

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((s) => {
      if (status !== 'ALL' && s.status !== status) return false
      if (!q) return true
      const haystack =
        `${s.firstName} ${s.lastName} ${s.email} ${s.phone ?? ''}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [items, status, search])

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
          { label: 'Alumnos' },
        ]}
        title="Alumnos"
        subtitle="Roster de la filial. Click en cada alumno para abrir su ficha."
        meta={
          meta?.total != null && (
            <Badge variant="outline" className="text-xs">
              {meta.total.toLocaleString('es-AR')} alumnos
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
                onClick={() => setStatus(f.value)}
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
          status={status}
          orgId={orgId}
          onRetry={() => listQuery.refetch()}
          resolveBelt={resolveBelt}
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
  status,
  orgId,
  onRetry,
  resolveBelt,
}: {
  isLoading: boolean
  error: unknown
  items: StudentListItem[]
  rawCount: number
  search: string
  status: StudentStatus | 'ALL'
  orgId: string
  onRetry: () => void
  resolveBelt: (rank: string | null | undefined) => PromotionRankCatalogEntry | null
}) {
  if (isLoading) {
    return (
      <TextureCard>
        <TextureCardContent className="p-3 space-y-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
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
        title="Sin acceso al roster"
        description="No tenés permisos para ver los alumnos de esta filial."
      />
    )
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />
  }

  if (items.length === 0) {
    if ((search || status !== 'ALL') && rawCount > 0) {
      return (
        <EmptyState
          icon={Search}
          title="Sin resultados con esos filtros"
          description="Ajustá el estado o la búsqueda para ver más alumnos."
        />
      )
    }
    return (
      <EmptyState
        icon={Users}
        title="Sin alumnos en esta filial"
        description="Cuando se den de alta nuevos alumnos aparecerán acá."
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
                <th className="font-medium px-4 py-3">Alumno</th>
                <th className="font-medium px-4 py-3">Faja</th>
                <th className="font-medium px-4 py-3 hidden lg:table-cell">
                  Programa
                </th>
                <th className="font-medium px-4 py-3 hidden md:table-cell">
                  Contacto
                </th>
                <th className="font-medium px-4 py-3">Estado</th>
                <th className="font-medium px-4 py-3 hidden lg:table-cell">
                  Alta
                </th>
                <th className="font-medium px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((s) => (
                <StudentRow
                  key={s.id}
                  student={s}
                  orgId={orgId}
                  resolveBelt={resolveBelt}
                />
              ))}
            </tbody>
          </table>
        </div>
      </TextureCardContent>
    </TextureCard>
  )
}

function StudentRow({
  student,
  orgId,
  resolveBelt,
}: {
  student: StudentListItem
  orgId: string
  resolveBelt: (rank: string | null | undefined) => PromotionRankCatalogEntry | null
}) {
  const fullName = `${student.firstName} ${student.lastName}`.trim()
  const initials = `${student.firstName[0] ?? ''}${student.lastName[0] ?? ''}`
  return (
    <tr className="hover:bg-muted/40 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar initials={initials} />
          <div className="min-w-0">
            <Link
              href={`/org/${orgId}/students/${student.id}`}
              className="font-medium text-foreground hover:text-primary truncate block"
            >
              {fullName}
            </Link>
            <p className="text-[11px] text-muted-foreground truncate font-mono">
              {student.id.slice(0, 12)}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <BeltBadge
          rank={resolveBelt(student.currentBelt)}
          stripes={student.currentStripes}
          size="sm"
        />
      </td>
      <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
        {humanizeTrack(student.promotionTrack)}
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <div className="flex flex-col gap-0.5 text-xs">
          <a
            href={`mailto:${student.email}`}
            className="flex items-center gap-1 text-foreground hover:text-primary"
          >
            <Mail className="h-3 w-3" />
            <span className="truncate max-w-[160px]">{student.email}</span>
          </a>
          {student.phone && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Phone className="h-3 w-3" />
              {student.phone}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={student.status} />
      </td>
      <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground tabular-nums">
        {formatDate(student.createdAt)}
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/org/${orgId}/students/${student.id}`}
          className="text-xs text-primary hover:underline"
        >
          Ver ficha →
        </Link>
      </td>
    </tr>
  )
}

function Avatar({ initials }: { initials: string }) {
  return (
    <span
      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
      style={{
        background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
        color: 'var(--primary)',
        border: '0.5px solid color-mix(in srgb, var(--primary) 25%, transparent)',
      }}
    >
      {initials.toUpperCase() || '—'}
    </span>
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
        alumnos
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

function humanizeTrack(t: string) {
  const map: Record<string, string> = {
    ADULT: 'Adultos',
    KIDS: 'Niños',
    MASTER: 'Máster',
  }
  return map[t] ?? t
}

function formatDate(iso?: string | null) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}
