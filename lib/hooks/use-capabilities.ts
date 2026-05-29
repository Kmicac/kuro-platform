'use client'

import { useQuery } from '@tanstack/react-query'
import { capabilitiesApi } from '@/lib/api/endpoints'
import { STALE, kuroRetry } from './_shared'

export function useCapabilities(orgId: string) {
  return useQuery({
    queryKey: ['capabilities', orgId],
    queryFn: () => capabilitiesApi.get(orgId),
    staleTime: STALE.reference,
    retry: kuroRetry,
    enabled: Boolean(orgId),
  })
}
