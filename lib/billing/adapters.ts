import type {
  BillingChargeListItem,
  BillingPlanResponse,
  BranchBillingSummaryResponse,
  BranchStudentFinancialStatusItem,
  BranchStudentFinancialStatusesResponse,
  DecimalJsonString,
  PaymentResponse,
  PossibleDuplicatePaymentsGroup,
  PossibleDuplicatePaymentsResponse,
  StudentFinancialStatus,
} from '@/lib/api/billing.types'
import { STUDENT_FINANCIAL_STATUSES } from '@/lib/api/billing.types'
import { formatDecimalMoney } from './format-money'

interface CurrencyResolutionOptions {
  queryCurrency?: string | null
  branchCurrency?: string | null
  policyCurrency?: string | null
}

interface MoneyAdapterOptions extends CurrencyResolutionOptions {
  locale?: string
  unknownCurrencyLabel: string
}

export interface BranchBillingSummaryVM
  extends BranchBillingSummaryResponse {
  displayCurrency: string | null
  grossTotalFormatted: string
  netTotalFormatted: string
  currencyLabel: string
  financialStatusCounts: Record<StudentFinancialStatus, number>
}

export interface BranchStudentFinancialStatusVM
  extends BranchStudentFinancialStatusItem {
  studentName: string
  totalDueFormatted: string
  nextDueDateFormatted: string | null
  restrictionCount: number
}

export interface FinancialStatusListVM {
  items: BranchStudentFinancialStatusVM[]
  meta: BranchStudentFinancialStatusesResponse['meta']
}

export interface BillingPlanVM extends BillingPlanResponse {
  amountFormatted: string
  enrollmentFeeAmountFormatted: string | null
}

export interface BillingChargeListItemVM extends BillingChargeListItem {
  studentName: string
  planName: string | null
  amountFormatted: string
  amountPaidFormatted: string
  outstandingAmountFormatted: string
  dueDateFormatted: string
  periodStartFormatted: string | null
  periodEndFormatted: string | null
}

export interface BillingChargesListVM {
  items: BillingChargeListItemVM[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

export interface PaymentVM extends PaymentResponse {
  studentName: string | null
  grossAmountFormatted: string
  netAmountFormatted: string
  reversedAmountFormatted: string
  recordedAtFormatted: string
}

export interface PaymentsListVM {
  items: PaymentVM[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

export interface PossibleDuplicatePaymentsGroupVM
  extends PossibleDuplicatePaymentsGroup {
  payments: Array<
    PossibleDuplicatePaymentsGroup['payments'][number] & {
      studentName: string | null
      grossAmountFormatted: string
      recordedAtFormatted: string
    }
  >
}

export interface PossibleDuplicatePaymentsVM
  extends PossibleDuplicatePaymentsResponse {
  items: PossibleDuplicatePaymentsGroupVM[]
}

function normalizeCurrency(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed.toUpperCase() : null
}

export function resolveBillingCurrency(
  responseCurrency: string | undefined,
  options: CurrencyResolutionOptions = {}
) {
  return (
    normalizeCurrency(responseCurrency) ??
    normalizeCurrency(options.queryCurrency) ??
    normalizeCurrency(options.branchCurrency) ??
    normalizeCurrency(options.policyCurrency)
  )
}

export function formatBillingDecimal(
  value: DecimalJsonString,
  displayCurrency: string | null,
  options: Pick<MoneyAdapterOptions, 'locale' | 'unknownCurrencyLabel'>
) {
  return formatDecimalMoney(value, {
    currency: displayCurrency,
    locale: options.locale,
    unknownCurrencyLabel: options.unknownCurrencyLabel,
  })
}

export function normalizeFinancialStatusCounts(
  counts: Partial<Record<StudentFinancialStatus, number>>
) {
  return STUDENT_FINANCIAL_STATUSES.reduce(
    (acc, status) => {
      acc[status] = counts[status] ?? 0
      return acc
    },
    {} as Record<StudentFinancialStatus, number>
  )
}

export function toBillingPlanVM(
  plan: BillingPlanResponse,
  options: Pick<MoneyAdapterOptions, 'locale' | 'unknownCurrencyLabel'>
): BillingPlanVM {
  const displayCurrency = normalizeCurrency(plan.currency)

  return {
    ...plan,
    amountFormatted: formatBillingDecimal(
      plan.amount,
      displayCurrency,
      options
    ),
    enrollmentFeeAmountFormatted: plan.enrollmentFeeAmount
      ? formatBillingDecimal(plan.enrollmentFeeAmount, displayCurrency, options)
      : null,
  }
}

export function toBillingPlansVM(
  plans: BillingPlanResponse[],
  options: Pick<MoneyAdapterOptions, 'locale' | 'unknownCurrencyLabel'>
) {
  return plans.map((plan) => toBillingPlanVM(plan, options))
}

export function toBillingChargeListItemVM(
  charge: BillingChargeListItem,
  options: Pick<MoneyAdapterOptions, 'locale' | 'unknownCurrencyLabel'> & {
    formatDateTime: (value: string) => string
  }
): BillingChargeListItemVM {
  const displayCurrency = normalizeCurrency(charge.currency)

  return {
    ...charge,
    studentName: [charge.student.firstName, charge.student.lastName]
      .filter(Boolean)
      .join(' '),
    planName: charge.billingPlan?.name ?? null,
    amountFormatted: formatBillingDecimal(
      charge.amount,
      displayCurrency,
      options
    ),
    amountPaidFormatted: formatBillingDecimal(
      charge.amountPaid,
      displayCurrency,
      options
    ),
    outstandingAmountFormatted: formatBillingDecimal(
      charge.outstandingAmount,
      displayCurrency,
      options
    ),
    dueDateFormatted: options.formatDateTime(charge.dueDate),
    periodStartFormatted: charge.periodStart
      ? options.formatDateTime(charge.periodStart)
      : null,
    periodEndFormatted: charge.periodEnd
      ? options.formatDateTime(charge.periodEnd)
      : null,
  }
}

export function toBillingChargesListVM(
  response: {
    items: BillingChargeListItem[]
    meta: BillingChargesListVM['meta']
  },
  options: Pick<MoneyAdapterOptions, 'locale' | 'unknownCurrencyLabel'> & {
    formatDateTime: (value: string) => string
  }
): BillingChargesListVM {
  return {
    items: response.items.map((charge) =>
      toBillingChargeListItemVM(charge, options)
    ),
    meta: response.meta,
  }
}

export function toPaymentVM(
  payment: PaymentResponse,
  options: Pick<MoneyAdapterOptions, 'locale' | 'unknownCurrencyLabel'> & {
    formatDateTime: (value: string) => string
  }
): PaymentVM {
  const displayCurrency = normalizeCurrency(payment.currency)

  return {
    ...payment,
    studentName: payment.student
      ? [payment.student.firstName, payment.student.lastName]
          .filter(Boolean)
          .join(' ')
      : null,
    grossAmountFormatted: formatBillingDecimal(
      payment.grossAmount,
      displayCurrency,
      options
    ),
    netAmountFormatted: formatBillingDecimal(
      payment.netAmount,
      displayCurrency,
      options
    ),
    reversedAmountFormatted: formatBillingDecimal(
      payment.reversedAmount,
      displayCurrency,
      options
    ),
    recordedAtFormatted: options.formatDateTime(payment.recordedAt),
  }
}

export function toPaymentsListVM(
  response: {
    items: PaymentResponse[]
    meta: PaymentsListVM['meta']
  },
  options: Pick<MoneyAdapterOptions, 'locale' | 'unknownCurrencyLabel'> & {
    formatDateTime: (value: string) => string
  }
): PaymentsListVM {
  return {
    items: response.items.map((payment) => toPaymentVM(payment, options)),
    meta: response.meta,
  }
}

export function toPossibleDuplicatePaymentsVM(
  response: PossibleDuplicatePaymentsResponse,
  options: Pick<MoneyAdapterOptions, 'locale' | 'unknownCurrencyLabel'> & {
    formatDateTime: (value: string) => string
  }
): PossibleDuplicatePaymentsVM {
  return {
    ...response,
    items: response.items.map((group) => ({
      ...group,
      payments: group.payments.map((payment) => ({
        ...payment,
        studentName: payment.student
          ? [payment.student.firstName, payment.student.lastName]
              .filter(Boolean)
              .join(' ')
          : null,
        grossAmountFormatted: formatBillingDecimal(
          payment.grossAmount,
          normalizeCurrency(payment.currency),
          options
        ),
        recordedAtFormatted: options.formatDateTime(payment.recordedAt),
      })),
    })),
  }
}

export function toBranchBillingSummaryVM(
  response: BranchBillingSummaryResponse,
  options: MoneyAdapterOptions
): BranchBillingSummaryVM {
  const displayCurrency = resolveBillingCurrency(response.currency, options)
  const currencyLabel = displayCurrency ?? options.unknownCurrencyLabel

  return {
    ...response,
    displayCurrency,
    currencyLabel,
    financialStatusCounts: normalizeFinancialStatusCounts(
      response.operationalSnapshot.studentFinancialStatusCounts
    ),
    grossTotalFormatted: formatBillingDecimal(
      response.grossTotal,
      displayCurrency,
      options
    ),
    netTotalFormatted: formatBillingDecimal(
      response.netTotal,
      displayCurrency,
      options
    ),
  }
}

export function toBranchStudentFinancialStatusVM(
  item: BranchStudentFinancialStatusItem,
  options: {
    displayCurrency: string | null
    locale?: string
    unknownCurrencyLabel: string
    formatDateTime: (value: string) => string
  }
): BranchStudentFinancialStatusVM {
  return {
    ...item,
    studentName: [item.student.firstName, item.student.lastName]
      .filter(Boolean)
      .join(' '),
    totalDueFormatted: formatBillingDecimal(
      item.totalDue,
      options.displayCurrency,
      options
    ),
    nextDueDateFormatted: item.nextDueDate
      ? options.formatDateTime(item.nextDueDate)
      : null,
    restrictionCount: Number(
      item.activeRestrictionFlags.attendanceRestricted
    ) + Number(item.activeRestrictionFlags.appUsageRestricted),
  }
}

export function toBranchStudentFinancialStatusesVM(
  response: BranchStudentFinancialStatusesResponse,
  options: {
    displayCurrency: string | null
    locale?: string
    unknownCurrencyLabel: string
    formatDateTime: (value: string) => string
  }
): FinancialStatusListVM {
  return {
    items: response.items.map((item) =>
      toBranchStudentFinancialStatusVM(item, options)
    ),
    meta: response.meta,
  }
}
