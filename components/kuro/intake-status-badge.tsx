'use client'

import { Badge } from '@/components/ui/badge'
import type { IntakeStatus } from '@/lib/api/types'
import { cn } from '@/lib/utils'

interface IntakeStatusMeta {
  label: string
  className: string
}

const INTAKE_STATUS_META: Record<string, IntakeStatusMeta> = {
  NEW: {
    label: 'Nueva',
    className: 'border-primary/40 bg-primary/10 text-primary',
  },
  REVIEWING: {
    label: 'En revisión',
    className: 'border-border text-foreground',
  },
  CONTACTED: {
    label: 'Contactada',
    className: 'border-border text-foreground',
  },
  VISIT_PROPOSED: {
    label: 'Visita propuesta',
    className: 'border-border text-foreground',
  },
  VISIT_SCHEDULED: {
    label: 'Visita agendada',
    className:
      'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  VISIT_COMPLETED: {
    label: 'Visita hecha',
    className: 'border-border text-foreground',
  },
  NO_SHOW: {
    label: 'No vino',
    className: 'border-destructive/40 bg-destructive/10 text-destructive',
  },
  DECLINED_BY_PROSPECT: {
    label: 'Declinada',
    className: 'border-border text-muted-foreground',
  },
  REJECTED_BY_ACADEMY: {
    label: 'Rechazada',
    className: 'border-destructive/40 bg-destructive/10 text-destructive',
  },
  READY_TO_CONVERT: {
    label: 'Lista para convertir',
    className:
      'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  CONVERTED: {
    label: 'Convertida',
    className:
      'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  CANCELLED: {
    label: 'Cancelada',
    className: 'border-border text-muted-foreground',
  },
}

export function intakeStatusLabel(status: IntakeStatus | string): string {
  return INTAKE_STATUS_META[String(status).toUpperCase()]?.label ?? String(status)
}

export interface IntakeStatusBadgeProps {
  status: IntakeStatus | string
  className?: string
}

export function IntakeStatusBadge({
  status,
  className,
}: IntakeStatusBadgeProps) {
  const key = String(status).toUpperCase()
  const meta = INTAKE_STATUS_META[key] ?? {
    label: status,
    className: 'border-border text-muted-foreground',
  }
  return (
    <Badge variant="outline" className={cn(meta.className, className)}>
      {meta.label}
    </Badge>
  )
}
