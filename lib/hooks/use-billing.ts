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
  CreatePaymentIntegrationRequest,
  CreateStudentMembershipRequest,
  IntegrationWebhookEventsQuery,
  PaymentListQuery,
  PaymentIntegrationsQuery,
  PossibleDuplicatePaymentsQuery,
  RecordGeneralIncomeRequest,
  RecordManualStudentPaymentRequest,
  SyncPaymentIntegrationRequest,
  StudentMembershipResponse,
  StudentBillingChargesQuery,
  StudentPaymentsQuery,
  CreateBillingPlanRequest,
  UpdatePaymentIntegrationRequest,
  UpdateStudentMembershipRequest,
  UpdateBillingPlanRequest,
} from '@/lib/api/billing.types'
import { STALE, kuroRetry } from './_shared'

interface BillingQueryOptions {
  enabled?: boolean
}

function billingPlansKey(orgId: string, branchId: string) {
  return ['billing-plans', orgId, branchId] as const
}

function studentMembershipKey(orgId: string, studentId: string) {
  return ['billing-student-membership', orgId, studentId] as const
}

function studentMembershipFilter(orgId: string, studentId: string) {
  return {
    queryKey: ['billing-student-membership', orgId, studentId] as const,
  }
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

function integrationsKey(
  orgId: string,
  params: Required<Pick<PaymentIntegrationsQuery, 'page' | 'limit'>> &
    Omit<PaymentIntegrationsQuery, 'page' | 'limit'>
) {
  return ['payment-integrations', orgId, params] as const
}

function integrationsFilter(orgId: string) {
  return { queryKey: ['payment-integrations', orgId] as const }
}

function integrationWebhookEventsKey(
  orgId: string,
  integrationId: string,
  params: Required<Pick<IntegrationWebhookEventsQuery, 'page' | 'limit'>> &
    Omit<IntegrationWebhookEventsQuery, 'page' | 'limit'>
) {
  return ['integration-webhook-events', orgId, integrationId, params] as const
}

function integrationWebhookEventsFilter(orgId: string, integrationId: string) {
  return {
    queryKey: ['integration-webhook-events', orgId, integrationId] as const,
  }
}

function invalidateMembershipRelatedQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  orgId: string,
  studentId: string,
  branchId: string
) {
  queryClient.invalidateQueries(studentMembershipFilter(orgId, studentId))
  queryClient.invalidateQueries(studentChargesFilter(orgId, studentId))
  queryClient.invalidateQueries(branchChargesFilter(orgId, branchId))
  queryClient.invalidateQueries({
    queryKey: ['billing-financial-statuses', orgId, branchId],
  })
  queryClient.invalidateQueries({
    queryKey: ['billing-summary', orgId, branchId],
  })
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

function normalizeIntegrationsParams(params?: PaymentIntegrationsQuery) {
  return {
    page: params?.page ?? 1,
    limit: params?.limit ?? 20,
    branchId: params?.branchId || undefined,
    provider: params?.provider,
    status: params?.status,
    scopeType: params?.scopeType,
  }
}

function normalizeIntegrationWebhookEventsParams(
  params?: IntegrationWebhookEventsQuery
) {
  return {
    page: params?.page ?? 1,
    limit: params?.limit ?? 20,
    validationStatus: params?.validationStatus,
    processingStatus: params?.processingStatus,
    notificationType: params?.notificationType || undefined,
    dateFrom: params?.dateFrom || undefined,
    dateTo: params?.dateTo || undefined,
    onlyRecoverable: params?.onlyRecoverable,
    externalResourceId: params?.externalResourceId || undefined,
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

export function useStudentMembership(
  orgId: string,
  studentId: string,
  options?: BillingQueryOptions
) {
  return useQuery({
    queryKey: studentMembershipKey(orgId, studentId),
    queryFn: () => billingApi.studentMembership(orgId, studentId),
    staleTime: STALE.resource,
    retry: kuroRetry,
    enabled: Boolean(orgId && studentId && (options?.enabled ?? true)),
  })
}

export function useCreateStudentMembership(
  orgId: string,
  studentId: string
) {
  const queryClient = useQueryClient()
  const queryKey = studentMembershipKey(orgId, studentId)

  return useMutation({
    mutationFn: (body: CreateStudentMembershipRequest) =>
      billingApi.createStudentMembership(orgId, studentId, body),
    onSuccess: (membership) => {
      queryClient.setQueryData<StudentMembershipResponse | null>(
        queryKey,
        membership
      )
      invalidateMembershipRelatedQueries(
        queryClient,
        orgId,
        studentId,
        membership.branchId
      )
    },
  })
}

export function useUpdateStudentMembership(
  orgId: string,
  studentId: string
) {
  const queryClient = useQueryClient()
  const queryKey = studentMembershipKey(orgId, studentId)

  return useMutation({
    mutationFn: (body: UpdateStudentMembershipRequest) =>
      billingApi.updateStudentMembership(orgId, studentId, body),
    onSuccess: (membership) => {
      queryClient.setQueryData<StudentMembershipResponse | null>(
        queryKey,
        membership
      )
      invalidateMembershipRelatedQueries(
        queryClient,
        orgId,
        studentId,
        membership.branchId
      )
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

export function useInvalidateBillingPaymentState(
  orgId: string,
  branchId: string,
  studentId: string
) {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries(branchChargesFilter(orgId, branchId))
    queryClient.invalidateQueries(studentChargesFilter(orgId, studentId))
    queryClient.invalidateQueries(branchPaymentsFilter(orgId, branchId))
    queryClient.invalidateQueries(studentPaymentsFilter(orgId, studentId))
    queryClient.invalidateQueries({
      queryKey: ['billing-summary', orgId, branchId],
    })
  }
}

export function useCreateMercadoPagoPreference(
  orgId: string,
  branchId: string,
  studentId: string,
  chargeId: string
) {
  const invalidateBillingPaymentState = useInvalidateBillingPaymentState(
    orgId,
    branchId,
    studentId
  )

  return useMutation({
    mutationFn: () =>
      billingApi.createMercadoPagoPreference(orgId, studentId, chargeId),
    onSuccess: () => {
      invalidateBillingPaymentState()
    },
  })
}

export function useOrganizationIntegrations(
  orgId: string,
  params?: PaymentIntegrationsQuery,
  options?: BillingQueryOptions
) {
  const normalized = normalizeIntegrationsParams(params)

  return useQuery({
    queryKey: integrationsKey(orgId, normalized),
    queryFn: () => billingApi.integrations(orgId, normalized),
    staleTime: STALE.resource,
    retry: kuroRetry,
    enabled: Boolean(orgId && (options?.enabled ?? true)),
    placeholderData: keepPreviousData,
  })
}

export function useBranchIntegrations(
  orgId: string,
  branchId: string,
  params?: Omit<PaymentIntegrationsQuery, 'branchId'>,
  options?: BillingQueryOptions
) {
  return useOrganizationIntegrations(
    orgId,
    { ...params, branchId },
    { enabled: Boolean(branchId && (options?.enabled ?? true)) }
  )
}

export function useCreateIntegration(orgId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CreatePaymentIntegrationRequest) =>
      billingApi.createIntegration(orgId, body),
    onSuccess: () => {
      queryClient.invalidateQueries(integrationsFilter(orgId))
    },
  })
}

export function useUpdateIntegration(orgId: string, integrationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: UpdatePaymentIntegrationRequest) =>
      billingApi.updateIntegration(orgId, integrationId, body),
    onSuccess: () => {
      queryClient.invalidateQueries(integrationsFilter(orgId))
    },
  })
}

export function useTestIntegration(orgId: string, integrationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => billingApi.testIntegration(orgId, integrationId),
    onSuccess: () => {
      queryClient.invalidateQueries(integrationsFilter(orgId))
    },
  })
}

export function useSyncIntegration(orgId: string, integrationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: SyncPaymentIntegrationRequest) =>
      billingApi.syncIntegration(orgId, integrationId, body),
    onSuccess: () => {
      queryClient.invalidateQueries(integrationsFilter(orgId))
    },
  })
}

export function useIntegrationWebhookEvents(
  orgId: string,
  integrationId: string,
  params?: IntegrationWebhookEventsQuery,
  options?: BillingQueryOptions
) {
  const normalized = normalizeIntegrationWebhookEventsParams(params)

  return useQuery({
    queryKey: integrationWebhookEventsKey(orgId, integrationId, normalized),
    queryFn: () =>
      billingApi.integrationWebhookEvents(orgId, integrationId, normalized),
    staleTime: STALE.resource,
    retry: kuroRetry,
    enabled: Boolean(orgId && integrationId && (options?.enabled ?? true)),
    placeholderData: keepPreviousData,
  })
}

export function useIntegrationWebhookEvent(
  orgId: string,
  integrationId: string,
  eventId: string,
  options?: BillingQueryOptions
) {
  return useQuery({
    queryKey: ['integration-webhook-event', orgId, integrationId, eventId],
    queryFn: () =>
      billingApi.integrationWebhookEvent(orgId, integrationId, eventId),
    staleTime: STALE.resource,
    retry: kuroRetry,
    enabled: Boolean(
      orgId && integrationId && eventId && (options?.enabled ?? true)
    ),
  })
}

export function useReprocessWebhookEvent(
  orgId: string,
  integrationId: string,
  eventId: string
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      billingApi.reprocessWebhookEvent(orgId, integrationId, eventId),
    onSuccess: () => {
      queryClient.invalidateQueries(
        integrationWebhookEventsFilter(orgId, integrationId)
      )
      queryClient.invalidateQueries({
        queryKey: ['integration-webhook-event', orgId, integrationId, eventId],
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
