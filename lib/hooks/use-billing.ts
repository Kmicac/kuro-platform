'use client'

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { billingApi } from '@/lib/api/endpoints'
import type {
  BillingChargeListQuery,
  BillingPlanResponse,
  BranchBillingSummaryQuery,
  BranchStudentFinancialStatusesQuery,
  CreateBillingChargeRequest,
  PaymentListQuery,
  PossibleDuplicatePaymentsQuery,
  RecordGeneralIncomeRequest,
  RecordManualStudentPaymentRequest,
  StudentBillingChargesQuery,
  StudentPaymentsQuery,
  CreateBillingPlanRequest,
  UpdateBillingPlanRequest,
} from '@/lib/api/billing.types'
import { STALE, kuroRetry } from './_shared'

interface BillingQueryOptions {
  enabled?: boolean
}

function billingPlansKey(orgId: string, branchId: string) {
  return ['billing-plans', orgId, branchId] as const
}

function branchChargesKey(
  orgId: string,
  branchId: string,
  params: Required<
    Pick<BillingChargeListQuery, 'page' | 'limit'>
  > &
    Omit<BillingChargeListQuery, 'page' | 'limit'>
) {
  return ['billing-branch-charges', orgId, branchId, params] as const
}

function branchChargesFilter(orgId: string, branchId: string) {
  return { queryKey: ['billing-branch-charges', orgId, branchId] as const }
}

function studentChargesKey(
  orgId: string,
  studentId: string,
  params: Required<
    Pick<StudentBillingChargesQuery, 'page' | 'limit'>
  > &
    Omit<StudentBillingChargesQuery, 'page' | 'limit'>
) {
  return ['billing-student-charges', orgId, studentId, params] as const
}

function studentChargesFilter(orgId: string, studentId: string) {
  return { queryKey: ['billing-student-charges', orgId, studentId] as const }
}

function branchPaymentsKey(
  orgId: string,
  branchId: string,
  params: Required<Pick<PaymentListQuery, 'page' | 'limit'>> &
    Omit<PaymentListQuery, 'page' | 'limit'>
) {
  return ['billing-branch-payments', orgId, branchId, params] as const
}

function branchPaymentsFilter(orgId: string, branchId: string) {
  return { queryKey: ['billing-branch-payments', orgId, branchId] as const }
}

function studentPaymentsKey(
  orgId: string,
  studentId: string,
  params: Required<Pick<StudentPaymentsQuery, 'page' | 'limit'>> &
    Omit<StudentPaymentsQuery, 'page' | 'limit'>
) {
  return ['billing-student-payments', orgId, studentId, params] as const
}

function studentPaymentsFilter(orgId: string, studentId: string) {
  return { queryKey: ['billing-student-payments', orgId, studentId] as const }
}

function possibleDuplicatePaymentsKey(
  orgId: string,
  branchId: string,
  params: Required<
    Pick<PossibleDuplicatePaymentsQuery, 'windowDays' | 'limit'>
  > &
    Omit<PossibleDuplicatePaymentsQuery, 'windowDays' | 'limit'>
) {
  return ['billing-possible-duplicate-payments', orgId, branchId, params] as const
}

function possibleDuplicatePaymentsFilter(orgId: string, branchId: string) {
  return {
    queryKey: ['billing-possible-duplicate-payments', orgId, branchId] as const,
  }
}

function normalizeChargeParams(params?: BillingChargeListQuery) {
  return {
    page: params?.page ?? 1,
    limit: params?.limit ?? 20,
    studentId: params?.studentId || undefined,
    billingPlanId: params?.billingPlanId || undefined,
    chargeType: params?.chargeType,
    status: params?.status,
    currency: params?.currency?.trim().toUpperCase() || undefined,
    dateFrom: params?.dateFrom || undefined,
    dateTo: params?.dateTo || undefined,
  }
}

function normalizeStudentChargeParams(params?: StudentBillingChargesQuery) {
  const normalized = normalizeChargeParams(params)
  return {
    page: normalized.page,
    limit: normalized.limit,
    billingPlanId: normalized.billingPlanId,
    chargeType: normalized.chargeType,
    status: normalized.status,
    currency: normalized.currency,
    dateFrom: normalized.dateFrom,
    dateTo: normalized.dateTo,
  }
}

function normalizePaymentParams(params?: PaymentListQuery) {
  return {
    page: params?.page ?? 1,
    limit: params?.limit ?? 20,
    studentId: params?.studentId || undefined,
    method: params?.method,
    status: params?.status,
    paymentKind: params?.paymentKind,
    currency: params?.currency?.trim().toUpperCase() || undefined,
    dateFrom: params?.dateFrom || undefined,
    dateTo: params?.dateTo || undefined,
  }
}

function normalizeStudentPaymentParams(params?: StudentPaymentsQuery) {
  const normalized = normalizePaymentParams(params)
  return {
    page: normalized.page,
    limit: normalized.limit,
    method: normalized.method,
    status: normalized.status,
    currency: normalized.currency,
    dateFrom: normalized.dateFrom,
    dateTo: normalized.dateTo,
  }
}

function normalizePossibleDuplicatePaymentParams(
  params?: PossibleDuplicatePaymentsQuery
) {
  return {
    dateFrom: params?.dateFrom || undefined,
    dateTo: params?.dateTo || undefined,
    method: params?.method,
    status: params?.status,
    paymentKind: params?.paymentKind,
    currency: params?.currency?.trim().toUpperCase() || undefined,
    studentId: params?.studentId || undefined,
    windowDays: params?.windowDays ?? 3,
    limit: params?.limit ?? 100,
  }
}

export function useBillingPlans(
  orgId: string,
  branchId: string,
  options?: BillingQueryOptions
) {
  return useQuery({
    queryKey: billingPlansKey(orgId, branchId),
    queryFn: () => billingApi.plans(orgId, branchId),
    staleTime: STALE.resource,
    retry: kuroRetry,
    enabled: Boolean(orgId && branchId && (options?.enabled ?? true)),
  })
}

export function useCreateBillingPlan(orgId: string, branchId: string) {
  const queryClient = useQueryClient()
  const queryKey = billingPlansKey(orgId, branchId)

  return useMutation({
    mutationFn: (body: CreateBillingPlanRequest) =>
      billingApi.createPlan(orgId, branchId, body),
    onSuccess: (created) => {
      queryClient.setQueryData<BillingPlanResponse[]>(queryKey, (old) =>
        old ? [created, ...old.filter((plan) => plan.id !== created.id)] : old
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
}

export function useUpdateBillingPlan(
  orgId: string,
  branchId: string,
  planId: string
) {
  const queryClient = useQueryClient()
  const queryKey = billingPlansKey(orgId, branchId)

  return useMutation({
    mutationFn: (body: UpdateBillingPlanRequest) =>
      billingApi.updatePlan(orgId, branchId, planId, body),
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<BillingPlanResponse[]>(queryKey)
      queryClient.setQueryData<BillingPlanResponse[]>(queryKey, (old) =>
        old?.map((plan) =>
          plan.id === planId
            ? {
                ...plan,
                ...body,
                updatedAt: new Date().toISOString(),
                description:
                  body.description === undefined
                    ? plan.description
                    : body.description,
                enrollmentFeeAmount:
                  body.enrollmentFeeAmount === undefined
                    ? plan.enrollmentFeeAmount
                    : String(body.enrollmentFeeAmount),
                amount:
                  body.amount === undefined ? plan.amount : String(body.amount),
              }
            : plan
        )
      )
      return { previous }
    },
    onError: (_error, _body, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<BillingPlanResponse[]>(queryKey, (old) =>
        old?.map((plan) => (plan.id === updated.id ? updated : plan))
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
}

export function useBranchBillingCharges(
  orgId: string,
  branchId: string,
  params?: BillingChargeListQuery,
  options?: BillingQueryOptions
) {
  const normalized = normalizeChargeParams(params)

  return useQuery({
    queryKey: branchChargesKey(orgId, branchId, normalized),
    queryFn: () => billingApi.branchCharges(orgId, branchId, normalized),
    staleTime: STALE.resource,
    retry: kuroRetry,
    enabled: Boolean(orgId && branchId && (options?.enabled ?? true)),
    placeholderData: keepPreviousData,
  })
}

export function useStudentBillingCharges(
  orgId: string,
  studentId: string,
  params?: StudentBillingChargesQuery,
  options?: BillingQueryOptions
) {
  const normalized = normalizeStudentChargeParams(params)

  return useQuery({
    queryKey: studentChargesKey(orgId, studentId, normalized),
    queryFn: () => billingApi.studentCharges(orgId, studentId, normalized),
    staleTime: STALE.resource,
    retry: kuroRetry,
    enabled: Boolean(orgId && studentId && (options?.enabled ?? true)),
    placeholderData: keepPreviousData,
  })
}

export function useCreateBillingCharge(orgId: string, studentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CreateBillingChargeRequest) =>
      billingApi.createCharge(orgId, studentId, body),
    onSuccess: (created) => {
      queryClient.invalidateQueries(branchChargesFilter(orgId, created.branchId))
      queryClient.invalidateQueries(studentChargesFilter(orgId, studentId))
      queryClient.invalidateQueries(branchPaymentsFilter(orgId, created.branchId))
      queryClient.invalidateQueries(studentPaymentsFilter(orgId, studentId))
      queryClient.invalidateQueries({
        queryKey: ['billing-financial-statuses', orgId, created.branchId],
      })
      queryClient.invalidateQueries({
        queryKey: ['billing-summary', orgId, created.branchId],
      })
    },
  })
}

export function useRecordManualStudentPayment(
  orgId: string,
  studentId: string
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: RecordManualStudentPaymentRequest) =>
      billingApi.recordManualStudentPayment(orgId, studentId, body),
    onSuccess: (payment) => {
      queryClient.invalidateQueries(branchChargesFilter(orgId, payment.branchId))
      queryClient.invalidateQueries(studentChargesFilter(orgId, studentId))
      queryClient.invalidateQueries(branchPaymentsFilter(orgId, payment.branchId))
      queryClient.invalidateQueries(studentPaymentsFilter(orgId, studentId))
      queryClient.invalidateQueries(
        possibleDuplicatePaymentsFilter(orgId, payment.branchId)
      )
      queryClient.invalidateQueries({
        queryKey: ['billing-financial-statuses', orgId, payment.branchId],
      })
      queryClient.invalidateQueries({
        queryKey: ['billing-summary', orgId, payment.branchId],
      })
    },
  })
}

export function useBranchPayments(
  orgId: string,
  branchId: string,
  params?: PaymentListQuery,
  options?: BillingQueryOptions
) {
  const normalized = normalizePaymentParams(params)

  return useQuery({
    queryKey: branchPaymentsKey(orgId, branchId, normalized),
    queryFn: () => billingApi.branchPayments(orgId, branchId, normalized),
    staleTime: STALE.resource,
    retry: kuroRetry,
    enabled: Boolean(orgId && branchId && (options?.enabled ?? true)),
    placeholderData: keepPreviousData,
  })
}

export function useStudentPayments(
  orgId: string,
  studentId: string,
  params?: StudentPaymentsQuery,
  options?: BillingQueryOptions
) {
  const normalized = normalizeStudentPaymentParams(params)

  return useQuery({
    queryKey: studentPaymentsKey(orgId, studentId, normalized),
    queryFn: () => billingApi.studentPayments(orgId, studentId, normalized),
    staleTime: STALE.resource,
    retry: kuroRetry,
    enabled: Boolean(orgId && studentId && (options?.enabled ?? true)),
    placeholderData: keepPreviousData,
  })
}

export function usePossibleDuplicatePayments(
  orgId: string,
  branchId: string,
  params?: PossibleDuplicatePaymentsQuery,
  options?: BillingQueryOptions
) {
  const normalized = normalizePossibleDuplicatePaymentParams(params)

  return useQuery({
    queryKey: possibleDuplicatePaymentsKey(orgId, branchId, normalized),
    queryFn: () =>
      billingApi.possibleDuplicatePayments(orgId, branchId, normalized),
    staleTime: STALE.resource,
    retry: kuroRetry,
    enabled: Boolean(orgId && branchId && (options?.enabled ?? true)),
    placeholderData: keepPreviousData,
  })
}

export function useRecordGeneralIncome(orgId: string, branchId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: RecordGeneralIncomeRequest) =>
      billingApi.recordGeneralIncome(orgId, branchId, body),
    onSuccess: (payment) => {
      queryClient.invalidateQueries(branchPaymentsFilter(orgId, branchId))
      queryClient.invalidateQueries(
        possibleDuplicatePaymentsFilter(orgId, branchId)
      )
      queryClient.invalidateQueries({
        queryKey: ['billing-summary', orgId, payment.branchId],
      })
    },
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
