import type { PaymentProviderCode } from '@/lib/api/billing.types'

export type { PaymentProviderCode }

export type PaymentProviderEnvironmentMode = 'test' | 'production'

export interface PaymentProviderDescriptor {
  code: PaymentProviderCode
  labelKey: string
  descriptionKey: string
  supportsCheckout: boolean
  supportsWebhooks: boolean
  supportsExternalLinks: boolean
  environmentModes: PaymentProviderEnvironmentMode[]
}

export const paymentProviders = {
  MERCADO_PAGO: {
    code: 'MERCADO_PAGO',
    labelKey: 'billing.providers.mercadoPago.name',
    descriptionKey: 'billing.providers.mercadoPago.description',
    supportsCheckout: true,
    supportsWebhooks: true,
    supportsExternalLinks: false,
    environmentModes: ['test', 'production'],
  },
} satisfies Record<PaymentProviderCode, PaymentProviderDescriptor>

export function getPaymentProviderDescriptor(code: PaymentProviderCode) {
  return paymentProviders[code]
}
