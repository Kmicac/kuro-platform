import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { BillingPlaceholderPage } from '../_components/billing-placeholder-page'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('billing.sections.payments')
  return {
    title: t('metaTitle'),
  }
}

export default function BillingPaymentsPage() {
  return <BillingPlaceholderPage section="payments" />
}
