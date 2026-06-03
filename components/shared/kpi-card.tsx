'use client'

import Link from 'next/link'
import { useFormatter, useTranslations } from 'next-intl'
import { AlertCircle, Lock } from 'lucide-react'
import { CutoutCard } from '@/components/ui/cutout-card'
import { ApiError } from '@/lib/api/client'
import { cn } from '@/lib/utils'

export interface KpiCardProps {
  label: string
  value: number | undefined
  icon: React.ComponentType<{ className?: string }>
  hint?: string
  isLoading?: boolean
  error?: unknown
  /** Si la card es navegable. */
  href?: string
  /** "warning" tinta el card en ámbar cuando el value > 0 (alertas). */
  tone?: 'neutral' | 'warning'
  /** Formato del valor — default useFormatter().number(value). */
  formatValue?: (value: number) => string
}

type KpiStatus = 'loading' | 'forbidden' | 'error' | 'empty' | 'ready'

function resolveStatus({
  isLoading,
  error,
  value,
}: {
  isLoading?: boolean
  error?: unknown
  value: number | undefined
}): KpiStatus {
  if (isLoading) return 'loading'
  if (error instanceof ApiError && error.status === 403) return 'forbidden'
  if (error) return 'error'
  if (value == null) return 'empty'
  return 'ready'
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  isLoading,
  error,
  href,
  tone = 'neutral',
  formatValue,
}: KpiCardProps) {
  const t = useTranslations('errors.kpi')
  const status = resolveStatus({ isLoading, error, value })
  const isAlerted = tone === 'warning' && status === 'ready' && (value ?? 0) > 0
  const navigable = Boolean(href) && status === 'ready'

  const body = (
    <CutoutCard
      icon={<Icon className="h-4 w-4" />}
      iconClassName={cn(
        'stroke-[1.5]',
        isAlerted ? 'surface-warning' : 'border-transparent bg-primary/10 text-primary',
      )}
      className={cn(navigable && 'transition-transform hover:-translate-y-0.5')}
    >
      <p className="label-mono">{label}</p>
      <KpiValue
        status={status}
        value={value}
        isAlerted={isAlerted}
        formatValue={formatValue}
      />
      <p className="text-xs text-[var(--text-tertiary)] mt-3">
        {status === 'error'
          ? t('loadError')
          : status === 'forbidden'
            ? t('forbidden')
            : (hint ?? '')}
      </p>
    </CutoutCard>
  )

  if (navigable && href) {
    return (
      <Link href={href} className="block">
        {body}
      </Link>
    )
  }
  return body
}

function KpiValue({
  status,
  value,
  isAlerted,
  formatValue,
}: {
  status: KpiStatus
  value: number | undefined
  isAlerted: boolean
  formatValue?: (value: number) => string
}) {
  const t = useTranslations('errors.kpi')
  const format = useFormatter()
  if (status === 'loading') {
    return <div className="h-7 w-16 rounded-md bg-muted animate-pulse mt-1" />
  }
  if (status === 'forbidden') {
    return (
      <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground mt-1">
        <Lock className="h-3.5 w-3.5" /> {t('restricted')}
      </p>
    )
  }
  if (status === 'error') {
    return (
      <p className="flex items-center gap-1.5 text-sm font-medium text-destructive mt-1">
        <AlertCircle className="h-3.5 w-3.5" /> {t('error')}
      </p>
    )
  }
  if (status === 'empty') {
    return <p className="text-sm text-muted-foreground mt-1">—</p>
  }
  const formatted = formatValue
    ? formatValue(value ?? 0)
    : format.number(value ?? 0)
  return (
    <p
      className={cn(
        'text-3xl font-medium tabular-nums mt-1',
        isAlerted ? 'tone-warning' : 'text-foreground'
      )}
    >
      {formatted}
    </p>
  )
}
