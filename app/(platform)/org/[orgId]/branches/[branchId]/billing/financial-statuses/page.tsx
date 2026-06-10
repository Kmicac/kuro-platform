import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import type { StudentFinancialStatus } from '@/lib/api/billing.types'
import { STUDENT_FINANCIAL_STATUSES } from '@/lib/api/billing.types'
import { FinancialStatusesPage } from './_components/financial-statuses-page'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('billing.sections.financialStatuses')
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

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function parseFinancialStatus(
  value: string | undefined
): StudentFinancialStatus | undefined {
  return STUDENT_FINANCIAL_STATUSES.includes(value as StudentFinancialStatus)
    ? (value as StudentFinancialStatus)
    : undefined
}

export default async function BillingFinancialStatusesPage({
  params,
  searchParams,
}: PageProps) {
  const { orgId, branchId } = await params
  const query = await searchParams
  return (
    <FinancialStatusesPage
      orgId={orgId}
      branchId={branchId}
      page={parsePositiveInt(firstParam(query.page), 1)}
      limit={parsePositiveInt(firstParam(query.limit), 20)}
      status={parseFinancialStatus(firstParam(query.financialStatus))}
    />
  )
}
