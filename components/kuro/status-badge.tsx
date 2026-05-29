'use client'

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

interface StatusMeta {
  label: string
  className: string
  icon?: React.ComponentType<{ className?: string }>
}

const STATUS_META: Record<string, StatusMeta> = {
  ACTIVE: {
    label: 'Activo',
    className: 'border-primary/40 bg-primary/10 text-primary',
  },
  INACTIVE: {
    label: 'Inactivo',
    className: 'border-border text-muted-foreground',
  },
  SUSPENDED: {
    label: 'Suspendido',
    className:
      'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400',
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
  const meta = STATUS_META[status.toUpperCase()] ?? {
    label: status,
    className: 'border-border text-muted-foreground',
  }
  const Icon = meta.icon
  return (
    <Badge variant="outline" className={cn(meta.className, className)}>
      {Icon && <Icon className="h-3 w-3" />}
      {label ?? meta.label}
    </Badge>
  )
}
