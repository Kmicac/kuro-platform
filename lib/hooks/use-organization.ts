'use client'

import { useQuery } from '@tanstack/react-query'
import { organizationsApi } from '@/lib/api/endpoints'
import { STALE, kuroRetry } from './_shared'

export function useOrganization(orgId: string) {
  return useQuery({
    queryKey: ['organization', orgId],
    queryFn: () => organizationsApi.get(orgId),
    staleTime: STALE.reference,
    retry: kuroRetry,
    enabled: Boolean(orgId),
  })
}
