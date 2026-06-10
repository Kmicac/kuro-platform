import type { DecimalJsonString } from '@/lib/api/billing.types'

export interface FormatDecimalMoneyOptions {
  currency?: string | null
  locale?: string
  unknownCurrencyLabel?: string
}

function formatCurrencyFallback(value: DecimalJsonString, currency: string) {
  return `${currency} ${value}`
}

export function formatDecimalMoney(
  value: DecimalJsonString,
  options: FormatDecimalMoneyOptions = {}
) {
  const currency = options.currency?.trim()
  const locale = options.locale ?? 'es-AR'

  if (!currency) {
    return options.unknownCurrencyLabel
      ? `${value} (${options.unknownCurrencyLabel})`
      : value
  }

  const amount = Number(value)
  if (!Number.isFinite(amount)) {
    return formatCurrencyFallback(value, currency)
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return formatCurrencyFallback(value, currency)
  }
}
