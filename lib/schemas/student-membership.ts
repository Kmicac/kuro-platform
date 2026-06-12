import { z } from 'zod'
import {
  DISCOUNT_TYPES,
  STUDENT_MEMBERSHIP_STATUSES,
  type DiscountType,
  type StudentMembershipStatus,
} from '@/lib/api/billing.types'

const DECIMAL_MONEY_RE = /^\d+(?:\.\d{1,2})?$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export const MEMBERSHIP_DISCOUNT_TYPE_VALUES = [
  'NONE',
  ...DISCOUNT_TYPES,
] as const

export interface StudentMembershipMessages {
  billingPlanRequired: string
  startedAtInvalid: string
  nextBillingDateInvalid: string
  freezeStartRequired: string
  freezeDateInvalid: string
  discountValueInvalid: string
  discountPercentageMax: string
}

const optionalDate = (message: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === '' || DATE_RE.test(value), message)

const optionalDecimal = (message: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === '' || DECIMAL_MONEY_RE.test(value), message)

export function makeStudentMembershipSchema(
  messages: StudentMembershipMessages
) {
  return z
    .object({
      billingPlanId: z.string().trim().min(1, messages.billingPlanRequired),
      startedAt: z.string().trim().regex(DATE_RE, messages.startedAtInvalid),
      nextBillingDate: optionalDate(messages.nextBillingDateInvalid),
      status: z.enum(STUDENT_MEMBERSHIP_STATUSES),
      freezeStartAt: optionalDate(messages.freezeDateInvalid),
      freezeEndAt: optionalDate(messages.freezeDateInvalid),
      discountType: z.enum(MEMBERSHIP_DISCOUNT_TYPE_VALUES),
      discountValue: optionalDecimal(messages.discountValueInvalid),
      notes: z.string().trim().max(500).optional(),
    })
    .superRefine((values, ctx) => {
      if (values.status === 'FROZEN' && !values.freezeStartAt.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['freezeStartAt'],
          message: messages.freezeStartRequired,
        })
      }

      if (values.discountType !== 'NONE' && !values.discountValue.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['discountValue'],
          message: messages.discountValueInvalid,
        })
      }

      if (
        values.discountType === 'PERCENTAGE' &&
        values.discountValue.trim() &&
        Number(values.discountValue) > 100
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['discountValue'],
          message: messages.discountPercentageMax,
        })
      }
    })
}

export type StudentMembershipFormValues = z.infer<
  ReturnType<typeof makeStudentMembershipSchema>
>

function todayDateInput() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function makeStudentMembershipDefaults(): StudentMembershipFormValues {
  return {
    billingPlanId: '',
    startedAt: todayDateInput(),
    nextBillingDate: '',
    status: 'ACTIVE' satisfies StudentMembershipStatus,
    freezeStartAt: '',
    freezeEndAt: '',
    discountType: 'NONE',
    discountValue: '',
    notes: '',
  }
}

export function normalizeDiscountType(
  value: StudentMembershipFormValues['discountType']
): DiscountType | undefined {
  return value === 'NONE' ? undefined : value
}
