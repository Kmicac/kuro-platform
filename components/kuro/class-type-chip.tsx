'use client'

import type { ClassType } from '@/lib/api/types'
import { cn } from '@/lib/utils'

/**
 * Mapping classType → tokens KURO. Espeja a KURO_CLASS_TYPE_COLORS del
 * event-manager pero mantiene una versión local pensada para chip inline
 * (sin layout de dropdown). Usar siempre este componente cuando se muestra
 * el classType en una card, una row de tabla o el header del session-detail.
 */
interface ClassTypeMeta {
  label: string
  dot: string
  text: string
  border: string
  bg: string
}

const CLASS_TYPE_META: Record<string, ClassTypeMeta> = {
  GI:           { label: 'Gi',          dot: 'bg-blue-500',    text: 'text-blue-700 dark:text-blue-300',     border: 'border-blue-500/40',    bg: 'bg-blue-500/10' },
  NO_GI:        { label: 'No-Gi',       dot: 'bg-purple-500',  text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-500/40',  bg: 'bg-purple-500/10' },
  FUNDAMENTALS: { label: 'Fundamentos', dot: 'bg-teal-500',    text: 'text-teal-700 dark:text-teal-300',     border: 'border-teal-500/40',    bg: 'bg-teal-500/10' },
  ADVANCED:     { label: 'Avanzados',   dot: 'bg-orange-400',  text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-400/40',  bg: 'bg-orange-400/10' },
  KIDS:         { label: 'Kids',        dot: 'bg-amber-500',   text: 'text-amber-700 dark:text-amber-300',   border: 'border-amber-500/40',   bg: 'bg-amber-500/10' },
  COMPETITION:  { label: 'Competición', dot: 'bg-red-600',     text: 'text-red-700 dark:text-red-300',       border: 'border-red-600/40',     bg: 'bg-red-600/10' },
  OPEN_MAT:     { label: 'Open Mat',    dot: 'bg-green-600',   text: 'text-green-700 dark:text-green-300',   border: 'border-green-600/40',   bg: 'bg-green-600/10' },
  SEMINAR:      { label: 'Seminario',   dot: 'bg-pink-500',    text: 'text-pink-700 dark:text-pink-300',     border: 'border-pink-500/40',    bg: 'bg-pink-500/10' },
  PRIVATE:      { label: 'Privada',     dot: 'bg-neutral-500', text: 'text-foreground',                       border: 'border-border',         bg: 'bg-muted/30' },
}

export function classTypeLabel(classType: ClassType | string): string {
  return CLASS_TYPE_META[String(classType).toUpperCase()]?.label ?? String(classType)
}

export interface ClassTypeChipProps {
  classType: ClassType | string
  /** outlined: chip con borde tintado. dot: solo dot + label inline. */
  variant?: 'outlined' | 'dot'
  className?: string
}

export function ClassTypeChip({
  classType,
  variant = 'outlined',
  className,
}: ClassTypeChipProps) {
  const meta =
    CLASS_TYPE_META[String(classType).toUpperCase()] ?? CLASS_TYPE_META.PRIVATE

  if (variant === 'dot') {
    return (
      <span className={cn('inline-flex items-center gap-1.5', className)}>
        <span className={cn('h-2 w-2 rounded-full', meta.dot)} aria-hidden />
        <span className={cn('text-xs font-medium', meta.text)}>
          {meta.label}
        </span>
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium',
        meta.border,
        meta.bg,
        meta.text,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} aria-hidden />
      {meta.label}
    </span>
  )
}
