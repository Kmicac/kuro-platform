'use client'

import { useTranslations } from 'next-intl'
import { BjjBelt } from '@/components/common/bjj-belt'
import type { PromotionRankCatalogEntry } from '@/lib/api/types'

export interface BeltBadgeProps {
  /** Catálogo rico ya resuelto. Si es `null`, se renderiza el estado "Sin rango". */
  rank: PromotionRankCatalogEntry | null
  /** 0-4. Se capea a `rank.maxStripes`. */
  stripes?: number | null
  /** Tamaño del cinturón. En `sm` el label queda oculto siempre. */
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
  const cappedStripes = rank
    ? Math.max(0, Math.min(stripes ?? 0, 4, rank.maxStripes))
    : 0
  const ariaLabel = rank
    ? cappedStripes > 0
      ? t('rankWithStripes', { rank: rank.label, count: cappedStripes })
      : rank.label
    : t('noRankAria')

  return (
    <BjjBelt
      rank={rank}
      stripes={cappedStripes}
      size={size}
      showLabel={showLabel}
      noRankLabel={t('noRank')}
      ariaLabel={ariaLabel}
      className={className}
    />
  )
}
