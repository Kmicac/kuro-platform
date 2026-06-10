'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { billingApi } from '@/lib/api/endpoints'
import type {
  BranchBillingSummaryQuery,
  BranchStudentFinancialStatusesQuery,
} from '@/lib/api/billing.types'
import { STALE, kuroRetry } from './_shared'

interface BillingQueryOptions {
  enabled?: boolean
}

export function useBillingPlans(
  orgId: string,
  branchId: string,
  options?: BillingQueryOptions
) {
  return useQuery({
    queryKey: ['billing-plans', orgId, branchId],
    queryFn: () => billingApi.plans(orgId, branchId),
    staleTime: STALE.resource,
    retry: kuroRetry,
    enabled: Boolean(orgId && branchId && (options?.enabled ?? true)),
  })
}

export function useBranchBillingSummary(
  orgId: string,
  branchId: string,
  params?: BranchBillingSummaryQuery,
  options?: BillingQueryOptions
) {
  const dateFrom = params?.dateFrom || undefined
  const dateTo = params?.dateTo || undefined
  const currency = params?.currency?.trim().toUpperCase() || undefined

  return useQuery({
    queryKey: [
      'billing-summary',
      orgId,
      branchId,
      {
        dateFrom: dateFrom ?? null,
        dateTo: dateTo ?? null,
        currency: currency ?? null,
      },
    ],
    queryFn: () =>
      billingApi.branchSummary(orgId, branchId, {
        dateFrom,
        dateTo,
        currency,
    }),
    staleTime: STALE.analytics,
    retry: kuroRetry,
    enabled: Boolean(orgId && branchId && (options?.enabled ?? true)),
  })
}

export function useBranchFinancialStatuses(
  orgId: string,
  branchId: string,
  params?: BranchStudentFinancialStatusesQuery,
  options?: BillingQueryOptions
) {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 20
  const financialStatus = params?.financialStatus

  return useQuery({
    queryKey: [
      'billing-financial-statuses',
      orgId,
      branchId,
      { page, limit, financialStatus: financialStatus ?? null },
    ],
    queryFn: () =>
      billingApi.studentFinancialStatuses(orgId, branchId, {
        page,
        limit,
        financialStatus,
    }),
    staleTime: STALE.resource,
    retry: kuroRetry,
    enabled: Boolean(orgId && branchId && (options?.enabled ?? true)),
    placeholderData: keepPreviousData,
  })
}
