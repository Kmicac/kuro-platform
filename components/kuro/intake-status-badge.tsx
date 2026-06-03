'use client'

import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import type { IntakeStatus } from '@/lib/api/types'
import { cn } from '@/lib/utils'

type KnownIntakeStatus =
  | 'NEW'
  | 'REVIEWING'
  | 'CONTACTED'
  | 'VISIT_PROPOSED'
  | 'VISIT_SCHEDULED'
  | 'VISIT_COMPLETED'
  | 'NO_SHOW'
  | 'DECLINED_BY_PROSPECT'
  | 'REJECTED_BY_ACADEMY'
  | 'READY_TO_CONVERT'
  | 'CONVERTED'
  | 'CANCELLED'

// Solo el estilo visual vive acá; los labels vienen de intake.status.*
const INTAKE_STATUS_CLASS: Record<KnownIntakeStatus, string> = {
  NEW: 'border-primary/40 bg-primary/10 text-primary',
  REVIEWING: 'border-border text-foreground',
  CONTACTED: 'border-border text-foreground',
  VISIT_PROPOSED: 'border-border text-foreground',
  VISIT_SCHEDULED: 'surface-warning',
  VISIT_COMPLETED: 'border-border text-foreground',
  NO_SHOW: 'border-destructive/40 bg-destructive/10 text-destructive',
  DECLINED_BY_PROSPECT: 'border-border text-muted-foreground',
  REJECTED_BY_ACADEMY: 'border-destructive/40 bg-destructive/10 text-destructive',
  READY_TO_CONVERT: 'surface-success',
  CONVERTED: 'surface-success',
  CANCELLED: 'border-border text-muted-foreground',
}

export interface IntakeStatusBadgeProps {
  status: IntakeStatus | string
  className?: string
}

export function IntakeStatusBadge({
  status,
  className,
}: IntakeStatusBadgeProps) {
  const t = useTranslations('intake.status')
  const key = String(status).toUpperCase() as KnownIntakeStatus
  const statusClass =
    INTAKE_STATUS_CLASS[key] ?? 'border-border text-muted-foreground'
  const label = t.has(key) ? t(key) : String(status)
  return (
    <Badge variant="outline" className={cn(statusClass, className)}>
      {label}
    </Badge>
  )
}
