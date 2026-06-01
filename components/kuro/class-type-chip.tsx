'use client'

import { useTranslations } from 'next-intl'
import type { ClassType } from '@/lib/api/types'
import { cn } from '@/lib/utils'

/**
 * Mapping classType → tokens KURO. Espeja a KURO_CLASS_TYPE_COLORS del
 * event-manager pero mantiene una versión local pensada para chip inline
 * (sin layout de dropdown). Usar siempre este componente cuando se muestra
 * el classType en una card, una row de tabla o el header del session-detail.
 *
 * Los labels viven en calendar.classType.*; acá solo el estilo visual.
 */
type KnownClassType =
  | 'GI'
  | 'NO_GI'
  | 'FUNDAMENTALS'
  | 'ADVANCED'
  | 'KIDS'
  | 'COMPETITION'
  | 'OPEN_MAT'
  | 'SEMINAR'
  | 'PRIVATE'

interface ClassTypeMeta {
  dot: string
  text: string
  border: string
  bg: string
}

const CLASS_TYPE_META: Record<KnownClassType, ClassTypeMeta> = {
  GI:           { dot: 'bg-blue-500',    text: 'text-blue-700 dark:text-blue-300',     border: 'border-blue-500/40',    bg: 'bg-blue-500/10' },
  NO_GI:        { dot: 'bg-purple-500',  text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-500/40',  bg: 'bg-purple-500/10' },
  FUNDAMENTALS: { dot: 'bg-teal-500',    text: 'text-teal-700 dark:text-teal-300',     border: 'border-teal-500/40',    bg: 'bg-teal-500/10' },
  ADVANCED:     { dot: 'bg-orange-400',  text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-400/40',  bg: 'bg-orange-400/10' },
  KIDS:         { dot: 'bg-amber-500',   text: 'text-amber-700 dark:text-amber-300',   border: 'border-amber-500/40',   bg: 'bg-amber-500/10' },
  COMPETITION:  { dot: 'bg-red-600',     text: 'text-red-700 dark:text-red-300',       border: 'border-red-600/40',     bg: 'bg-red-600/10' },
  OPEN_MAT:     { dot: 'bg-green-600',   text: 'text-green-700 dark:text-green-300',   border: 'border-green-600/40',   bg: 'bg-green-600/10' },
  SEMINAR:      { dot: 'bg-pink-500',    text: 'text-pink-700 dark:text-pink-300',     border: 'border-pink-500/40',    bg: 'bg-pink-500/10' },
  PRIVATE:      { dot: 'bg-neutral-500', text: 'text-foreground',                       border: 'border-border',         bg: 'bg-muted/30' },
}

/**
 * Hook resolver para el label de un classType. Reemplaza al antiguo helper
 * `classTypeLabel()` (no podía traducir al no ser un componente). Usar en
 * cualquier client component que necesite el label fuera del chip.
 */
export function useClassTypeLabel() {
  const t = useTranslations('calendar.classType')
  return (classType: ClassType | string): string => {
    const key = String(classType).toUpperCase() as KnownClassType
    return t.has(key) ? t(key) : String(classType)
  }
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
  const t = useTranslations('calendar.classType')
  const upper = String(classType).toUpperCase() as KnownClassType
  const meta = CLASS_TYPE_META[upper] ?? CLASS_TYPE_META.PRIVATE
  const label = t.has(upper) ? t(upper) : String(classType)

  if (variant === 'dot') {
    return (
      <span className={cn('inline-flex items-center gap-1.5', className)}>
        <span className={cn('h-2 w-2 rounded-full', meta.dot)} aria-hidden />
        <span className={cn('text-xs font-medium', meta.text)}>
          {label}
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
      {label}
    </span>
  )
}
