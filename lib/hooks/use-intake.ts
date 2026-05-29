'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { intakeApi } from '@/lib/api/endpoints'
import type { IntakeStatus } from '@/lib/api/types'
import { STALE, kuroRetry } from './_shared'

export interface UseIntakeRequestsParams {
  page?: number
  limit?: number
  status?: IntakeStatus
}

export function useIntakeRequests(
  orgId: string,
  branchId: string,
  params?: UseIntakeRequestsParams
) {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 20
  const status = params?.status

  return useQuery({
    queryKey: ['intake', orgId, branchId, { page, limit, status: status ?? null }],
    queryFn: () =>
      intakeApi.list(orgId, branchId, {
        page,
        limit,
        ...(status ? { status } : {}),
      }),
    staleTime: STALE.resource,
    retry: kuroRetry,
    enabled: Boolean(orgId && branchId),
    placeholderData: keepPreviousData,
  })
}
