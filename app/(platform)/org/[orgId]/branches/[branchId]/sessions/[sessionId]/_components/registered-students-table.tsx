'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, Search, Users } from 'lucide-react'

import { PersonAvatar } from '@/components/common/person-avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { BeltBadge } from '@/components/kuro'
import { ErrorState, ForbiddenState, EmptyState } from '@/components/shared'
import { ApiError } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import type { TechnicalRosterItem } from '@/lib/api/types'
import { isCheckedInAttendanceStatus } from '@/lib/attendance/attendance-status'
import type { usePromotionRankResolver } from '@/lib/hooks/use-catalogs'

export interface RegisteredStudentsTableProps {
  items: TechnicalRosterItem[]
  isLoading: boolean
  error: unknown
  onRetry: () => void
  resolveRank: ReturnType<typeof usePromotionRankResolver>
  canValidate: boolean
  disabled: boolean
  /** studentId con check-in en vuelo (para spinner/disable de su fila). */
  pendingStudentId?: string
  onCheckIn: (studentId: string) => void
}

export function RegisteredStudentsTable({
  items,
  isLoading,
  error,
  onRetry,
  resolveRank,
  canValidate,
  disabled,
  pendingStudentId,
  onCheckIn,
}: RegisteredStudentsTableProps) {
  const t = useTranslations('class-detail.students')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((it) => {
      const name = `${it.student.firstName} ${it.student.lastName}`.toLowerCase()
      return name.includes(q)
    })
  }, [items, search])

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-medium text-foreground">{t('title')}</h2>
        <div className="flex items-center gap-3">
          <div className="relative min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search')}
              className="pl-9"
              aria-label={t('search')}
            />
          </div>
          {!isLoading && !error && (
            <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
              {t('showing', { showing: filtered.length, total: items.length })}
            </span>
          )}
        </div>
      </div>

      <Body
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        items={filtered}
        hasAny={items.length > 0}
        resolveRank={resolveRank}
        canValidate={canValidate}
        disabled={disabled}
        pendingStudentId={pendingStudentId}
        onCheckIn={onCheckIn}
      />
    </section>
  )
}

function Body({
  isLoading,
  error,
  onRetry,
  items,
  hasAny,
  resolveRank,
  canValidate,
  disabled,
  pendingStudentId,
  onCheckIn,
}: {
  isLoading: boolean
  error: unknown
  onRetry: () => void
  items: TechnicalRosterItem[]
  hasAny: boolean
  resolveRank: ReturnType<typeof usePromotionRankResolver>
  canValidate: boolean
  disabled: boolean
  pendingStudentId?: string
  onCheckIn: (studentId: string) => void
}) {
  const t = useTranslations('class-detail.students')

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded bg-muted/50" />
        ))}
      </div>
    )
  }

  if (error instanceof ApiError && error.status === 403) return <ForbiddenState />
  if (error) return <ErrorState error={error} onRetry={onRetry} />

  if (!hasAny) {
    return (
      <EmptyState
        icon={Users}
        title={t('empty')}
        description={t('emptyDescription')}
      />
    )
  }

  return (
    <div className="overflow-hidden rounded border border-border">
      {/* Header */}
      <div className="hidden grid-cols-[2fr_1.2fr_1fr_auto] items-center gap-4 border-b border-border bg-card px-4 py-2.5 sm:grid">
        <span className="label-mono">{t('col.student')}</span>
        <span className="label-mono">{t('col.rank')}</span>
        <span className="label-mono">{t('col.status')}</span>
        <span className="label-mono text-right">{t('col.actions')}</span>
      </div>

      <ul className="divide-y divide-border">
        {items.map((item) => (
          <Row
            key={item.studentId}
            item={item}
            beltEntry={resolveRank(item.student.currentBelt)}
            canValidate={canValidate}
            disabled={disabled}
            pending={pendingStudentId === item.studentId}
            onCheckIn={onCheckIn}
          />
        ))}
      </ul>
    </div>
  )
}

function Row({
  item,
  beltEntry,
  canValidate,
  disabled,
  pending,
  onCheckIn,
}: {
  item: TechnicalRosterItem
  beltEntry: ReturnType<ReturnType<typeof usePromotionRankResolver>>
  canValidate: boolean
  disabled: boolean
  pending: boolean
  onCheckIn: (studentId: string) => void
}) {
  const t = useTranslations('class-detail.students')
  const status = item.attendance?.status ?? null
  const checkedIn = isCheckedInAttendanceStatus(status)
  const registered = item.intent != null

  return (
    <li className="grid min-h-[64px] grid-cols-1 gap-3 px-4 py-3 transition-colors hover:bg-muted/40 sm:grid-cols-[2fr_1.2fr_1fr_minmax(96px,auto)] sm:items-center sm:gap-4">
      {/* Alumno */}
      <div className="flex min-h-9 min-w-0 items-center gap-3">
        <PersonAvatar
          avatarUrl={item.student.avatarUrl}
          firstName={item.student.firstName}
          lastName={item.student.lastName}
          size="sm"
          className="h-9 w-9"
          fallbackClassName="text-[11px]"
        />
        <span className="truncate text-sm text-foreground">
          {item.student.firstName} {item.student.lastName}
        </span>
      </div>

      {/* Rank */}
      <div className="flex min-h-9 items-center sm:justify-self-start">
        <BeltBadge
          rank={beltEntry}
          stripes={item.student.currentStripes}
          size="sm"
        />
      </div>

      {/* Estado */}
      <div className="flex min-h-9 items-center sm:justify-self-start">
        <StatusChip checkedIn={checkedIn} registered={registered} />
      </div>

      {/* Acción */}
      <div className="flex min-h-9 items-center sm:justify-self-end">
        {canValidate && !checkedIn && (
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={disabled || pending}
            onClick={() => onCheckIn(item.studentId)}
          >
            <Check className="h-3.5 w-3.5" />
            {t('checkIn')}
          </Button>
        )}
      </div>
    </li>
  )
}

function StatusChip({
  checkedIn,
  registered,
}: {
  checkedIn: boolean
  registered: boolean
}) {
  const t = useTranslations('class-detail.students.status')

  if (checkedIn) {
    return (
      <span className="inline-flex h-7 items-center gap-1.5 rounded border border-primary/40 bg-primary/10 px-2 text-xs font-medium text-foreground">
        <Check className="h-3 w-3 text-[var(--kuro-success)]" />
        {t('checkedIn')}
      </span>
    )
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-2 py-0.5 text-xs',
        'h-7',
        registered
          ? 'border-border text-muted-foreground'
          : 'border-border/60 text-[var(--text-tertiary)]',
      )}
    >
      {registered ? t('registered') : t('pending')}
    </span>
  )
}
