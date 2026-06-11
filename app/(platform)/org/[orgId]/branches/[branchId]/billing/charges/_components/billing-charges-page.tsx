'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useFormatter, useTranslations } from 'next-intl'
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Plus,
  ReceiptText,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
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
import {
  BILLING_CHARGE_STATUSES,
  BILLING_CHARGE_TYPES,
  type BillingChargeListItem,
  type BillingChargeStatus,
  type BillingChargeType,
} from '@/lib/api/billing.types'
import { toBillingChargesListVM } from '@/lib/billing'
import { useBranch, useBranchBillingCharges, useCapabilities } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import { CreateManualChargeDialog } from './create-manual-charge-dialog'
import { ManualPaymentDialog } from './manual-payment-dialog'

interface BillingChargesPageProps {
  orgId: string
  branchId: string
  page: number
  limit: number
  status?: BillingChargeStatus
  chargeType?: BillingChargeType
}

const STATUS_LABEL_KEYS = {
  PENDING: 'chargeStatus.PENDING',
  PARTIALLY_PAID: 'chargeStatus.PARTIALLY_PAID',
  PAID: 'chargeStatus.PAID',
  OVERDUE: 'chargeStatus.OVERDUE',
  CANCELED: 'chargeStatus.CANCELED',
  VOID: 'chargeStatus.VOID',
} as const satisfies Record<BillingChargeStatus, string>

const TYPE_LABEL_KEYS = {
  MEMBERSHIP: 'chargeType.MEMBERSHIP',
  ENROLLMENT: 'chargeType.ENROLLMENT',
  ADJUSTMENT: 'chargeType.ADJUSTMENT',
  MANUAL: 'chargeType.MANUAL',
} as const satisfies Record<BillingChargeType, string>

export function BillingChargesPage({
  orgId,
  branchId,
  page,
  limit,
  status,
  chargeType,
}: BillingChargesPageProps) {
  const t = useTranslations('billing')
  const tn = useTranslations('navigation')
  const format = useFormatter()
  const [selectedCharge, setSelectedCharge] =
    useState<BillingChargeListItem | null>(null)
  const [createChargeOpen, setCreateChargeOpen] = useState(false)

  const branchQuery = useBranch(orgId, branchId)
  const capabilitiesQuery = useCapabilities(orgId)
  const canReadBilling =
    capabilitiesQuery.data?.capabilities.billing?.canReadBilling ?? false
  const canWriteBilling =
    capabilitiesQuery.data?.capabilities.billing?.canWriteBilling ?? false
  const hasCapabilities = Boolean(capabilitiesQuery.data)
  const billingEnabled = hasCapabilities && canReadBilling

  const chargesQuery = useBranchBillingCharges(
    orgId,
    branchId,
    { page, limit, status, chargeType },
    { enabled: billingEnabled }
  )

  const formatDate = (value: string) => {
    try {
      return format.dateTime(new Date(value), {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return value
    }
  }

  const rows = chargesQuery.data
    ? toBillingChargesListVM(chargesQuery.data, {
        unknownCurrencyLabel: t('currency.unknown'),
        formatDateTime: formatDate,
      })
    : null

  const forbiddenByCapabilities = hasCapabilities && !canReadBilling
  const forbiddenByBackend =
    chargesQuery.error instanceof ApiError && chargesQuery.error.status === 403
  const error =
    capabilitiesQuery.error ?? (!forbiddenByBackend ? chargesQuery.error : null)
  const isLoading =
    capabilitiesQuery.isLoading || (billingEnabled && chargesQuery.isLoading)

  const retry = () => {
    void capabilitiesQuery.refetch()
    void chargesQuery.refetch()
  }

  const header = (
    <PageHeader
      breadcrumbs={[
        { label: tn('labels.organization'), href: `/org/${orgId}` },
        { label: branchQuery.data?.name ?? tn('labels.branch') },
        { label: t('sections.charges.title') },
      ]}
      title={t('sections.charges.title')}
      subtitle={t('sections.charges.subtitle')}
      actions={
        canWriteBilling ? (
          <Button size="sm" onClick={() => setCreateChargeOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('charges.actions.create')}
          </Button>
        ) : null
      }
    />
  )

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

      <ChargesFilters
        orgId={orgId}
        branchId={branchId}
        page={page}
        limit={limit}
        selectedStatus={status}
        selectedType={chargeType}
        labelStatus={(value) =>
          t(STATUS_LABEL_KEYS[value] as Parameters<typeof t>[0])
        }
        labelType={(value) =>
          t(TYPE_LABEL_KEYS[value] as Parameters<typeof t>[0])
        }
      />

      <TextureCard>
        <TextureCardContent className="p-5">
          <ChargesTable
            isLoading={isLoading}
            rows={rows?.items ?? []}
            total={rows?.meta.total}
            page={page}
            limit={limit}
            orgId={orgId}
            branchId={branchId}
            status={status}
            chargeType={chargeType}
            labelStatus={(value) =>
              t(STATUS_LABEL_KEYS[value] as Parameters<typeof t>[0])
            }
            labelType={(value) =>
              t(TYPE_LABEL_KEYS[value] as Parameters<typeof t>[0])
            }
            onOpen={setSelectedCharge}
          />
        </TextureCardContent>
      </TextureCard>

      <ChargeDetailSheet
        charge={selectedCharge}
        open={Boolean(selectedCharge)}
        onOpenChange={(open) => {
          if (!open) setSelectedCharge(null)
        }}
        labelStatus={(value) =>
          t(STATUS_LABEL_KEYS[value] as Parameters<typeof t>[0])
        }
        labelType={(value) =>
          t(TYPE_LABEL_KEYS[value] as Parameters<typeof t>[0])
        }
        formatDate={formatDate}
        orgId={orgId}
        canWriteBilling={canWriteBilling}
        onPaymentRecorded={() => {
          setSelectedCharge(null)
          void chargesQuery.refetch()
        }}
      />

      <CreateManualChargeDialog
        orgId={orgId}
        branchId={branchId}
        open={createChargeOpen}
        onOpenChange={setCreateChargeOpen}
        onSuccess={() => {
          void chargesQuery.refetch()
        }}
      />
    </div>
  )
}

function ChargesFilters({
  orgId,
  branchId,
  page,
  limit,
  selectedStatus,
  selectedType,
  labelStatus,
  labelType,
}: {
  orgId: string
  branchId: string
  page: number
  limit: number
  selectedStatus?: BillingChargeStatus
  selectedType?: BillingChargeType
  labelStatus: (status: BillingChargeStatus) => string
  labelType: (type: BillingChargeType) => string
}) {
  const t = useTranslations('billing.charges')
  const base = `/org/${orgId}/branches/${branchId}/billing/charges`

  const hrefFor = ({
    status,
    chargeType,
  }: {
    status?: BillingChargeStatus
    chargeType?: BillingChargeType
  }) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    })
    if (status) params.set('status', status)
    if (chargeType) params.set('chargeType', chargeType)
    return `${base}?${params}`
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <FilterLink
          href={hrefFor({ chargeType: selectedType })}
          active={!selectedStatus}
        >
          {t('filters.allStatuses')}
        </FilterLink>
        {BILLING_CHARGE_STATUSES.map((status) => (
          <FilterLink
            key={status}
            href={hrefFor({ status, chargeType: selectedType })}
            active={selectedStatus === status}
          >
            {labelStatus(status)}
          </FilterLink>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <FilterLink
          href={hrefFor({ status: selectedStatus })}
          active={!selectedType}
        >
          {t('filters.allTypes')}
        </FilterLink>
        {BILLING_CHARGE_TYPES.map((type) => (
          <FilterLink
            key={type}
            href={hrefFor({ status: selectedStatus, chargeType: type })}
            active={selectedType === type}
          >
            {labelType(type)}
          </FilterLink>
        ))}
      </div>
    </div>
  )
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        'rounded-md border px-3 py-1.5 text-xs transition-colors',
        active
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground'
      )}
    >
      {children}
    </Link>
  )
}

function ChargesTable({
  isLoading,
  rows,
  total,
  page,
  limit,
  orgId,
  branchId,
  status,
  chargeType,
  labelStatus,
  labelType,
  onOpen,
}: {
  isLoading: boolean
  rows: ReturnType<typeof toBillingChargesListVM>['items']
  total?: number
  page: number
  limit: number
  orgId: string
  branchId: string
  status?: BillingChargeStatus
  chargeType?: BillingChargeType
  labelStatus: (status: BillingChargeStatus) => string
  labelType: (type: BillingChargeType) => string
  onOpen: (charge: BillingChargeListItem) => void
}) {
  const t = useTranslations('billing.charges')

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((item) => (
          <div key={item} className="h-14 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={ReceiptText}
        title={t('emptyTitle')}
        description={t('emptyDescription')}
        dense
      />
    )
  }

  const totalPages = Math.max(1, Math.ceil((total ?? rows.length) / limit))
  const base = `/org/${orgId}/branches/${branchId}/billing/charges`
  const pageHref = (nextPage: number) => {
    const params = new URLSearchParams({
      page: String(nextPage),
      limit: String(limit),
    })
    if (status) params.set('status', status)
    if (chargeType) params.set('chargeType', chargeType)
    return `${base}?${params}`
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{t('total', { count: total ?? rows.length })}</span>
        <span>{t('page', { page, totalPages })}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="font-medium pb-2">{t('description')}</th>
              <th className="font-medium pb-2">{t('student')}</th>
              <th className="font-medium pb-2">{t('type')}</th>
              <th className="font-medium pb-2">{t('dueDate')}</th>
              <th className="font-medium pb-2">{t('amount')}</th>
              <th className="font-medium pb-2">{t('paid')}</th>
              <th className="font-medium pb-2">{t('outstanding')}</th>
              <th className="font-medium pb-2">{t('status')}</th>
              <th className="font-medium pb-2 text-right">
                {t('actions.label')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((charge) => (
              <tr
                key={charge.id}
                className="transition-colors hover:bg-muted/30"
              >
                <td className="py-2.5">
                  <p className="font-medium text-foreground">
                    {charge.description ?? charge.id}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {charge.planName ?? t('withoutPlan')}
                  </p>
                </td>
                <td className="py-2.5 text-muted-foreground">
                  {charge.studentName}
                </td>
                <td className="py-2.5 text-muted-foreground">
                  {labelType(charge.chargeType)}
                </td>
                <td className="py-2.5 tabular-nums text-muted-foreground">
                  {charge.dueDateFormatted}
                </td>
                <td className="py-2.5 tabular-nums text-muted-foreground">
                  {charge.amountFormatted}
                </td>
                <td className="py-2.5 tabular-nums text-muted-foreground">
                  {charge.amountPaidFormatted}
                </td>
                <td className="py-2.5 tabular-nums text-muted-foreground">
                  {charge.outstandingAmountFormatted}
                </td>
                <td className="py-2.5">
                  <ChargeStatusBadge
                    status={charge.effectiveStatus}
                    label={labelStatus(charge.effectiveStatus)}
                  />
                </td>
                <td className="py-2.5 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => onOpen(charge)}
                  >
                    {t('actions.open')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-2">
        <Button asChild variant="outline" size="sm" disabled={page <= 1}>
          <Link href={pageHref(Math.max(1, page - 1))}>
            <ChevronLeft className="h-4 w-4" />
            {t('previous')}
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
        >
          <Link href={pageHref(Math.min(totalPages, page + 1))}>
            {t('next')}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

function ChargeStatusBadge({
  status,
  label,
}: {
  status: BillingChargeStatus
  label: string
}) {
  const className =
    status === 'PAID'
      ? 'border-primary/30 bg-primary/10 text-primary'
      : status === 'OVERDUE' || status === 'VOID' || status === 'CANCELED'
        ? 'border-destructive/30 bg-destructive/10 text-destructive'
        : 'border-border text-muted-foreground'

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  )
}

function ChargeDetailSheet({
  charge,
  open,
  onOpenChange,
  labelStatus,
  labelType,
  formatDate,
  orgId,
  canWriteBilling,
  onPaymentRecorded,
}: {
  charge: BillingChargeListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  labelStatus: (status: BillingChargeStatus) => string
  labelType: (type: BillingChargeType) => string
  formatDate: (value: string) => string
  orgId: string
  canWriteBilling: boolean
  onPaymentRecorded: () => void
}) {
  const t = useTranslations('billing.charges')
  const tb = useTranslations('billing')
  const [manualPaymentOpen, setManualPaymentOpen] = useState(false)

  if (!charge) return null

  const vm = toBillingChargesListVM(
    { items: [charge], meta: { page: 1, limit: 1, total: 1 } },
    {
      unknownCurrencyLabel: tb('currency.unknown'),
      formatDateTime: formatDate,
    }
  ).items[0]
  const canRecordManualPayment =
    canWriteBilling &&
    Number.parseFloat(charge.outstandingAmount) > 0 &&
    !['PAID', 'CANCELED', 'VOID'].includes(charge.effectiveStatus)

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="overflow-y-auto p-6">
          <div className="space-y-5">
            <div className="space-y-1 pr-8">
              <SheetTitle>{t('detail.title')}</SheetTitle>
              <SheetDescription>
                {charge.description ?? charge.id}
              </SheetDescription>
              <ChargeStatusBadge
                status={charge.effectiveStatus}
                label={labelStatus(charge.effectiveStatus)}
              />
            </div>

            <DetailSection title={t('detail.sections.student')}>
              <DetailRow label={t('student')} value={vm.studentName} />
              <DetailRow
                label={t('plan')}
                value={vm.planName ?? t('withoutPlan')}
              />
              <DetailRow label={t('type')} value={labelType(charge.chargeType)} />
              <DetailRow
                label={t('detail.fields.membership')}
                value={charge.studentMembership?.id ?? '—'}
              />
            </DetailSection>

            <DetailSection title={t('detail.sections.amount')}>
              <DetailRow label={t('amount')} value={vm.amountFormatted} />
              <DetailRow label={t('paid')} value={vm.amountPaidFormatted} />
              <DetailRow
                label={t('outstanding')}
                value={vm.outstandingAmountFormatted}
              />
              <DetailRow label={t('dueDate')} value={vm.dueDateFormatted} />
            </DetailSection>

            {canWriteBilling && (
              <DetailSection title={t('detail.sections.actions')}>
                <Button
                  type="button"
                  size="sm"
                  disabled={!canRecordManualPayment}
                  onClick={() => setManualPaymentOpen(true)}
                >
                  <CreditCard className="h-4 w-4" />
                  {t('actions.recordManualPayment')}
                </Button>
              </DetailSection>
            )}

            <DetailSection title={t('detail.sections.payments')}>
              <p className="text-sm text-muted-foreground">
                {t('detail.states.emptyPayments')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('detail.states.noOperatorDetail')}
              </p>
            </DetailSection>

            <DetailSection title={t('detail.sections.metadata')}>
              <DetailRow
                label={t('detail.fields.provider')}
                value={charge.externalProvider ?? '—'}
              />
              <DetailRow
                label={t('detail.fields.externalReference')}
                value={charge.externalReference ?? '—'}
              />
              <DetailRow
                label={t('detail.fields.createdAt')}
                value={formatDate(charge.createdAt)}
              />
              <DetailRow
                label={t('detail.fields.updatedAt')}
                value={formatDate(charge.updatedAt)}
              />
              <DetailRow label={t('detail.fields.chargeId')} value={charge.id} />
            </DetailSection>
          </div>
        </SheetContent>
      </Sheet>

      <ManualPaymentDialog
        orgId={orgId}
        charge={charge}
        open={manualPaymentOpen}
        onOpenChange={setManualPaymentOpen}
        onSuccess={onPaymentRecorded}
      />
    </>
  )
}

function DetailSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3 border-t border-border pt-4">
      <h2 className="text-sm font-medium text-foreground">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[260px] break-words text-right text-foreground">
        {value}
      </span>
    </div>
  )
}
