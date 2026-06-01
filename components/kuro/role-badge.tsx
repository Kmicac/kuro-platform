'use client'

import { useTranslations } from 'next-intl'
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

// Solo el estilo visual vive acá; los labels vienen de common.roles.*
const ROLE_CLASS: Record<KuroRole, string> = {
  MESTRE: 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-300',
  ORG_ADMIN:
    'border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300',
  ACADEMY_MANAGER:
    'border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  HEAD_COACH:
    'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  INSTRUCTOR: 'border-primary/40 bg-primary/10 text-primary',
  STAFF: 'border-border text-muted-foreground',
  STUDENT: 'border-border text-foreground',
}

export interface RoleBadgeProps {
  role?: string | null
  className?: string
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const t = useTranslations('common.roles')
  if (!role) return null
  const key = role.toUpperCase() as KuroRole
  const roleClass = ROLE_CLASS[key] ?? 'border-border text-muted-foreground'
  const label = t.has(key) ? t(key) : role
  return (
    <Badge
      variant="outline"
      className={cn('uppercase tracking-wide', roleClass, className)}
    >
      {label}
    </Badge>
  )
}
