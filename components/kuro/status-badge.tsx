'use client'

import { useTranslations } from 'next-intl'
import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * Status badge para alumnos y filiales — ambos usan el enum
 * ACTIVE / INACTIVE / SUSPENDED del backend.
 *
 * Convenciones:
 *  - ACTIVE → primary (verde KURO)
 *  - INACTIVE → muted
 *  - SUSPENDED → ámbar con ícono de alerta
 */
export type KuroStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | string

type KnownStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

interface StatusMeta {
  className: string
  icon?: React.ComponentType<{ className?: string }>
}

// Solo el estilo visual vive acá; los labels vienen de common.status.*
const STATUS_META: Record<KnownStatus, StatusMeta> = {
  ACTIVE: {
    className: 'border-primary/40 bg-primary/10 text-primary',
  },
  INACTIVE: {
    className: 'border-border text-muted-foreground',
  },
  SUSPENDED: {
    className: 'surface-warning',
    icon: AlertTriangle,
  },
}

export interface StatusBadgeProps {
  status: KuroStatus
  /** Override del label (ej. "Activa" en femenino para filiales). */
  label?: string
  className?: string
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const t = useTranslations('common.status')
  const key = status.toUpperCase() as KnownStatus
  const meta = STATUS_META[key] ?? {
    className: 'border-border text-muted-foreground',
  }
  const resolvedLabel = label ?? (t.has(key) ? t(key) : status)
  const Icon = meta.icon
  return (
    <Badge variant="outline" className={cn(meta.className, className)}>
      {Icon && <Icon className="h-3 w-3" />}
      {resolvedLabel}
    </Badge>
  )
}
