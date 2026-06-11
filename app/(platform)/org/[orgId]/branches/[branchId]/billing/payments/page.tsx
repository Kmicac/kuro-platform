import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import {
  PAYMENT_KINDS,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  type PaymentKind,
  type PaymentMethod,
  type PaymentStatus,
} from '@/lib/api/billing.types'
import { BillingPaymentsPage } from './_components/billing-payments-page'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('billing.sections.payments')
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

function paymentStatusParam(value: string | undefined) {
  return PAYMENT_STATUSES.includes(value as PaymentStatus)
    ? (value as PaymentStatus)
    : undefined
}

function paymentMethodParam(value: string | undefined) {
  return PAYMENT_METHODS.includes(value as PaymentMethod)
    ? (value as PaymentMethod)
    : undefined
}

function paymentKindParam(value: string | undefined) {
  return PAYMENT_KINDS.includes(value as PaymentKind)
    ? (value as PaymentKind)
    : undefined
}

export default async function PaymentsPage({ params, searchParams }: PageProps) {
  const { orgId, branchId } = await params
  const query = await searchParams

  return (
    <BillingPaymentsPage
      orgId={orgId}
      branchId={branchId}
      page={numberParam(firstParam(query.page), 1)}
      limit={Math.min(100, numberParam(firstParam(query.limit), 20))}
      status={paymentStatusParam(firstParam(query.status))}
      method={paymentMethodParam(firstParam(query.method))}
      paymentKind={paymentKindParam(firstParam(query.paymentKind))}
    />
  )
}
