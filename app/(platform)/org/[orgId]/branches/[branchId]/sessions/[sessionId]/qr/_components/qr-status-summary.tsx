'use client'

import { useTranslations } from 'next-intl'

export interface QRStatusSummaryProps {
  checkedIn: number
  capacityMax: number
}

export function QRStatusSummary({
  checkedIn,
  capacityMax,
}: QRStatusSummaryProps) {
  const t = useTranslations('qr-checkin.capacity')

  const pct =
    capacityMax > 0
      ? Math.min(100, Math.round((checkedIn / capacityMax) * 100))
      : 0
  const available = Math.max(0, capacityMax - checkedIn)

  return (
    <div className="flex flex-col justify-center gap-5 rounded-2xl border border-border bg-card p-8">
      <p className="label-mono">{t('title')}</p>

      <p className="leading-none">
        <span className="text-5xl font-medium tabular-nums text-foreground">
          {checkedIn}
        </span>
        <span className="text-2xl tabular-nums text-muted-foreground">
          {' '}
          / {capacityMax}
        </span>
      </p>
      <p className="text-sm text-[var(--text-tertiary)]">{t('checkedIn')}</p>

      <div
        className="h-1 w-full overflow-hidden rounded-full bg-muted"
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

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{t('occupied', { percent: pct })}</span>
        <span>{t('available', { count: available })}</span>
      </div>
    </div>
  )
}
