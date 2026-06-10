import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { BillingDashboard } from './_components/billing-dashboard'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('billing.dashboard')
  return {
    title: t('metaTitle'),
  }
}

interface PageProps {
  params: Promise<{ orgId: string; branchId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function BillingDashboardPage({
  params,
  searchParams,
}: PageProps) {
  const { orgId, branchId } = await params
  const query = await searchParams

  return (
    <BillingDashboard
      orgId={orgId}
      branchId={branchId}
      filters={{
        dateFrom: firstParam(query.dateFrom),
        dateTo: firstParam(query.dateTo),
        currency: firstParam(query.currency),
      }}
    />
  )
}
