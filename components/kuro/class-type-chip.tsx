'use client'

import { useTranslations } from 'next-intl'
import type { ClassType } from '@/lib/api/types'
import { CLASS_TYPE_HEX } from '@/lib/constants/class-types'
import { cn } from '@/lib/utils'

/**
 * ClassTypeChip — chip sobrio del tipo de clase (Design System 2.5.3).
 *
 * Paleta sobria desde `lib/constants/class-types.ts`. Estilo: background del
 * color al 18%, border sutil al 40%, y texto mezclado con `--foreground`
 * (color-mix) para mantener el hue de la family pero quedar legible (WCAG)
 * y adaptativo a dark/light. Sin solid background brillante.
 *
 * Los labels viven en `calendar.classType.*`; acá solo el estilo visual.
 */
type KnownClassType = ClassType

function styleFor(hex: string) {
  return {
    bg: `color-mix(in srgb, ${hex} 18%, transparent)`,
    border: `color-mix(in srgb, ${hex} 40%, transparent)`,
    // Mezcla con el foreground del tema → legible en dark y en light.
    text: `color-mix(in srgb, ${hex} 55%, var(--foreground))`,
  }
}

/**
 * Hook resolver para el label de un classType. Usar en cualquier client
 * component que necesite el label fuera del chip.
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
  const hex = CLASS_TYPE_HEX[upper] ?? CLASS_TYPE_HEX.PRIVATE
  const s = styleFor(hex)
  const label = t.has(upper) ? t(upper) : String(classType)

  if (variant === 'dot') {
    return (
      <span className={cn('inline-flex items-center gap-1.5', className)}>
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: hex }}
          aria-hidden
        />
        <span className="text-xs font-medium" style={{ color: s.text }}>
          {label}
        </span>
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium',
        className,
      )}
      style={{ backgroundColor: s.bg, borderColor: s.border, color: s.text }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: hex }}
        aria-hidden
      />
      {label}
    </span>
  )
}
