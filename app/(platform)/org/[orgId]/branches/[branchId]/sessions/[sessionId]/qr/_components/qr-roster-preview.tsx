'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  CheckCircle2,
  Circle,
  Clock3,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react'

import { PersonAvatar } from '@/components/common/person-avatar'
import { Input } from '@/components/ui/input'
import { BeltBadge } from '@/components/kuro'
import { EmptyState, ErrorState } from '@/components/shared'
import { cn } from '@/lib/utils'
import type { AttendanceStatus, TechnicalRosterItem } from '@/lib/api/types'
import { isCheckedInAttendanceStatus } from '@/lib/attendance/attendance-status'
import type { usePromotionRankResolver } from '@/lib/hooks/use-catalogs'

type RosterFilter =
  | 'all'
  | 'checkedIn'
  | 'pending'
  | 'PRESENT'
  | 'LATE'
  | 'ABSENT'
  | 'EXCUSED'

export interface QRRosterPreviewProps {
  items: TechnicalRosterItem[]
  isLoading: boolean
  isError?: boolean
  error?: unknown
  onRetry?: () => void
  resolveRank: ReturnType<typeof usePromotionRankResolver>
}

const FILTERS: RosterFilter[] = [
  'all',
  'checkedIn',
  'pending',
  'PRESENT',
  'LATE',
  'ABSENT',
  'EXCUSED',
]

export function QRRosterPreview({
  items,
  isLoading,
  isError = false,
  error,
  onRetry,
  resolveRank,
}: QRRosterPreviewProps) {
  const t = useTranslations('qr-checkin.roster')

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<RosterFilter>('all')

  const counts = useMemo(() => getRosterCounts(items), [items])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((it) => {
      if (q) {
        const name = `${it.student.firstName} ${it.student.lastName}`.toLowerCase()
        if (!name.includes(q)) return false
      }
      const status = it.attendance?.status ?? null
      if (filter === 'checkedIn') return isCheckedInAttendanceStatus(status)
      if (filter === 'pending') return status == null
      if (filter !== 'all') return status === filter
      return true
    })
  }, [items, search, filter])

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="label-mono">{t('title')}</p>
        <span className="text-xs tabular-nums text-muted-foreground">
          {t('showing', { showing: filtered.length, total: items.length })}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-7">
        <RosterCounter
          label={t('counts.registered')}
          value={counts.registered}
        />
        <RosterCounter label={t('counts.checkedIn')} value={counts.checkedIn} />
        <RosterCounter label={t('counts.present')} value={counts.present} />
        <RosterCounter label={t('counts.late')} value={counts.late} />
        <RosterCounter label={t('counts.absent')} value={counts.absent} />
        <RosterCounter label={t('counts.excused')} value={counts.excused} />
        <RosterCounter label={t('counts.pending')} value={counts.pending} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search')}
            className="pl-9"
            aria-label={t('search')}
          />
        </div>
        <div
          role="tablist"
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1"
        >
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                filter === f
                  ? 'bg-primary/15 text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t(`filter.${f}`)}
            </button>
          ))}
        </div>
      </div>

      {isError ? (
        <ErrorState
          dense
          error={error}
          title={t('loadError')}
          onRetry={onRetry}
        />
      ) : isLoading ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted/50" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Circle}
          title={t('empty.title')}
          description={t('empty.description')}
        />
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card px-4 py-8 text-center">
          <p className="text-sm font-medium text-foreground">
            {search.trim() ? t('emptySearch.title') : t('emptyFilter.title')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {search.trim()
              ? t('emptySearch.description')
              : t('emptyFilter.description')}
          </p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((it) => {
            const status = it.attendance?.status ?? null
            return (
              <div
                key={it.studentId}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
              >
                <PersonAvatar
                  avatarUrl={it.student.avatarUrl}
                  firstName={it.student.firstName}
                  lastName={it.student.lastName}
                  size="sm"
                  className="h-9 w-9"
                  fallbackClassName="text-[11px]"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">
                    {it.student.firstName} {it.student.lastName}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <BeltBadge
                      rank={resolveRank(it.student.currentBelt)}
                      stripes={it.student.currentStripes}
                      size="sm"
                      showLabel={false}
                    />
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      {it.intent
                        ? t('registration.registered')
                        : t('registration.walkIn')}
                    </span>
                  </div>
                </div>
                <RosterStatusBadge status={status} />
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function RosterCounter({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-medium tabular-nums text-foreground">
        {value}
      </p>
    </div>
  )
}

function RosterStatusBadge({ status }: { status: AttendanceStatus | null }) {
  const t = useTranslations('qr-checkin.status')
  const checkedIn = isCheckedInAttendanceStatus(status)
  const Icon =
    status === 'PRESENT'
      ? CheckCircle2
      : status === 'LATE'
        ? Clock3
        : status === 'ABSENT'
          ? XCircle
          : status === 'EXCUSED'
            ? ShieldCheck
            : Circle

  return (
    <span
      className={cn(
        'inline-flex h-7 shrink-0 items-center gap-1.5 rounded border px-2 text-xs font-medium',
        checkedIn
          ? 'border-primary/40 bg-primary/10 text-foreground'
          : status === 'ABSENT' || status === 'EXCUSED'
            ? 'border-amber-500/35 bg-amber-500/10 text-foreground'
            : 'border-border text-[var(--text-tertiary)]',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {status ? t(status) : t('pending')}
    </span>
  )
}

function getRosterCounts(items: TechnicalRosterItem[]) {
  return items.reduce(
    (acc, item) => {
      const status = item.attendance?.status ?? null
      if (item.intent) acc.registered += 1
      if (status === 'PRESENT') acc.present += 1
      if (status === 'LATE') acc.late += 1
      if (status === 'ABSENT') acc.absent += 1
      if (status === 'EXCUSED') acc.excused += 1
      if (status == null) acc.pending += 1
      if (isCheckedInAttendanceStatus(status)) acc.checkedIn += 1
      return acc
    },
    {
      registered: 0,
      checkedIn: 0,
      present: 0,
      late: 0,
      absent: 0,
      excused: 0,
      pending: 0,
    },
  )
}
