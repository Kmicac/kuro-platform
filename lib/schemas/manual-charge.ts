import { z } from 'zod'

const DECIMAL_MONEY_RE = /^\d+(?:\.\d{1,2})?$/
const CURRENCY_RE = /^[A-Z]{3}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export interface ManualChargeMessages {
  studentRequired: string
  dueDateInvalid: string
  amountInvalid: string
  currencyInvalid: string
  periodDateInvalid: string
}

const optionalDate = (message: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === '' || DATE_RE.test(value), message)
    .optional()

export function makeManualChargeSchema(messages: ManualChargeMessages) {
  return z.object({
    studentId: z.string().trim().min(1, messages.studentRequired),
    dueDate: z.string().trim().regex(DATE_RE, messages.dueDateInvalid),
    amount: z.string().trim().regex(DECIMAL_MONEY_RE, messages.amountInvalid),
    currency: z.string().trim().regex(CURRENCY_RE, messages.currencyInvalid),
    periodStart: optionalDate(messages.periodDateInvalid),
    periodEnd: optionalDate(messages.periodDateInvalid),
    description: z.string().trim().max(500).optional(),
  })
}

export type ManualChargeFormValues = z.infer<
  ReturnType<typeof makeManualChargeSchema>
>

function todayDateInput() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function makeManualChargeDefaults(): ManualChargeFormValues {
  return {
    studentId: '',
    dueDate: todayDateInput(),
    amount: '',
    currency: 'ARS',
    periodStart: '',
    periodEnd: '',
    description: '',
  }
}
