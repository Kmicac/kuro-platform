import { z } from 'zod'
import { PAYMENT_METHODS, PAYMENT_STATUSES } from '@/lib/api/billing.types'

const DECIMAL_MONEY_RE = /^\d+(?:\.\d{1,2})?$/
const CURRENCY_RE = /^[A-Z]{3}$/

export interface GeneralIncomeMessages {
  grossAmountInvalid: string
  netAmountInvalid: string
  currencyInvalid: string
}

export function makeGeneralIncomeSchema(messages: GeneralIncomeMessages) {
  return z.object({
    grossAmount: z
      .string()
      .trim()
      .regex(DECIMAL_MONEY_RE, messages.grossAmountInvalid),
    netAmount: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || DECIMAL_MONEY_RE.test(value),
        messages.netAmountInvalid,
      )
      .optional(),
    currency: z.string().trim().regex(CURRENCY_RE, messages.currencyInvalid),
    method: z.enum(PAYMENT_METHODS),
    status: z.enum(PAYMENT_STATUSES),
    description: z.string().trim().max(500).optional(),
    notes: z.string().trim().max(500).optional(),
  })
}

export type GeneralIncomeFormValues = z.infer<
  ReturnType<typeof makeGeneralIncomeSchema>
>

export const GENERAL_INCOME_DEFAULTS: GeneralIncomeFormValues = {
  grossAmount: '',
  netAmount: '',
  currency: 'ARS',
  method: 'CASH',
  status: 'APPROVED',
  description: '',
  notes: '',
}
