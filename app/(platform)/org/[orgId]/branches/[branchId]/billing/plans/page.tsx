import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { BillingPlansPage } from './_components/billing-plans-page'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('billing.sections.plans')
  return {
    title: t('metaTitle'),
  }
}

interface PageProps {
  params: Promise<{ orgId: string; branchId: string }>
}

export default async function PlansPage({ params }: PageProps) {
  const { orgId, branchId } = await params
  return <BillingPlansPage orgId={orgId} branchId={branchId} />
}
