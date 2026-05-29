'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  AlertCircle,
  Building2,
  Check,
  Info,
  Loader2,
  Mail,
  Search,
  Send,
  UserPlus,
  X,
} from 'lucide-react'
import {
  TextureCard,
  TextureCardContent,
} from '@/components/ui/texture-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api/client'
import { useBranches, useBranchStudents, useInviteStudent } from '@/lib/hooks'
import {
  EmptyState,
  ErrorState,
  ForbiddenState,
  PageHeader,
} from '@/components/shared'
import type { Branch, StudentListItem } from '@/lib/api/types'
import { cn } from '@/lib/utils'

interface ClaimsManagerProps {
  orgId: string
}

const PAGE_SIZE = 25

type InviteState =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent' }
  | { kind: 'error'; message: string }

export function ClaimsManager({ orgId }: ClaimsManagerProps) {
  const [branchId, setBranchId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const branchesQuery = useBranches(orgId)
  const branches = branchesQuery.data ?? []
  const activeBranch = branches.find((b) => b.id === branchId)

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Organización', href: `/org/${orgId}` },
          { label: 'Invitaciones de cuenta' },
        ]}
        title="Invitaciones de cuenta"
        subtitle="Enviá invitaciones para que tus alumnos reclamen su acceso a KURO."
      />

      <InfoBanner />

      <BranchPicker
        branches={branches}
        isLoading={branchesQuery.isLoading}
        error={branchesQuery.error}
        selected={branchId}
        onSelect={(id) => {
          setBranchId(id)
          setPage(1)
          setSearch('')
        }}
        onRetry={() => branchesQuery.refetch()}
      />

      {branchId && activeBranch && (
        <BranchRoster
          orgId={orgId}
          branch={activeBranch}
          page={page}
          search={search}
          onPage={setPage}
          onSearch={setSearch}
        />
      )}
    </div>
  )
}

function InfoBanner() {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/30 px-3.5 py-3 text-xs text-muted-foreground">
      <Info className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
      <p>
        El backend no expone aún un listado dedicado de alumnos sin cuenta —
        seleccioná una filial y enviá la invitación a quien corresponda. Si el
        alumno ya tiene cuenta activa, el backend rechazará el envío.
      </p>
    </div>
  )
}

// ── Branch picker ──────────────────────────────────────────

function BranchPicker({
  branches,
  isLoading,
  error,
  selected,
  onSelect,
  onRetry,
}: {
  branches: Branch[]
  isLoading: boolean
  error: unknown
  selected: string | null
  onSelect: (id: string) => void
  onRetry: () => void
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-20 rounded-[24px] bg-muted/50 animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (error instanceof ApiError && error.status === 403) {
    return (
      <ForbiddenState
        title="Sin acceso a filiales"
        description="Tu rol no permite listar filiales de esta organización."
      />
    )
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={onRetry}
        title="No se pudieron cargar las filiales"
      />
    )
  }

  if (branches.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="Sin filiales registradas"
        description="No hay filiales en esta organización todavía."
      />
    )
  }

  return (
    <section aria-label="Elegí filial">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mb-2">
        Elegí una filial
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {branches.map((b) => {
          const isActive = b.id === selected
          return (
            <button
              key={b.id}
              onClick={() => onSelect(b.id)}
              className={cn(
                'text-left transition-transform hover:-translate-y-0.5',
                isActive && 'translate-y-0'
              )}
            >
              <TextureCard
                className={cn(isActive && 'ring-2 ring-primary/40')}
              >
                <TextureCardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Building2
                          className={cn(
                            'h-3.5 w-3.5 flex-shrink-0',
                            isActive
                              ? 'text-primary'
                              : 'text-muted-foreground'
                          )}
                        />
                        <p className="text-sm font-semibold text-foreground truncate">
                          {b.name}
                        </p>
                        {b.isHeadquarter && (
                          <Badge variant="outline" className="text-[9px]">
                            HQ
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {b.city || b.slug}
                      </p>
                    </div>
                    {isActive && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    {humanizeBranchStatus(b.status)}
                  </p>
                </TextureCardContent>
              </TextureCard>
            </button>
          )
        })}
      </div>
    </section>
  )
}

// ── Branch roster ──────────────────────────────────────────

function BranchRoster({
  orgId,
  branch,
  page,
  search,
  onPage,
  onSearch,
}: {
  orgId: string
  branch: Branch
  page: number
  search: string
  onPage: (page: number) => void
  onSearch: (q: string) => void
}) {
  const listQuery = useBranchStudents(orgId, branch.id, {
    page,
    limit: PAGE_SIZE,
  })

  const items = useMemo(
    () => listQuery.data?.items ?? [],
    [listQuery.data?.items]
  )
  const meta = listQuery.data?.meta

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((s) =>
      `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(q)
    )
  }, [items, search])

  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1

  return (
    <section aria-label="Roster de filial" className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
            Alumnos de
          </p>
          <p className="text-sm font-semibold text-foreground">{branch.name}</p>
        </div>

        <div className="relative w-full max-w-xs">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Buscar alumno por nombre o email"
            className="w-full pl-8 pr-8 py-1.5 text-xs rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
          />
          {search && (
            <button
              onClick={() => onSearch('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <RosterBody
        isLoading={listQuery.isLoading}
        error={listQuery.error}
        items={filtered}
        rawCount={items.length}
        search={search}
        onRetry={() => listQuery.refetch()}
        orgId={orgId}
      />

      {meta && meta.total > PAGE_SIZE && !listQuery.error && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>
            Página {page} de {totalPages}
            {' · '}
            <span className="tabular-nums">
              {meta.total.toLocaleString('es-AR')}
            </span>{' '}
            alumnos
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || listQuery.isFetching}
              onClick={() => onPage(Math.max(1, page - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || listQuery.isFetching}
              onClick={() => onPage(Math.min(totalPages, page + 1))}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}

function RosterBody({
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
  items: StudentListItem[]
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
        title="Sin acceso al roster"
        description="No tenés permisos para ver los alumnos de esta filial."
      />
    )
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={onRetry}
        title="No se pudo cargar el roster"
      />
    )
  }

  if (items.length === 0) {
    if (search && rawCount > 0) {
      return (
        <EmptyState
          icon={Search}
          title={`Sin resultados para "${search}"`}
          description="Ajustá la búsqueda."
        />
      )
    }
    return (
      <EmptyState
        icon={UserPlus}
        title="Sin alumnos en esta filial"
        description="Cuando haya alumnos registrados aparecerán acá."
      />
    )
  }

  return (
    <TextureCard>
      <TextureCardContent className="p-0">
        <ul className="divide-y divide-border">
          {items.map((s) => (
            <InviteRow key={s.id} student={s} orgId={orgId} />
          ))}
        </ul>
      </TextureCardContent>
    </TextureCard>
  )
}

function InviteRow({
  student,
  orgId,
}: {
  student: StudentListItem
  orgId: string
}) {
  const [state, setState] = useState<InviteState>({ kind: 'idle' })
  const mutation = useInviteStudent(orgId)

  const fullName = `${student.firstName} ${student.lastName}`.trim()
  const initials = `${student.firstName[0] ?? ''}${student.lastName[0] ?? ''}`

  const onClick = () => {
    setState({ kind: 'sending' })
    mutation.mutate(
      { studentId: student.id },
      {
        onSuccess: () => setState({ kind: 'sent' }),
        onError: (err) => {
          const msg =
            err instanceof ApiError
              ? interpretInviteError(err)
              : 'No se pudo enviar la invitación.'
          setState({ kind: 'error', message: msg })
        },
      }
    )
  }

  return (
    <li className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
      <Avatar initials={initials} />
      <div className="flex-1 min-w-0">
        <Link
          href={`/org/${orgId}/students/${student.id}`}
          className="text-sm font-medium text-foreground hover:text-primary truncate block"
        >
          {fullName}
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
          <Mail className="h-3 w-3" />
          <span className="truncate">{student.email}</span>
        </div>
      </div>

      <InviteFeedback state={state} />

      <Button
        variant={state.kind === 'sent' ? 'outline' : 'default'}
        size="sm"
        disabled={state.kind === 'sending' || state.kind === 'sent'}
        onClick={onClick}
      >
        {state.kind === 'sending' ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Enviando
          </>
        ) : state.kind === 'sent' ? (
          <>
            <Check className="h-3.5 w-3.5" />
            Enviada
          </>
        ) : (
          <>
            <Send className="h-3.5 w-3.5" />
            Invitar
          </>
        )}
      </Button>
    </li>
  )
}

function InviteFeedback({ state }: { state: InviteState }) {
  if (state.kind === 'error') {
    return (
      <span className="hidden sm:flex items-center gap-1 text-[11px] text-destructive max-w-[200px] truncate">
        <AlertCircle className="h-3 w-3 flex-shrink-0" />
        <span className="truncate" title={state.message}>
          {state.message}
        </span>
      </span>
    )
  }
  if (state.kind === 'sent') {
    return (
      <span className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
        <Check className="h-3 w-3" />
        Invitación enviada
      </span>
    )
  }
  return null
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

// ── Helpers ────────────────────────────────────────────────

function humanizeBranchStatus(status: string): string {
  if (status === 'ACTIVE') return 'Activa'
  if (status === 'SUSPENDED') return 'Suspendida'
  if (status === 'INACTIVE') return 'Inactiva'
  return status
}

function interpretInviteError(err: ApiError): string {
  if (err.status === 409) return 'El alumno ya tiene una cuenta activa.'
  if (err.status === 403) return 'Sin permisos para invitar.'
  if (err.status === 404) return 'Alumno no encontrado.'
  if (err.status === 429) return 'Demasiados envíos — esperá un momento.'
  const body = err.body as { message?: string } | null
  return body?.message ?? 'No se pudo enviar la invitación.'
}
