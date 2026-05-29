'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type KuroRole =
  | 'MESTRE'
  | 'ORG_ADMIN'
  | 'ACADEMY_MANAGER'
  | 'HEAD_COACH'
  | 'INSTRUCTOR'
  | 'STAFF'
  | 'STUDENT'

interface RoleMeta {
  label: string
  className: string
}

const ROLE_META: Record<KuroRole, RoleMeta> = {
  MESTRE: {
    label: 'Mestre',
    className:
      'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-300',
  },
  ORG_ADMIN: {
    label: 'Org admin',
    className:
      'border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300',
  },
  ACADEMY_MANAGER: {
    label: 'Manager',
    className:
      'border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  },
  HEAD_COACH: {
    label: 'Head coach',
    className:
      'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
  INSTRUCTOR: {
    label: 'Instructor',
    className: 'border-primary/40 bg-primary/10 text-primary',
  },
  STAFF: {
    label: 'Staff',
    className: 'border-border text-muted-foreground',
  },
  STUDENT: {
    label: 'Alumno',
    className: 'border-border text-foreground',
  },
}

export interface RoleBadgeProps {
  role?: string | null
  className?: string
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  if (!role) return null
  const key = role.toUpperCase() as KuroRole
  const meta = ROLE_META[key] ?? {
    label: role,
    className: 'border-border text-muted-foreground',
  }
  return (
    <Badge
      variant="outline"
      className={cn('uppercase tracking-wide', meta.className, className)}
    >
      {meta.label}
    </Badge>
  )
}
