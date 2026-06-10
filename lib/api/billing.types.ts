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

export type StudentMembershipStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'FROZEN'
  | 'CANCELED'
  | 'ENDED'

export type BranchStudentMembershipStatus = 'ACTIVE' | 'PAUSED' | 'FROZEN'

export type DiscountType = 'PERCENTAGE' | 'FIXED'

export type BillingChargeType =
  | 'MEMBERSHIP'
  | 'ENROLLMENT'
  | 'ADJUSTMENT'
  | 'MANUAL'

export type BillingChargeStatus =
  | 'PENDING'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELED'
  | 'VOID'

export type PaymentKind = 'STUDENT_PAYMENT' | 'GENERAL_INCOME'

export type PaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'DEBIT_CARD'
  | 'CREDIT_CARD'
  | 'MERCADO_PAGO'
  | 'TAKENOS'
  | 'OTHER'

export type PaymentStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELED'
  | 'FAILED'
  | 'REFUNDED'
  | 'CHARGED_BACK'

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

export interface StudentMembershipResponse {
  id: string
  organizationId: string
  branchId: string
  studentId: string
  billingPlanId: string
  plan?: BillingPlanResponse | null
  status: StudentMembershipStatus
  startedAt: string
  nextBillingDate: string | null
  freezeStartAt?: string | null
  freezeEndAt?: string | null
  endedAt?: string | null
  discountType?: DiscountType | null
  discountValue?: DecimalJsonString | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface BillingChargeResponse {
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
  amountPaid?: DecimalJsonString
  outstandingAmount?: DecimalJsonString
  currency: string
  description: string
  externalProvider?: string | null
  externalReference?: string | null
  status: BillingChargeStatus
  payments?: PaymentResponse[]
  createdAt: string
  updatedAt: string
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
  currency: string
  method: PaymentMethod
  status: PaymentStatus
  externalProvider: string | null
  externalReference: string | null
  recordedAt: string
  notes: string | null
  createdAt: string
  updatedAt?: string
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
