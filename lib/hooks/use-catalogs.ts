'use client'

import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { catalogsApi } from '@/lib/api/endpoints'
import type {
  PromotionRank,
  PromotionRankCatalogEntry,
} from '@/lib/api/types'
import { kuroRetry } from './_shared'

/**
 * Catálogo estático de promotion ranks.
 *
 * staleTime/gcTime: Infinity — el catálogo no cambia en runtime.
 * TanStack Query deduplica suscripciones automáticamente, así que
 * múltiples componentes consumiendo este hook hacen 1 sola request.
 */
export function usePromotionRankCatalog() {
  return useQuery({
    queryKey: ['catalog', 'promotion-ranks'],
    queryFn: catalogsApi.promotionRanks,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: kuroRetry,
  })
}

/**
 * Resolver helper — convierte un PromotionRank string al entry completo.
 *
 * Patrón de uso: invocar en el componente PADRE una sola vez, después
 * pasar el entry resuelto a `<BeltBadge rank={entry} />`. BeltBadge NO
 * usa este hook — es un componente puro que recibe el entry ya resuelto.
 * Esto evita N suscripciones cuando hay N badges en pantalla.
 */
export function usePromotionRankResolver() {
  const { data: catalog } = usePromotionRankCatalog()

  return useCallback(
    (
      rank: PromotionRank | string | null | undefined
    ): PromotionRankCatalogEntry | null => {
      if (!rank || !catalog) return null
      return catalog.find((r) => r.rank === rank) ?? null
    },
    [catalog]
  )
}
