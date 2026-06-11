import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import {
  BILLING_CHARGE_STATUSES,
  BILLING_CHARGE_TYPES,
  type BillingChargeStatus,
  type BillingChargeType,
} from '@/lib/api/billing.types'
import { BillingChargesPage } from './_components/billing-charges-page'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('billing.sections.charges')
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

function numberParam(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function chargeStatusParam(
  value: string | undefined
): BillingChargeStatus | undefined {
  return BILLING_CHARGE_STATUSES.includes(value as BillingChargeStatus)
    ? (value as BillingChargeStatus)
    : undefined
}

function chargeTypeParam(
  value: string | undefined
): BillingChargeType | undefined {
  return BILLING_CHARGE_TYPES.includes(value as BillingChargeType)
    ? (value as BillingChargeType)
    : undefined
}

export default async function ChargesPage({ params, searchParams }: PageProps) {
  const { orgId, branchId } = await params
  const query = await searchParams

  return (
    <BillingChargesPage
      orgId={orgId}
      branchId={branchId}
      page={numberParam(firstParam(query.page), 1)}
      limit={Math.min(100, numberParam(firstParam(query.limit), 20))}
      status={chargeStatusParam(firstParam(query.status))}
      chargeType={chargeTypeParam(firstParam(query.chargeType))}
    />
  )
}
