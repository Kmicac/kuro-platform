import { z } from 'zod'
import type { PaymentMethod } from '@/lib/api/billing.types'

const DECIMAL_MONEY_RE = /^\d+(?:\.\d{1,2})?$/

export const MANUAL_PAYMENT_METHOD_VALUES = [
  'CASH',
  'BANK_TRANSFER',
  'DEBIT_CARD',
  'CREDIT_CARD',
  'OTHER',
] as const satisfies readonly PaymentMethod[]

export interface ManualPaymentMessages {
  grossAmountInvalid: string
  netAmountInvalid: string
}

export function makeManualPaymentSchema(messages: ManualPaymentMessages) {
  return z.object({
    grossAmount: z
      .string()
      .trim()
      .regex(DECIMAL_MONEY_RE, messages.grossAmountInvalid),
    netAmount: z
      .string()
      .trim()
      .regex(DECIMAL_MONEY_RE, messages.netAmountInvalid),
    method: z.enum(MANUAL_PAYMENT_METHOD_VALUES),
    description: z.string().trim().max(500).optional(),
    notes: z.string().trim().max(500).optional(),
  })
}

export type ManualPaymentFormValues = z.infer<
  ReturnType<typeof makeManualPaymentSchema>
>
