/**
 * Billing API types.
 *
 * These types mirror backend responses exactly. UI formatting belongs in
 * lib/billing adapters, not in the response contracts below.
 */

export type DecimalJsonString = string

export type BillingFrequency =
  | 'WEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'YEARLY'
  | 'ONE_TIME'

export const BILLING_FREQUENCY_VALUES = [
  'WEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
  'ONE_TIME',
] as const satisfies readonly BillingFrequency[]

export type BillingPlanMutationAmount = number | `${number}`

export type StudentMembershipStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'FROZEN'
  | 'CANCELED'
  | 'ENDED'

export const STUDENT_MEMBERSHIP_STATUSES = [
  'ACTIVE',
  'PAUSED',
  'FROZEN',
  'CANCELED',
  'ENDED',
] as const satisfies readonly StudentMembershipStatus[]

export type BranchStudentMembershipStatus = 'ACTIVE' | 'PAUSED' | 'FROZEN'

export type DiscountType = 'PERCENTAGE' | 'FIXED'

export const DISCOUNT_TYPES = [
  'PERCENTAGE',
  'FIXED',
] as const satisfies readonly DiscountType[]

export type BillingChargeType =
  | 'MEMBERSHIP'
  | 'ENROLLMENT'
  | 'ADJUSTMENT'
  | 'MANUAL'

export const BILLING_CHARGE_TYPES = [
  'MEMBERSHIP',
  'ENROLLMENT',
  'ADJUSTMENT',
  'MANUAL',
] as const satisfies readonly BillingChargeType[]

export type BillingChargeStatus =
  | 'PENDING'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELED'
  | 'VOID'

export const BILLING_CHARGE_STATUSES = [
  'PENDING',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'CANCELED',
  'VOID',
] as const satisfies readonly BillingChargeStatus[]

export type PaymentKind = 'STUDENT_PAYMENT' | 'GENERAL_INCOME'

export const PAYMENT_KINDS = [
  'STUDENT_PAYMENT',
  'GENERAL_INCOME',
] as const satisfies readonly PaymentKind[]

export type PaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'DEBIT_CARD'
  | 'CREDIT_CARD'
  | 'MERCADO_PAGO'
  | 'TAKENOS'
  | 'OTHER'

export const PAYMENT_METHODS = [
  'CASH',
  'BANK_TRANSFER',
  'DEBIT_CARD',
  'CREDIT_CARD',
  'MERCADO_PAGO',
  'TAKENOS',
  'OTHER',
] as const satisfies readonly PaymentMethod[]

export type PaymentStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELED'
  | 'FAILED'
  | 'REFUNDED'
  | 'CHARGED_BACK'

export const PAYMENT_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELED',
  'FAILED',
  'REFUNDED',
  'CHARGED_BACK',
] as const satisfies readonly PaymentStatus[]

export type PaymentProviderCode = 'MERCADO_PAGO'

export const PAYMENT_PROVIDER_CODES = [
  'MERCADO_PAGO',
] as const satisfies readonly PaymentProviderCode[]

export type PaymentIntegrationProvider =
  | PaymentProviderCode
  | 'TAKENOS'
  | 'SMOOTHCOMP'

export type PaymentIntegrationStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'ERROR'
  | 'DISCONNECTED'

export const PAYMENT_INTEGRATION_STATUSES = [
  'ACTIVE',
  'INACTIVE',
  'ERROR',
  'DISCONNECTED',
] as const satisfies readonly PaymentIntegrationStatus[]

export type PaymentIntegrationEnvironment = 'test' | 'production'

export type IntegrationScopeType = 'ORGANIZATION' | 'BRANCH'

export type IntegrationSyncKind =
  | 'TEST_CONNECTION'
  | 'IMPORT_STUDENT_COMPETITIONS'
  | 'SYNC_PAYMENT_STATUS'
  | 'IMPORT_EXTERNAL_TRANSACTIONS'

export type IntegrationSyncStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'PARTIALLY_SUCCEEDED'

export type IntegrationWebhookValidationStatus = 'VALID' | 'INVALID'

export type IntegrationWebhookProcessingStatus =
  | 'RECEIVED'
  | 'PROCESSING'
  | 'PROCESSED'
  | 'IGNORED'
  | 'FAILED'

export interface PaymentIntegrationResponse {
  id: string
  organizationId: string
  branchId: string | null
  provider: PaymentIntegrationProvider
  status: PaymentIntegrationStatus
  scopeType: IntegrationScopeType
  displayName: string
  lastSyncAt: string | null
  lastSyncStatus: IntegrationSyncStatus | null
  lastSyncError: string | null
  createdByMembershipId: string | null
  createdAt: string
  updatedAt: string
  capabilities: {
    providerImplemented: boolean
    supportsConnectionTest: boolean
    supportedSyncKinds: IntegrationSyncKind[]
    supportsWebhookIngestion: boolean
    supportsCheckoutPreference: boolean
  }
  configuration: {
    credentialsConfigured: boolean
    activationReady: boolean
    environment: PaymentIntegrationEnvironment | null
    applicationIdConfigured: boolean
    webhookSecretConfigured: boolean
    publicKeyConfigured: boolean
    checkoutBackUrlsConfigured: boolean
    notificationUrlConfigured: boolean
    configurationError: string | null
    activationError: string | null
    checkoutConfigurationError: string | null
  }
  webhook: {
    supported: boolean
    eventsTotal: number
    invalidEventsTotal: number
    failedEventsTotal: number
    pendingEventsTotal: number
    receivedLast7Days: number
    failedLast7Days: number
    lastReceivedAt: string | null
    lastProcessedAt: string | null
  }
  operational: {
    readinessStatus:
      | 'READY'
      | 'NEEDS_CONFIGURATION'
      | 'ATTENTION_REQUIRED'
      | 'PLACEHOLDER'
    attentionFlags: string[]
    eliminatesManualWork: boolean
    summary: string
  }
}

export interface PaymentIntegrationsQuery {
  page?: number
  limit?: number
  branchId?: string
  provider?: PaymentIntegrationProvider
  status?: PaymentIntegrationStatus
  scopeType?: IntegrationScopeType
}

export interface PaymentIntegrationsResponse {
  items: PaymentIntegrationResponse[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

export interface CreatePaymentIntegrationRequest {
  provider: PaymentIntegrationProvider
  scopeType: IntegrationScopeType
  branchId?: string
  displayName: string
  status?: PaymentIntegrationStatus
  configJson?: Record<string, unknown>
}

export interface UpdatePaymentIntegrationRequest {
  displayName?: string
  status?: PaymentIntegrationStatus
  configJson?: Record<string, unknown> | null
}

export interface SyncPaymentIntegrationRequest {
  syncKind: IntegrationSyncKind
}

export interface IntegrationSyncJobResponse {
  id: string
  organizationId: string
  branchId: string | null
  integrationConnectionId: string
  provider: PaymentIntegrationProvider
  syncKind: IntegrationSyncKind
  status: IntegrationSyncStatus
  startedAt: string
  finishedAt: string | null
  triggeredByMembershipId: string | null
  summaryJson: Record<string, unknown> | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

export type TestPaymentIntegrationResponse = IntegrationSyncJobResponse

export type SyncPaymentIntegrationResponse = IntegrationSyncJobResponse

export interface IntegrationWebhookEventResponse {
  id: string
  provider: PaymentIntegrationProvider
  notificationType: string | null
  action: string | null
  externalEventId: string | null
  externalResourceId: string | null
  requestId: string | null
  validationStatus: IntegrationWebhookValidationStatus
  processingStatus: IntegrationWebhookProcessingStatus
  errorSummary: string | null
  isRecoverable: boolean
  recoverabilityReason: string | null
  reprocessCount: number
  lastReprocessedAt: string | null
  receivedAt: string
  processedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface IntegrationWebhookEventDetailResponse
  extends IntegrationWebhookEventResponse {
  validationError: unknown | null
  processingError: unknown | null
  wasReprocessed: boolean
  payload: unknown | null
  query: unknown | null
  resource: unknown | null
}

export interface IntegrationWebhookEventsQuery {
  page?: number
  limit?: number
  validationStatus?: IntegrationWebhookValidationStatus
  processingStatus?: IntegrationWebhookProcessingStatus
  notificationType?: string
  dateFrom?: string
  dateTo?: string
  onlyRecoverable?: boolean
  externalResourceId?: string
}

export interface IntegrationWebhookEventsResponse {
  items: IntegrationWebhookEventResponse[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

export type ReprocessWebhookEventResponse =
  | IntegrationWebhookEventDetailResponse
  | IntegrationWebhookEventResponse

export type BillingChargeMutationAmount = number | `${number}`
export type PaymentMutationAmount = number | `${number}`

export type StudentFinancialStatus =
  | 'CURRENT'
  | 'DUE_SOON'
  | 'OVERDUE'
  | 'RESTRICTED'
  | 'FROZEN'

export const STUDENT_FINANCIAL_STATUSES = [
  'CURRENT',
  'DUE_SOON',
  'OVERDUE',
  'RESTRICTED',
  'FROZEN',
] as const satisfies readonly StudentFinancialStatus[]

export interface BranchBillingSummaryQuery {
  dateFrom?: string
  dateTo?: string
  currency?: string
}

export interface BranchBillingSummaryResponse {
  grossTotal: DecimalJsonString
  netTotal: DecimalJsonString
  approvedPaymentsCount: number
  pendingPaymentsCount: number
  pendingChargesCount: number
  overdueChargesCount: number
  paidChargesCount: number
  possibleDuplicatesCount: number
  period: {
    dateFrom: string
    dateTo: string
  }
  currency?: string
  operationalSnapshot: {
    asOf: string
    studentFinancialStatusCounts: Record<StudentFinancialStatus, number>
    overdueStudentsCount: number
    dueSoonStudentsCount: number
    restrictedStudentsCount: number
  }
}

export interface BranchStudentFinancialStatusesQuery {
  page?: number
  limit?: number
  financialStatus?: StudentFinancialStatus
}

export interface BranchStudentFinancialStatusItem {
  student: {
    id: string
    firstName: string
    lastName: string
  }
  membership: {
    id: string
    status: BranchStudentMembershipStatus
  } | null
  financialStatus: StudentFinancialStatus
  daysOverdue: number
  nextDueDate: string | null
  hasOverdueCharges: boolean
  hasPendingCharges: boolean
  activeRestrictionFlags: {
    attendanceRestricted: boolean
    appUsageRestricted: boolean
  }
  totalDue: DecimalJsonString
}

export interface BranchStudentFinancialStatusesResponse {
  items: BranchStudentFinancialStatusItem[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

export interface BillingPlanResponse {
  id: string
  organizationId: string
  branchId: string
  name: string
  description: string | null
  billingFrequency: BillingFrequency
  amount: DecimalJsonString
  currency: string
  enrollmentFeeAmount: DecimalJsonString | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateBillingPlanRequest {
  name: string
  description?: string
  billingFrequency: BillingFrequency
  amount: BillingPlanMutationAmount
  currency: string
  enrollmentFeeAmount?: BillingPlanMutationAmount
  isActive?: boolean
}

export type UpdateBillingPlanRequest = Partial<CreateBillingPlanRequest>

export interface StudentMembershipResponse {
  id: string
  organizationId: string
  branchId: string
  studentId: string
  billingPlanId: string
  billingPlan: BillingPlanResponse
  status: StudentMembershipStatus
  startedAt: string
  endedAt: string | null
  nextBillingDate: string | null
  freezeStartAt: string | null
  freezeEndAt: string | null
  discountType: DiscountType | null
  discountValue: DecimalJsonString | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type StudentMembershipMutationAmount = number | `${number}`

export interface CreateStudentMembershipRequest {
  billingPlanId: string
  startedAt: string
  nextBillingDate?: string
  freezeStartAt?: string
  freezeEndAt?: string
  status?: StudentMembershipStatus
  discountType?: DiscountType
  discountValue?: StudentMembershipMutationAmount
  notes?: string
}

export interface UpdateStudentMembershipRequest {
  billingPlanId?: string
  startedAt?: string
  nextBillingDate?: string
  freezeStartAt?: string
  freezeEndAt?: string
  status?: StudentMembershipStatus
  discountType?: DiscountType
  discountValue?: StudentMembershipMutationAmount
  notes?: string
  endedAt?: string
  clearFreezeSchedule?: boolean
  clearDiscount?: boolean
}

export interface BillingChargeListQuery {
  page?: number
  limit?: number
  studentId?: string
  billingPlanId?: string
  chargeType?: BillingChargeType
  status?: BillingChargeStatus
  currency?: string
  dateFrom?: string
  dateTo?: string
}

export type StudentBillingChargesQuery = Omit<
  BillingChargeListQuery,
  'studentId'
>

export interface BillingChargeStudentSummary {
  id: string
  firstName: string
  lastName: string
}

export interface BillingChargeStudentMembershipSummary {
  id: string
  status: string
  nextBillingDate: string | null
}

export interface BillingChargePlanSummary {
  id: string
  name: string
  billingFrequency: BillingFrequency
  amount: DecimalJsonString
  currency: string
}

export interface BillingChargeListItem {
  id: string
  organizationId: string
  branchId: string
  studentId: string
  studentMembershipId: string | null
  billingPlanId: string | null
  chargeType: BillingChargeType
  periodStart: string | null
  periodEnd: string | null
  dueDate: string
  amount: DecimalJsonString
  amountPaid: DecimalJsonString
  outstandingAmount: DecimalJsonString
  currency: string
  status: BillingChargeStatus
  effectiveStatus: BillingChargeStatus
  description: string | null
  externalProvider: string | null
  externalReference: string | null
  student: BillingChargeStudentSummary
  studentMembership: BillingChargeStudentMembershipSummary | null
  billingPlan: BillingChargePlanSummary | null
  createdAt: string
  updatedAt: string
}

export interface BillingChargesResponse {
  items: BillingChargeListItem[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

export interface CreateBillingChargeRequest {
  studentMembershipId?: string | null
  billingPlanId?: string | null
  chargeType: BillingChargeType
  periodStart?: string | null
  periodEnd?: string | null
  dueDate: string
  amount: BillingChargeMutationAmount
  currency: string
  description?: string
  externalProvider?: string
  externalReference?: string
}

export type CreatedBillingChargeResponse = Omit<
  BillingChargeListItem,
  'effectiveStatus' | 'outstandingAmount'
>

export interface PaymentChargeSummary {
  id: string
  chargeType: BillingChargeType
  dueDate: string
  amount: DecimalJsonString
  currency: string
  status: string
}

export interface PaymentListQuery {
  page?: number
  limit?: number
  studentId?: string
  method?: PaymentMethod
  status?: PaymentStatus
  paymentKind?: PaymentKind
  currency?: string
  dateFrom?: string
  dateTo?: string
}

export type StudentPaymentsQuery = Omit<
  PaymentListQuery,
  'studentId' | 'paymentKind'
>

export interface PossibleDuplicatePaymentsQuery {
  dateFrom?: string
  dateTo?: string
  method?: PaymentMethod
  status?: PaymentStatus
  paymentKind?: PaymentKind
  currency?: string
  studentId?: string
  windowDays?: number
  limit?: number
}

export interface PaymentResponse {
  id: string
  organizationId: string
  branchId: string
  studentId: string | null
  billingChargeId: string | null
  paymentKind: PaymentKind
  grossAmount: DecimalJsonString
  netAmount: DecimalJsonString
  reversedAmount: DecimalJsonString
  currency: string
  method: PaymentMethod
  status: PaymentStatus
  description: string | null
  externalProvider: string | null
  externalReference: string | null
  lastExternalStatus: string | null
  lastExternalStatusDetail: string | null
  lastExternalObservedAt: string | null
  recordedByMembershipId: string | null
  recordedAt: string
  notes: string | null
  createdAt: string
  updatedAt: string
  student: BillingChargeStudentSummary | null
  billingCharge: PaymentChargeSummary | null
}

export interface PaymentsResponse {
  items: PaymentResponse[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

export interface RecordManualStudentPaymentRequest {
  billingChargeId?: string | null
  grossAmount: PaymentMutationAmount
  netAmount: PaymentMutationAmount
  currency: string
  method: PaymentMethod
  status?: PaymentStatus
  description?: string
  externalProvider?: string
  externalReference?: string
  recordedAt?: string
  notes?: string
}

export type ManualStudentPaymentResponse = PaymentResponse & {
  paymentKind: 'STUDENT_PAYMENT'
  student: BillingChargeStudentSummary
}

export interface RecordGeneralIncomeRequest {
  grossAmount: PaymentMutationAmount
  netAmount?: PaymentMutationAmount
  currency: string
  method: PaymentMethod
  status?: PaymentStatus
  description?: string
  externalProvider?: string
  externalReference?: string
  recordedAt?: string
  notes?: string
}

export type GeneralIncomeResponse = PaymentResponse & {
  paymentKind: 'GENERAL_INCOME'
  studentId: null
  billingChargeId: null
  student: null
  billingCharge: null
}

export type PossibleDuplicateReason =
  | 'same_external_reference'
  | 'same_student_amount_method_window'

export interface PossibleDuplicatePaymentItem {
  id: string
  paymentKind: PaymentKind
  studentId: string | null
  grossAmount: DecimalJsonString
  currency: string
  method: PaymentMethod
  status: PaymentStatus
  externalProvider: string | null
  externalReference: string | null
  recordedAt: string
  description: string | null
  student: BillingChargeStudentSummary | null
}

export interface PossibleDuplicatePaymentsGroup {
  reason: PossibleDuplicateReason
  payments: PossibleDuplicatePaymentItem[]
}

export interface PossibleDuplicatePaymentsResponse {
  items: PossibleDuplicatePaymentsGroup[]
  meta: {
    inspectedPayments: number
    totalGroups: number
    windowDays: number
    period: {
      dateFrom: string
      dateTo: string
    }
  }
}

export interface MercadoPagoPreferenceResponse {
  chargeId: string
  provider: 'MERCADO_PAGO'
  publicKey: string
  preferenceId: string
  externalReference: string
  initPoint: string
  sandboxInitPoint?: string
  amount: number
  currency: string
  status: 'READY'
  environment: string
  reused: boolean
}

export interface BillingPolicyResponse {
  graceDays: number
  restrictAttendanceWhenOverdue: boolean
  restrictAppUsageWhenOverdue: boolean
  allowFreeze: boolean
  maxFreezeDaysPerYear: number | null
  allowManualDiscounts: boolean
  allowPartialPayments: boolean
}
