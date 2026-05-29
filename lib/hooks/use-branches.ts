'use client'

import { useQuery } from '@tanstack/react-query'
import { analyticsApi, branchesApi } from '@/lib/api/endpoints'
import { STALE, kuroRetry } from './_shared'

export function useBranches(orgId: string) {
  return useQuery({
    queryKey: ['branches', orgId],
    queryFn: () => branchesApi.list(orgId),
    staleTime: STALE.reference,
    retry: kuroRetry,
    enabled: Boolean(orgId),
  })
}

export function useBranch(orgId: string, branchId: string) {
  return useQuery({
    queryKey: ['branch', orgId, branchId],
    queryFn: () => branchesApi.get(orgId, branchId),
    staleTime: STALE.reference,
    retry: kuroRetry,
    enabled: Boolean(orgId && branchId),
  })
}

export function useTreeSummary(
  orgId: string,
  params?: { activityWindowDays?: number }
) {
  return useQuery({
    queryKey: ['tree-summary', orgId, params?.activityWindowDays ?? null],
    queryFn: () => analyticsApi.treeSummary(orgId, params),
    staleTime: STALE.analytics,
    retry: kuroRetry,
    enabled: Boolean(orgId),
  })
}
