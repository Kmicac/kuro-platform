'use client'

import { useTranslations } from 'next-intl'
import { Users } from 'lucide-react'

export interface AttendanceOverviewCardProps {
  checkedIn: number
  capacityMax: number
  isLoading: boolean
}

export function AttendanceOverviewCard({
  checkedIn,
  capacityMax,
  isLoading,
}: AttendanceOverviewCardProps) {
  const t = useTranslations('class-detail.attendance')

  const pct =
    capacityMax > 0
      ? Math.min(100, Math.round((checkedIn / capacityMax) * 100))
      : 0
  const spotsLeft = Math.max(0, capacityMax - checkedIn)

  return (
    <section className="flex flex-col rounded border border-border bg-card p-5">
      <p className="label-mono inline-flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5" />
        {t('title')}
      </p>

      {isLoading ? (
        <div className="mt-4 h-12 w-32 animate-pulse rounded bg-muted/60" />
      ) : (
        <p className="mt-4 leading-none">
          <span className="text-5xl font-medium tabular-nums text-foreground">
            {checkedIn}
          </span>
          <span className="text-2xl tabular-nums text-muted-foreground">
            {' '}
            / {capacityMax}
          </span>
        </p>
      )}
      <p className="mt-2 text-sm text-[var(--text-tertiary)]">
        {t('checkedIn')}
      </p>

      {/* Progreso de capacidad */}
      <div
        className="mt-4 h-1 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={capacityMax}
        aria-valuenow={checkedIn}
      >
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{t('capacityPct', { pct })}</span>
        <span>{t('spotsLeft', { count: spotsLeft })}</span>
      </div>
    </section>
  )
}
