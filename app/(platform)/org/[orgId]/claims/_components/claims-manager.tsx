'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
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
import { PersonAvatar } from '@/components/common/person-avatar'
import { ApiError } from '@/lib/api/client'
import {
  useBranches,
  useBranchStudents,
  useCapabilities,
  useInviteStudent,
} from '@/lib/hooks'
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
  | { kind: 'error'; message: string; requestId?: string }

export function ClaimsManager({ orgId }: ClaimsManagerProps) {
  const t = useTranslations('claims')
  const tNav = useTranslations('navigation.labels')

  const [branchId, setBranchId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const branchesQuery = useBranches(orgId)
  const branches = branchesQuery.data ?? []
  const activeBranch = branches.find((b) => b.id === branchId)

  // Gating del botón "Invitar" (Paso 6 del playbook). El backend doble-mapea
  // este invite (`POST /students/:id/invite`) a dos capabilities — la del
  // path exacto (`usersMemberships.canCreateStudentMembershipFromClaim`) y la
  // semántica (`students.canInviteExistingStudent`). Mostramos el botón si
  // cualquiera está activa; el 403 del backend sigue siendo la fuente final.
  const capabilitiesQuery = useCapabilities(orgId)
  const caps = capabilitiesQuery.data?.capabilities
  const canInvite = Boolean(
    caps?.usersMemberships?.canCreateStudentMembershipFromClaim ||
      caps?.students?.canInviteExistingStudent,
  )

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: tNav('organization'), href: `/org/${orgId}` },
          { label: t('title') },
        ]}
        title={t('title')}
        subtitle={t('subtitle')}
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
          canInvite={canInvite}
        />
      )}
    </div>
  )
}

function InfoBanner() {
  const t = useTranslations('claims')
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/30 px-3.5 py-3 text-xs text-muted-foreground">
      <Info className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
      <p>{t('infoBanner')}</p>
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
  const t = useTranslations('claims')
  const tErrors = useTranslations('errors.claims')
  const tEmpty = useTranslations('empty-states.claims')
  const tCommon = useTranslations('common')
  const tBranchStatus = useTranslations('dashboard.branch.status')

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
        title={tErrors('branchesForbiddenTitle')}
        description={tErrors('branchesForbiddenDescription')}
      />
    )
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={onRetry}
        title={tErrors('branchesLoadErrorTitle')}
      />
    )
  }

  if (branches.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title={tEmpty('branchesTitle')}
        description={tEmpty('branchesDescription')}
      />
    )
  }

  return (
    <section aria-label={t('selectBranchAria')}>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mb-2">
        {t('selectBranchLabel')}
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
                            {tCommon('branchBadge.hq')}
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
                    {humanizeBranchStatus(b.status, tBranchStatus)}
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
  canInvite,
}: {
  orgId: string
  branch: Branch
  page: number
  search: string
  onPage: (page: number) => void
  onSearch: (q: string) => void
  canInvite: boolean
}) {
  const t = useTranslations('claims')
  const tCommon = useTranslations('common')
  const tPagination = useTranslations('common.pagination')

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
    <section aria-label={t('rosterAria')} className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
            {t('studentsOf')}
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
            placeholder={t('searchPlaceholder')}
            className="w-full pl-8 pr-8 py-1.5 text-xs rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
          />
          {search && (
            <button
              onClick={() => onSearch('')}
              aria-label={tCommon('actions.clearSearch')}
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
        canInvite={canInvite}
      />

      {meta && meta.total > PAGE_SIZE && !listQuery.error && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>
            {tPagination('pageOf', { page, totalPages })}
            {' · '}
            <span className="tabular-nums">
              {t('count', { count: meta.total })}
            </span>
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || listQuery.isFetching}
              onClick={() => onPage(Math.max(1, page - 1))}
            >
              {tPagination('previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || listQuery.isFetching}
              onClick={() => onPage(Math.min(totalPages, page + 1))}
            >
              {tPagination('next')}
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
  canInvite,
}: {
  isLoading: boolean
  error: unknown
  items: StudentListItem[]
  rawCount: number
  search: string
  onRetry: () => void
  orgId: string
  canInvite: boolean
}) {
  const tErrors = useTranslations('errors.claims')
  const tEmpty = useTranslations('empty-states')
  const tEmptyClaims = useTranslations('empty-states.claims')

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
        title={tErrors('rosterForbiddenTitle')}
        description={tErrors('rosterForbiddenDescription')}
      />
    )
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={onRetry}
        title={tErrors('rosterLoadErrorTitle')}
      />
    )
  }

  if (items.length === 0) {
    if (search && rawCount > 0) {
      return (
        <EmptyState
          icon={Search}
          title={tEmpty('searchNoResults', { search })}
          description={tEmptyClaims('filteredDescription')}
        />
      )
    }
    return (
      <EmptyState
        icon={UserPlus}
        title={tEmptyClaims('emptyTitle')}
        description={tEmptyClaims('emptyDescription')}
      />
    )
  }

  return (
    <TextureCard>
      <TextureCardContent className="p-0">
        <ul className="divide-y divide-border">
          {items.map((s) => (
            <InviteRow
              key={s.id}
              student={s}
              orgId={orgId}
              canInvite={canInvite}
            />
          ))}
        </ul>
      </TextureCardContent>
    </TextureCard>
  )
}

function InviteRow({
  student,
  orgId,
  canInvite,
}: {
  student: StudentListItem
  orgId: string
  canInvite: boolean
}) {
  const t = useTranslations('claims')
  const tErrors = useTranslations('errors.claims')

  const [state, setState] = useState<InviteState>({ kind: 'idle' })
  const mutation = useInviteStudent(orgId)

  const fullName = `${student.firstName} ${student.lastName}`.trim()

  const onClick = () => {
    setState({ kind: 'sending' })
    mutation.mutate(
      { studentId: student.id },
      {
        onSuccess: () => setState({ kind: 'sent' }),
        onError: (err) => {
          // Solo mensajes de dominio mapeados o genérico — nunca el
          // body.message crudo del backend (posible info disclosure). El
          // requestId se adjunta para soporte.
          const msg =
            err instanceof ApiError
              ? interpretInviteError(err, tErrors)
              : tErrors('sendError')
          const requestId =
            err instanceof ApiError ? err.requestId : undefined
          setState({ kind: 'error', message: msg, requestId })
        },
      }
    )
  }

  return (
    <li className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
      <PersonAvatar
        avatarUrl={student.avatarUrl}
        firstName={student.firstName}
        lastName={student.lastName}
        size="sm"
      />
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

      {canInvite && (
        <Button
          variant={state.kind === 'sent' ? 'outline' : 'default'}
          size="sm"
          disabled={state.kind === 'sending' || state.kind === 'sent'}
          onClick={onClick}
        >
          {state.kind === 'sending' ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t('sending')}
            </>
          ) : state.kind === 'sent' ? (
            <>
              <Check className="h-3.5 w-3.5" />
              {t('sent')}
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              {t('invite')}
            </>
          )}
        </Button>
      )}
    </li>
  )
}

function InviteFeedback({ state }: { state: InviteState }) {
  const t = useTranslations('claims')

  if (state.kind === 'error') {
    return (
      <span className="hidden sm:flex flex-col items-end gap-0.5 text-[11px] text-destructive max-w-[220px]">
        <span className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          <span className="truncate" title={state.message}>
            {state.message}
          </span>
        </span>
        {state.requestId && (
          <span className="font-mono text-[10px] text-muted-foreground/70 truncate max-w-full">
            {state.requestId}
          </span>
        )}
      </span>
    )
  }
  if (state.kind === 'sent') {
    return (
      <span className="hidden sm:flex items-center gap-1 text-[11px] tone-success">
        <Check className="h-3 w-3" />
        {t('invitationSent')}
      </span>
    )
  }
  return null
}

// ── Helpers ────────────────────────────────────────────────

type Translator = ReturnType<typeof useTranslations>

function humanizeBranchStatus(
  status: string,
  tBranchStatus: Translator
): string {
  if (status === 'ACTIVE') return tBranchStatus('active')
  if (status === 'SUSPENDED') return tBranchStatus('suspended')
  if (status === 'INACTIVE') return tBranchStatus('inactive')
  return status
}

function interpretInviteError(err: ApiError, tErrors: Translator): string {
  if (err.status === 409) return tErrors('alreadyActive')
  if (err.status === 403) return tErrors('noPermission')
  if (err.status === 404) return tErrors('studentNotFound')
  if (err.status === 429) return tErrors('tooMany')
  // Status no mapeado → mensaje genérico de dominio. NUNCA renderizar
  // err.body.message crudo del backend (puede filtrar detalle interno /
  // IDs de otro tenant). El requestId se surface aparte para soporte.
  return tErrors('sendError')
}
