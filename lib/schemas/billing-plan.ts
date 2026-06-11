import { z } from 'zod'
import {
  BILLING_FREQUENCY_VALUES,
  type BillingFrequency,
} from '@/lib/api/billing.types'

const DECIMAL_MONEY_RE = /^\d+(?:\.\d{1,2})?$/
const CURRENCY_RE = /^[A-Z]{3}$/

export interface BillingPlanMessages {
  nameRequired: string
  amountInvalid: string
  currencyInvalid: string
  enrollmentFeeInvalid: string
}

export function makeBillingPlanSchema(messages: BillingPlanMessages) {
  return z.object({
    name: z.string().trim().min(3, messages.nameRequired).max(100),
    description: z.string().trim().max(500).optional(),
    billingFrequency: z.enum(BILLING_FREQUENCY_VALUES),
    amount: z.string().trim().regex(DECIMAL_MONEY_RE, messages.amountInvalid),
    currency: z
      .string()
      .trim()
      .regex(CURRENCY_RE, messages.currencyInvalid),
    enrollmentFeeAmount: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || DECIMAL_MONEY_RE.test(value),
        messages.enrollmentFeeInvalid,
      )
      .optional(),
    isActive: z.boolean(),
  })
}

export type BillingPlanFormValues = z.infer<
  ReturnType<typeof makeBillingPlanSchema>
>

export const BILLING_PLAN_DEFAULTS: BillingPlanFormValues = {
  name: '',
  description: '',
  billingFrequency: 'MONTHLY' satisfies BillingFrequency,
  amount: '',
  currency: 'ARS',
  enrollmentFeeAmount: '0',
  isActive: true,
}
