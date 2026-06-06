'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { CheckCircle2, Circle, Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { BeltBadge } from '@/components/kuro'
import { ErrorState } from '@/components/shared'
import { cn } from '@/lib/utils'
import type { TechnicalRosterItem } from '@/lib/api/types'
import type { usePromotionRankResolver } from '@/lib/hooks/use-catalogs'

type RosterFilter = 'all' | 'checkedIn' | 'expected'

export interface QRRosterPreviewProps {
  items: TechnicalRosterItem[]
  isLoading: boolean
  isError?: boolean
  error?: unknown
  onRetry?: () => void
  resolveRank: ReturnType<typeof usePromotionRankResolver>
}

const FILTERS: RosterFilter[] = ['all', 'checkedIn', 'expected']

export function QRRosterPreview({
  items,
  isLoading,
  isError = false,
  error,
  onRetry,
  resolveRank,
}: QRRosterPreviewProps) {
  const t = useTranslations('qr-checkin.roster')
  const tStatus = useTranslations('qr-checkin.status')

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<RosterFilter>('all')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((it) => {
      if (q) {
        const name = `${it.student.firstName} ${it.student.lastName}`.toLowerCase()
        if (!name.includes(q)) return false
      }
      const checkedIn = it.attendance != null
      if (filter === 'checkedIn') return checkedIn
      if (filter === 'expected') return !checkedIn
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
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t('empty')}
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((it) => {
            const checkedIn = it.attendance != null
            return (
              <div
                key={it.studentId}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
              >
                <span
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                  style={{
                    background:
                      'color-mix(in srgb, var(--primary) 14%, transparent)',
                    color: 'var(--primary)',
                    border:
                      '0.5px solid color-mix(in srgb, var(--primary) 30%, transparent)',
                  }}
                >
                  {`${it.student.firstName?.[0] ?? ''}${it.student.lastName?.[0] ?? ''}`.toUpperCase() ||
                    '—'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">
                    {it.student.firstName} {it.student.lastName}
                  </p>
                  <BeltBadge
                    rank={resolveRank(it.student.currentBelt)}
                    stripes={it.student.currentStripes}
                    size="sm"
                    showLabel={false}
                    className="mt-1"
                  />
                </div>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-xs',
                    checkedIn
                      ? 'text-[var(--kuro-success)]'
                      : 'text-[var(--text-tertiary)]',
                  )}
                >
                  {checkedIn ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Circle className="h-3.5 w-3.5" />
                  )}
                  {checkedIn ? tStatus('checkedIn') : tStatus('expected')}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
