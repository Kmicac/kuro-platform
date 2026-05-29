'use client'

import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/lib/api/endpoints'
import { STALE, kuroRetry } from './_shared'

export interface ActivityWindowParams {
  activityWindowDays?: number
}

export function useActionSummary(
  orgId: string,
  branchId: string,
  params?: ActivityWindowParams
) {
  return useQuery({
    queryKey: [
      'action-summary',
      orgId,
      branchId,
      params?.activityWindowDays ?? null,
    ],
    queryFn: () => analyticsApi.actionSummary(orgId, branchId, params),
    staleTime: STALE.analytics,
    retry: kuroRetry,
    enabled: Boolean(orgId && branchId),
  })
}

export interface UseRiskRosterParams extends ActivityWindowParams {
  limit?: number
}

export function useRiskRoster(
  orgId: string,
  branchId: string,
  params?: UseRiskRosterParams
) {
  return useQuery({
    queryKey: [
      'risk-roster',
      orgId,
      branchId,
      {
        activityWindowDays: params?.activityWindowDays ?? null,
        limit: params?.limit ?? null,
      },
    ],
    queryFn: () => analyticsApi.riskRoster(orgId, branchId, params),
    staleTime: STALE.analytics,
    retry: kuroRetry,
    enabled: Boolean(orgId && branchId),
  })
}
