'use client'

import { useTranslations } from 'next-intl'
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
  className: string
  icon: React.ComponentType<{ className?: string }>
}

// Solo el estilo visual vive acá; los labels vienen de calendar.sessionStatus.*
const SESSION_STATUS_META: Record<ClassSessionStatus, SessionStatusMeta> = {
  SCHEDULED: {
    className: 'border-border bg-muted/30 text-foreground',
    icon: Calendar,
  },
  COMPLETED: {
    className: 'surface-success',
    icon: Check,
  },
  CANCELED: {
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
  const t = useTranslations('calendar.sessionStatus')
  const key = (
    status in SESSION_STATUS_META ? status : 'SCHEDULED'
  ) as ClassSessionStatus
  const meta = SESSION_STATUS_META[key]
  const Icon = meta.icon
  return (
    <Badge variant="outline" className={cn(meta.className, className)}>
      {!hideIcon && <Icon className="h-3 w-3" />}
      {t(key)}
    </Badge>
  )
}
