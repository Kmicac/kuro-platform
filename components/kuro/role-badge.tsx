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
// KURO Design System 2.5 — la jerarquía la da la tipografía (uppercase mono),
// NO un arcoíris de colores. Acento primary solo para el rol más alto; el
// resto neutral/sobrio. INSTRUCTOR mantiene un primary tenue.
const ROLE_CLASS: Record<KuroRole, string> = {
  MESTRE: 'border-primary/50 bg-primary/15 text-primary',
  ORG_ADMIN: 'border-primary/30 bg-primary/[0.07] text-foreground',
  ACADEMY_MANAGER: 'border-border bg-muted/50 text-foreground',
  HEAD_COACH: 'border-border bg-muted/50 text-foreground',
  INSTRUCTOR: 'border-primary/30 bg-primary/[0.07] text-primary',
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
