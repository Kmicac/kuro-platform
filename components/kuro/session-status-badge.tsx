'use client'

import { Ban, Calendar, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ClassSessionStatus } from '@/lib/api/types'
import { cn } from '@/lib/utils'

/**
 * Status badge específico para ClassSession.
 *
 * Enums REALES del backend:
 *  - SCHEDULED → Programada (default/info)
 *  - COMPLETED → Completada (success)
 *  - CANCELED  → Cancelada (destructive)  ← una sola L
 *
 * NO confundir con StatusBadge (alumnos/filiales: ACTIVE/INACTIVE/SUSPENDED).
 */
interface SessionStatusMeta {
  label: string
  className: string
  icon: React.ComponentType<{ className?: string }>
}

const SESSION_STATUS_META: Record<ClassSessionStatus, SessionStatusMeta> = {
  SCHEDULED: {
    label: 'Programada',
    className: 'border-border bg-muted/30 text-foreground',
    icon: Calendar,
  },
  COMPLETED: {
    label: 'Completada',
    className:
      'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    icon: Check,
  },
  CANCELED: {
    label: 'Cancelada',
    className: 'border-destructive/40 bg-destructive/10 text-destructive',
    icon: Ban,
  },
}

export interface SessionStatusBadgeProps {
  status: ClassSessionStatus | string
  /** Si true, oculta el ícono y deja solo el label. */
  hideIcon?: boolean
  className?: string
}

export function SessionStatusBadge({
  status,
  hideIcon = false,
  className,
}: SessionStatusBadgeProps) {
  const meta =
    SESSION_STATUS_META[status as ClassSessionStatus] ??
    SESSION_STATUS_META.SCHEDULED
  const Icon = meta.icon
  return (
    <Badge variant="outline" className={cn(meta.className, className)}>
      {!hideIcon && <Icon className="h-3 w-3" />}
      {meta.label}
    </Badge>
  )
}
