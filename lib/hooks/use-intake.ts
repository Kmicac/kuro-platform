'use client'

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { intakeApi } from '@/lib/api/endpoints'
import type {
  IntakeRequestDetail,
  IntakeStatus,
  IntakeTransitionBody,
} from '@/lib/api/types'
import { STALE, kuroRetry } from './_shared'

export interface UseIntakeRequestsParams {
  page?: number
  limit?: number
  status?: IntakeStatus
}

export function intakeRequestsKey(
  orgId: string,
  branchId: string,
  params?: UseIntakeRequestsParams,
) {
  return [
    'intake',
    orgId,
    branchId,
    {
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
      status: params?.status ?? null,
    },
  ] as const
}

export function intakeDetailKey(
  orgId: string,
  requestId?: string | null,
) {
  return ['intake-detail', orgId, requestId ?? null] as const
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
    queryKey: intakeRequestsKey(orgId, branchId, { page, limit, status }),
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

export function useIntakeRequestDetail(
  orgId: string,
  requestId?: string | null,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: intakeDetailKey(orgId, requestId),
    queryFn: () => {
      if (!requestId) throw new Error('Missing intake request id')
      return intakeApi.getById(orgId, requestId)
    },
    staleTime: STALE.detail,
    retry: kuroRetry,
    enabled: Boolean(orgId && requestId && (options?.enabled ?? true)),
  })
}

export function useTransitionIntakeRequest(
  orgId: string,
  requestId?: string | null,
  branchId?: string | null,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: IntakeTransitionBody) => {
      if (!requestId) throw new Error('Missing intake request id')
      return intakeApi.transition(orgId, requestId, body)
    },
    onSuccess: (data) => {
      queryClient.setQueryData<IntakeRequestDetail>(
        intakeDetailKey(orgId, requestId),
        data,
      )
    },
    onSettled: () => {
      if (requestId) {
        queryClient.invalidateQueries({
          queryKey: intakeDetailKey(orgId, requestId),
        })
      }

      if (branchId) {
        queryClient.invalidateQueries({
          queryKey: ['intake', orgId, branchId],
        })
      } else {
        queryClient.invalidateQueries({ queryKey: ['intake', orgId] })
      }
    },
  })
}
