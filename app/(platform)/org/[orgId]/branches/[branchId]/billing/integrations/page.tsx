import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { BillingIntegrationsPage } from './_components/billing-integrations-page'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('billing.sections.integrations')
  return {
    title: t('metaTitle'),
  }
}

interface PageProps {
  params: Promise<{ orgId: string; branchId: string }>
}

export default async function IntegrationsPage({ params }: PageProps) {
  const { orgId, branchId } = await params
  return <BillingIntegrationsPage orgId={orgId} branchId={branchId} />
}
