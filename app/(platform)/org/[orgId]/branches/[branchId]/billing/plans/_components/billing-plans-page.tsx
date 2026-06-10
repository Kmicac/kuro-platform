'use client'

import { useFormatter, useTranslations } from 'next-intl'
import { CheckCircle2, FileText, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  TextureCard,
  TextureCardContent,
} from '@/components/ui/texture-card'
import {
  EmptyState,
  ErrorState,
  ForbiddenState,
  PageHeader,
} from '@/components/shared'
import { ApiError } from '@/lib/api/client'
import type { BillingFrequency } from '@/lib/api/billing.types'
import { toBillingPlansVM } from '@/lib/billing'
import { useBillingPlans, useBranch, useCapabilities } from '@/lib/hooks'

interface BillingPlansPageProps {
  orgId: string
  branchId: string
}

const FREQUENCY_LABEL_KEYS = {
  WEEKLY: 'billingFrequency.WEEKLY',
  MONTHLY: 'billingFrequency.MONTHLY',
  QUARTERLY: 'billingFrequency.QUARTERLY',
  YEARLY: 'billingFrequency.YEARLY',
  ONE_TIME: 'billingFrequency.ONE_TIME',
} as const satisfies Record<BillingFrequency, string>

export function BillingPlansPage({ orgId, branchId }: BillingPlansPageProps) {
  const t = useTranslations('billing')
  const tn = useTranslations('navigation')
  const format = useFormatter()

  const branchQuery = useBranch(orgId, branchId)
  const capabilitiesQuery = useCapabilities(orgId)
  const canReadBilling =
    capabilitiesQuery.data?.capabilities.billing?.canReadBilling ?? false
  const hasCapabilities = Boolean(capabilitiesQuery.data)
  const billingEnabled = hasCapabilities && canReadBilling
  const plansQuery = useBillingPlans(orgId, branchId, {
    enabled: billingEnabled,
  })

  const forbiddenByCapabilities = hasCapabilities && !canReadBilling
  const forbiddenByBackend =
    plansQuery.error instanceof ApiError && plansQuery.error.status === 403
  const error =
    capabilitiesQuery.error ?? (!forbiddenByBackend ? plansQuery.error : null)
  const isLoading =
    capabilitiesQuery.isLoading || (billingEnabled && plansQuery.isLoading)
  const rows = plansQuery.data
    ? toBillingPlansVM(plansQuery.data, {
        unknownCurrencyLabel: t('currency.unknown'),
      })
    : []

  const header = (
    <PageHeader
      breadcrumbs={[
        { label: tn('labels.organization'), href: `/org/${orgId}` },
        { label: branchQuery.data?.name ?? tn('labels.branch') },
        { label: t('sections.plans.title') },
      ]}
      title={t('sections.plans.title')}
      subtitle={t('sections.plans.subtitle')}
    />
  )

  const retry = () => {
    void capabilitiesQuery.refetch()
    void plansQuery.refetch()
  }

  if (forbiddenByCapabilities || forbiddenByBackend) {
    return (
      <div className="p-6 space-y-6">
        {header}
        <ForbiddenState
          title={t('dashboard.states.forbiddenTitle')}
          description={t('dashboard.states.forbiddenDescription')}
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        {header}
        <ErrorState error={error} onRetry={retry} />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {header}

      <TextureCard>
        <TextureCardContent className="p-5">
          <PlansTable
            isLoading={isLoading}
            rows={rows}
            labelFrequency={(frequency) =>
              t(FREQUENCY_LABEL_KEYS[frequency] as Parameters<typeof t>[0])
            }
            formatDate={(value) =>
              format.dateTime(new Date(value), {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })
            }
          />
        </TextureCardContent>
      </TextureCard>
    </div>
  )
}

function PlansTable({
  isLoading,
  rows,
  labelFrequency,
  formatDate,
}: {
  isLoading: boolean
  rows: ReturnType<typeof toBillingPlansVM>
  labelFrequency: (frequency: BillingFrequency) => string
  formatDate: (value: string) => string
}) {
  const t = useTranslations('billing.plans')

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-12 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title={t('emptyTitle')}
        description={t('emptyDescription')}
        dense
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">
        {t('total', { count: rows.length })}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="font-medium pb-2">{t('name')}</th>
              <th className="font-medium pb-2">{t('frequency')}</th>
              <th className="font-medium pb-2">{t('amount')}</th>
              <th className="font-medium pb-2">{t('enrollmentFee')}</th>
              <th className="font-medium pb-2">{t('statusLabel')}</th>
              <th className="font-medium pb-2">{t('updatedAt')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((plan) => (
              <tr
                key={plan.id}
                className="transition-colors hover:bg-muted/30"
              >
                <td className="py-2.5">
                  <p className="font-medium text-foreground">{plan.name}</p>
                  {plan.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {plan.description}
                    </p>
                  )}
                </td>
                <td className="py-2.5 text-muted-foreground">
                  {labelFrequency(plan.billingFrequency)}
                </td>
                <td className="py-2.5 tabular-nums text-muted-foreground">
                  {plan.amountFormatted}
                </td>
                <td className="py-2.5 tabular-nums text-muted-foreground">
                  {plan.enrollmentFeeAmountFormatted ?? '—'}
                </td>
                <td className="py-2.5">
                  <PlanStatusBadge isActive={plan.isActive} />
                </td>
                <td className="py-2.5 tabular-nums text-muted-foreground">
                  {formatDate(plan.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PlanStatusBadge({ isActive }: { isActive: boolean }) {
  const t = useTranslations('billing.plans.status')
  return (
    <Badge
      variant="outline"
      className={
        isActive
          ? 'border-primary/30 bg-primary/10 text-primary'
          : 'border-border text-muted-foreground'
      }
    >
      {isActive ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      {isActive ? t('active') : t('inactive')}
    </Badge>
  )
}
