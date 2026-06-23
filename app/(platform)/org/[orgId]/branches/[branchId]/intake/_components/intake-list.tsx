'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
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
import { IntakeDetailSheet } from './intake-detail-sheet'

interface IntakeListProps {
  orgId: string
  branchId: string
}

const PAGE_SIZE = 20

const STATUS_FILTERS: {
  value: IntakeStatus | 'ALL'
  key:
    | 'ALL'
    | 'NEW'
    | 'REVIEWING'
    | 'CONTACTED'
    | 'VISIT'
    | 'READY'
    | 'CONVERTED'
}[] = [
  { value: 'ALL', key: 'ALL' },
  { value: 'NEW', key: 'NEW' },
  { value: 'REVIEWING', key: 'REVIEWING' },
  { value: 'CONTACTED', key: 'CONTACTED' },
  { value: 'VISIT_SCHEDULED', key: 'VISIT' },
  { value: 'READY_TO_CONVERT', key: 'READY' },
  { value: 'CONVERTED', key: 'CONVERTED' },
]

export function IntakeList({ orgId, branchId }: IntakeListProps) {
  const t = useTranslations('intake')
  const tStatusFilter = useTranslations('intake.statusFilter')
  const tNav = useTranslations('navigation.labels')
  const tCommon = useTranslations('common')

  const [status, setStatus] = useState<IntakeStatus | 'ALL'>('NEW')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)

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
          { label: tNav('organization'), href: `/org/${orgId}` },
          {
            label: branchQuery.data?.name ?? '…',
            href: `/org/${orgId}/branches/${branchId}`,
          },
          { label: t('title') },
        ]}
        title={t('title')}
        subtitle={t('subtitle')}
        meta={
          meta?.total != null && (
            <Badge variant="outline" className="text-xs">
              {t('count', { count: meta.total })}
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
                {tStatusFilter(f.key)}
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
              placeholder={tCommon('search.byNameEmailPhone')}
              className="w-full pl-8 pr-8 py-1.5 text-xs rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                aria-label={tCommon('actions.clearSearch')}
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
          onManage={setSelectedRequestId}
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

      <IntakeDetailSheet
        open={selectedRequestId != null}
        onOpenChange={(open) => {
          if (!open) setSelectedRequestId(null)
        }}
        orgId={orgId}
        requestId={selectedRequestId}
      />
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
  onManage,
}: {
  isLoading: boolean
  error: unknown
  items: IntakeRequest[]
  rawCount: number
  search: string
  onRetry: () => void
  orgId: string
  onManage: (requestId: string) => void
}) {
  const t = useTranslations('intake')
  const tErrors = useTranslations('errors.intake')
  const tEmpty = useTranslations('empty-states')
  const tEmptyIntake = useTranslations('empty-states.intake')

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
        title={tErrors('forbiddenTitle')}
        description={tErrors('forbiddenDescription')}
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
          title={tEmpty('searchNoResults', { search })}
          description={tEmptyIntake('filteredDescription')}
        />
      )
    }
    return (
      <EmptyState
        icon={Inbox}
        title={tEmptyIntake('emptyTitle')}
        description={tEmptyIntake('emptyDescription')}
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
                <th className="font-medium px-4 py-3">{t('table.applicant')}</th>
                <th className="font-medium px-4 py-3 hidden md:table-cell">
                  {t('table.contact')}
                </th>
                <th className="font-medium px-4 py-3 hidden lg:table-cell">
                  {t('table.typeLevel')}
                </th>
                <th className="font-medium px-4 py-3">{t('table.status')}</th>
                <th className="font-medium px-4 py-3 hidden md:table-cell">
                  {t('table.received')}
                </th>
                <th className="font-medium px-4 py-3 text-right">
                  {t('table.action')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((it) => (
                <IntakeRow
                  key={it.id}
                  item={it}
                  orgId={orgId}
                  onManage={onManage}
                />
              ))}
            </tbody>
          </table>
        </div>
      </TextureCardContent>
    </TextureCard>
  )
}

function IntakeRow({
  item,
  orgId,
  onManage,
}: {
  item: IntakeRequest
  orgId: string
  onManage: (requestId: string) => void
}) {
  const t = useTranslations('intake')
  const tType = useTranslations('intake.requestType')
  const tExperience = useTranslations('intake.experience')
  const tRel = useTranslations('common.relativeTime')

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
            {humanizeRequestType(item.requestType, tType)}
          </span>
          <span className="text-muted-foreground">
            {item.experienceLevel
              ? humanizeExperience(item.experienceLevel, tExperience)
              : '—'}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <IntakeStatusBadge status={item.status} />
      </td>
      <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground tabular-nums">
        {formatRelativeDate(item.createdAt, tRel as unknown as RelTranslator)}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          {item.convertedStudentId && (
            <Button asChild variant="ghost" size="xs">
              <Link href={`/org/${orgId}/students/${item.convertedStudentId}`}>
                {t('viewStudent')}
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            size="xs"
            onClick={() => onManage(item.id)}
          >
            {t('manage')}
          </Button>
        </div>
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
  const t = useTranslations('intake')
  const tPagination = useTranslations('common.pagination')

  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
      <span>
        {tPagination('pageOf', { page, totalPages })}
        {' · '}
        <span className="tabular-nums">{t('count', { count: total })}</span>
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1 || isFetching}
          onClick={onPrev}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {tPagination('previous')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages || isFetching}
          onClick={onNext}
        >
          {tPagination('next')}
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────

// Tipo estructural mínimo: evita instanciar `ReturnType<typeof useTranslations>`
// (la unión de TODAS las keys, carísima y que dispara TS2589 al crecer los
// mensajes). Las keys son dinámicas (enum del backend) y el guard `.has()`
// valida en runtime → params `never` (el translator real es asignable).
type Translator = {
  (key: never): string
  has: (key: never) => boolean
}

function humanizeRequestType(value: string, tType: Translator) {
  return tType.has(value as never) ? tType(value as never) : value
}

function humanizeExperience(value: string, tExperience: Translator) {
  return tExperience.has(value as never) ? tExperience(value as never) : value
}

// Tipo explícito y chico para el translator de `common.relativeTime`. Evita
// instanciar el translator completo (que dispara TS2589 al crecer los mensajes).
type RelTranslator = {
  (key: 'now' | 'yesterday'): string
  (
    key: 'minutesAgo' | 'hoursAgo' | 'daysAgo' | 'monthsAgo',
    values: { count: number },
  ): string
}

function formatRelativeDate(
  iso: string | null | undefined,
  tRel: RelTranslator,
) {
  if (!iso) return '—'
  try {
    const date = new Date(iso)
    const diffMs = Date.now() - date.getTime()
    const mins = Math.floor(diffMs / (1000 * 60))
    if (mins < 1) return tRel('now')
    if (mins < 60) return tRel('minutesAgo', { count: mins })
    const hours = Math.floor(mins / 60)
    if (hours < 24) return tRel('hoursAgo', { count: hours })
    const days = Math.floor(hours / 24)
    if (days < 30)
      return days === 1 ? tRel('yesterday') : tRel('daysAgo', { count: days })
    const months = Math.floor(days / 30)
    return tRel('monthsAgo', { count: months })
  } catch {
    return '—'
  }
}
