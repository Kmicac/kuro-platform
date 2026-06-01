'use client'

import { useTranslations } from 'next-intl'
import type {
  PromotionRank,
  PromotionRankCatalogEntry,
} from '@/lib/api/types'
import { cn } from '@/lib/utils'

/**
 * Visual meta de las 18 fajas reales del backend.
 *
 * Layout: rectángulo horizontal con mainColor ocupando el 100% del ancho,
 * salvo que tenga `tipColor` — en ese caso mainColor toma 75% y la punta
 * derecha toma 25%. Los stripes (dots) se renderizan al 75% del ancho de
 * la mainColor (es decir, en la región sólida, NO en la punta).
 */
interface BeltVisualMeta {
  /** Color principal (cinta sólida) */
  mainColor: string
  /** Punta derecha (solo en KIDS_*_WHITE / KIDS_*_BLACK) */
  tipColor?: string
  /** Color del label sobre mainColor (contraste WCAG) */
  textColor: string
  /** Color de los stripes (dots) sobre mainColor */
  stripeColor: string
}

const BELT_VISUAL_META: Record<PromotionRank, BeltVisualMeta> = {
  KIDS_WHITE:        { mainColor: '#f0f0ec',                       textColor: '#111111', stripeColor: '#111111' },
  KIDS_GREY_WHITE:   { mainColor: '#6b7280', tipColor: '#f0f0ec', textColor: '#ffffff', stripeColor: '#ffffff' },
  KIDS_GREY:         { mainColor: '#6b7280',                       textColor: '#ffffff', stripeColor: '#ffffff' },
  KIDS_GREY_BLACK:   { mainColor: '#6b7280', tipColor: '#111111', textColor: '#ffffff', stripeColor: '#ffffff' },
  KIDS_YELLOW_WHITE: { mainColor: '#fbbf24', tipColor: '#f0f0ec', textColor: '#111111', stripeColor: '#111111' },
  KIDS_YELLOW:       { mainColor: '#fbbf24',                       textColor: '#111111', stripeColor: '#111111' },
  KIDS_YELLOW_BLACK: { mainColor: '#fbbf24', tipColor: '#111111', textColor: '#111111', stripeColor: '#111111' },
  KIDS_ORANGE_WHITE: { mainColor: '#ea7c3c', tipColor: '#f0f0ec', textColor: '#ffffff', stripeColor: '#ffffff' },
  KIDS_ORANGE:       { mainColor: '#ea7c3c',                       textColor: '#ffffff', stripeColor: '#ffffff' },
  KIDS_ORANGE_BLACK: { mainColor: '#ea7c3c', tipColor: '#111111', textColor: '#ffffff', stripeColor: '#ffffff' },
  KIDS_GREEN_WHITE:  { mainColor: '#2d7a2d', tipColor: '#f0f0ec', textColor: '#ffffff', stripeColor: '#ffffff' },
  KIDS_GREEN:        { mainColor: '#2d7a2d',                       textColor: '#ffffff', stripeColor: '#ffffff' },
  KIDS_GREEN_BLACK:  { mainColor: '#2d7a2d', tipColor: '#111111', textColor: '#ffffff', stripeColor: '#ffffff' },
  ADULT_WHITE:       { mainColor: '#f0f0ec',                       textColor: '#111111', stripeColor: '#111111' },
  ADULT_BLUE:        { mainColor: '#1a4fa0',                       textColor: '#ffffff', stripeColor: '#ffffff' },
  ADULT_PURPLE:      { mainColor: '#6a1b9a',                       textColor: '#ffffff', stripeColor: '#ffffff' },
  ADULT_BROWN:       { mainColor: '#5d3a1a',                       textColor: '#ffffff', stripeColor: '#ffffff' },
  ADULT_BLACK:       { mainColor: '#111111',                       textColor: '#f0f0ec', stripeColor: '#f0f0ec' },
}

// Tamaños — rectángulo de cinta + stripe + label.
interface SizeSpec {
  width: number
  height: number
  stripeSize: number
  stripeGap: number
  labelClass: string
}

const SIZE_SPEC: Record<'sm' | 'md' | 'lg', SizeSpec> = {
  sm: { width: 60,  height: 14, stripeSize: 3, stripeGap: 2,   labelClass: 'text-[10px]' },
  md: { width: 90,  height: 18, stripeSize: 4, stripeGap: 3,   labelClass: 'text-xs' },
  lg: { width: 120, height: 24, stripeSize: 5, stripeGap: 3.5, labelClass: 'text-sm' },
}

export interface BeltBadgeProps {
  /** Catálogo rico ya resuelto. Si es `null`, se renderiza el estado "Sin rango". */
  rank: PromotionRankCatalogEntry | null
  /** 0-4. Se capea a `rank.maxStripes`. Si `rank.maxStripes === 0`, no se renderiza. */
  stripes?: number
  /** Tamaño del rectángulo. En `sm` el label queda oculto siempre. */
  size?: 'sm' | 'md' | 'lg'
  /** Mostrar label al lado. Default true en md/lg, ignorado en sm. */
  showLabel?: boolean
  className?: string
}

export function BeltBadge({
  rank,
  stripes,
  size = 'md',
  showLabel = true,
  className,
}: BeltBadgeProps) {
  const t = useTranslations('students.belt')
  const spec = SIZE_SPEC[size]
  const renderLabel = showLabel && size !== 'sm'

  // Estado "Sin rango" — neutral con tokens del theme.
  if (!rank) {
    const ariaLabel = t('noRankAria')
    return (
      <span
        role="img"
        aria-label={ariaLabel}
        title={ariaLabel}
        className={cn('inline-flex items-center gap-2', className)}
      >
        <span
          className="rounded-sm border bg-muted"
          style={{
            width: spec.width,
            height: spec.height,
            borderColor: 'var(--border)',
          }}
        />
        {renderLabel && (
          <span
            className={cn(
              spec.labelClass,
              'font-medium text-muted-foreground'
            )}
          >
            {t('noRank')}
          </span>
        )}
      </span>
    )
  }

  const meta = BELT_VISUAL_META[rank.rank]
  const cappedStripes = Math.max(
    0,
    Math.min(stripes ?? 0, rank.maxStripes)
  )

  // mainColor toma 75% si hay tipColor; sino 100%.
  const mainWidthPct = meta.tipColor ? 75 : 100

  // Stripes vivien dentro de la franja mainColor — específicamente al
  // 75% del ancho de mainColor.
  const stripeRegionWidthPct = mainWidthPct * 0.75
  const stripeRegionLeftPct = mainWidthPct * 0.125 // centrado: (1 - 0.75) / 2

  const ariaLabel =
    cappedStripes > 0
      ? t('rankWithStripes', { rank: rank.label, count: cappedStripes })
      : rank.label

  return (
    <span
      role="img"
      aria-label={ariaLabel}
      title={ariaLabel}
      className={cn('inline-flex items-center gap-2', className)}
    >
      {/* Cinta */}
      <span
        className="relative rounded-sm border overflow-hidden flex-shrink-0"
        style={{
          width: spec.width,
          height: spec.height,
          borderColor: 'var(--border)',
          backgroundColor: meta.mainColor,
        }}
      >
        {/* Punta derecha (si corresponde) */}
        {meta.tipColor && (
          <span
            className="absolute top-0 right-0 h-full"
            style={{
              width: `${100 - mainWidthPct}%`,
              backgroundColor: meta.tipColor,
            }}
            aria-hidden
          />
        )}

        {/* Stripes — dentro de mainColor, no en la punta */}
        {cappedStripes > 0 && rank.maxStripes > 0 && (
          <span
            className="absolute top-1/2 -translate-y-1/2 flex items-center justify-around"
            style={{
              left: `${stripeRegionLeftPct}%`,
              width: `${stripeRegionWidthPct}%`,
              height: spec.height,
              gap: spec.stripeGap,
            }}
            aria-hidden
          >
            {Array.from({ length: cappedStripes }).map((_, i) => (
              <span
                key={i}
                className="rounded-full"
                style={{
                  width: spec.stripeSize,
                  height: spec.stripeSize,
                  backgroundColor: meta.stripeColor,
                }}
              />
            ))}
          </span>
        )}
      </span>

      {/* Label externo */}
      {renderLabel && (
        <span className={cn(spec.labelClass, 'font-medium text-foreground')}>
          {rank.label}
        </span>
      )}
    </span>
  )
}
