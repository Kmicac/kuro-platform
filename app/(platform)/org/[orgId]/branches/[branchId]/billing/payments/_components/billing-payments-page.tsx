'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useFormatter, useTranslations } from 'next-intl'
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Plus,
  ReceiptText,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  PAYMENT_KINDS,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  type PaymentKind,
  type PaymentMethod,
  type PaymentStatus,
  type PossibleDuplicateReason,
} from '@/lib/api/billing.types'
import {
  toPaymentsListVM,
  toPossibleDuplicatePaymentsVM,
} from '@/lib/billing'
import {
  useBranch,
  useBranchPayments,
  useCapabilities,
  usePossibleDuplicatePayments,
} from '@/lib/hooks'
import { cn } from '@/lib/utils'
import { GeneralIncomeDialog } from './general-income-dialog'

interface BillingPaymentsPageProps {
  orgId: string
  branchId: string
  page: number
  limit: number
  status?: PaymentStatus
  method?: PaymentMethod
  paymentKind?: PaymentKind
}

const STATUS_LABEL_KEYS = {
  PENDING: 'paymentStatus.PENDING',
  APPROVED: 'paymentStatus.APPROVED',
  REJECTED: 'paymentStatus.REJECTED',
  CANCELED: 'paymentStatus.CANCELED',
  FAILED: 'paymentStatus.FAILED',
  REFUNDED: 'paymentStatus.REFUNDED',
  CHARGED_BACK: 'paymentStatus.CHARGED_BACK',
} as const satisfies Record<PaymentStatus, string>

const METHOD_LABEL_KEYS = {
  CASH: 'paymentMethod.CASH',
  BANK_TRANSFER: 'paymentMethod.BANK_TRANSFER',
  DEBIT_CARD: 'paymentMethod.DEBIT_CARD',
  CREDIT_CARD: 'paymentMethod.CREDIT_CARD',
  MERCADO_PAGO: 'paymentMethod.MERCADO_PAGO',
  TAKENOS: 'paymentMethod.TAKENOS',
  OTHER: 'paymentMethod.OTHER',
} as const satisfies Record<PaymentMethod, string>

const KIND_LABEL_KEYS = {
  STUDENT_PAYMENT: 'payments.kind.STUDENT_PAYMENT',
  GENERAL_INCOME: 'payments.kind.GENERAL_INCOME',
} as const satisfies Record<PaymentKind, string>

const DUPLICATE_REASON_KEYS = {
  same_external_reference: 'payments.duplicates.reason.sameExternalReference',
  same_student_amount_method_window:
    'payments.duplicates.reason.sameStudentAmountMethodWindow',
} as const satisfies Record<PossibleDuplicateReason, string>

export function BillingPaymentsPage({
  orgId,
  branchId,
  page,
  limit,
  status,
  method,
  paymentKind,
}: BillingPaymentsPageProps) {
  const t = useTranslations('billing')
  const tn = useTranslations('navigation')
  const format = useFormatter()
  const [incomeOpen, setIncomeOpen] = useState(false)

  const branchQuery = useBranch(orgId, branchId)
  const capabilitiesQuery = useCapabilities(orgId)
  const canReadBilling =
    capabilitiesQuery.data?.capabilities.billing?.canReadBilling ?? false
  const canWriteBilling =
    capabilitiesQuery.data?.capabilities.billing?.canWriteBilling ?? false
  const hasCapabilities = Boolean(capabilitiesQuery.data)
  const billingEnabled = hasCapabilities && canReadBilling

  const paymentsQuery = useBranchPayments(
    orgId,
    branchId,
    { page, limit, status, method, paymentKind },
    { enabled: billingEnabled }
  )
  const duplicatesQuery = usePossibleDuplicatePayments(
    orgId,
    branchId,
    { status, method, paymentKind, limit: 100, windowDays: 3 },
    { enabled: billingEnabled }
  )

  const formatDateTime = (value: string) => {
    try {
      return format.dateTime(new Date(value), {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return value
    }
  }

  const payments = paymentsQuery.data
    ? toPaymentsListVM(paymentsQuery.data, {
        unknownCurrencyLabel: t('currency.unknown'),
        formatDateTime,
      })
    : null
  const duplicates = duplicatesQuery.data
    ? toPossibleDuplicatePaymentsVM(duplicatesQuery.data, {
        unknownCurrencyLabel: t('currency.unknown'),
        formatDateTime,
      })
    : null

  const forbiddenByCapabilities = hasCapabilities && !canReadBilling
  const forbiddenByBackend =
    paymentsQuery.error instanceof ApiError && paymentsQuery.error.status === 403
  const error =
    capabilitiesQuery.error ?? (!forbiddenByBackend ? paymentsQuery.error : null)
  const isLoading =
    capabilitiesQuery.isLoading || (billingEnabled && paymentsQuery.isLoading)

  const retry = () => {
    void capabilitiesQuery.refetch()
    void paymentsQuery.refetch()
    void duplicatesQuery.refetch()
  }

  const header = (
    <PageHeader
      breadcrumbs={[
        { label: tn('labels.organization'), href: `/org/${orgId}` },
        { label: branchQuery.data?.name ?? tn('labels.branch') },
        { label: t('sections.payments.title') },
      ]}
      title={t('sections.payments.title')}
      subtitle={t('sections.payments.subtitle')}
      actions={
        canWriteBilling ? (
          <Button size="sm" onClick={() => setIncomeOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('payments.actions.generalIncome')}
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

      <PaymentFilters
        orgId={orgId}
        branchId={branchId}
        page={page}
        limit={limit}
        selectedStatus={status}
        selectedMethod={method}
        selectedKind={paymentKind}
        labelStatus={(value) =>
          t(STATUS_LABEL_KEYS[value] as Parameters<typeof t>[0])
        }
        labelMethod={(value) =>
          t(METHOD_LABEL_KEYS[value] as Parameters<typeof t>[0])
        }
        labelKind={(value) =>
          t(KIND_LABEL_KEYS[value] as Parameters<typeof t>[0])
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <TextureCard>
          <TextureCardContent className="p-5">
            <PaymentsTable
              isLoading={isLoading}
              rows={payments?.items ?? []}
              total={payments?.meta.total}
              page={page}
              limit={limit}
              orgId={orgId}
              branchId={branchId}
              status={status}
              method={method}
              paymentKind={paymentKind}
              labelStatus={(value) =>
                t(STATUS_LABEL_KEYS[value] as Parameters<typeof t>[0])
              }
              labelMethod={(value) =>
                t(METHOD_LABEL_KEYS[value] as Parameters<typeof t>[0])
              }
              labelKind={(value) =>
                t(KIND_LABEL_KEYS[value] as Parameters<typeof t>[0])
              }
            />
          </TextureCardContent>
        </TextureCard>

        <TextureCard>
          <TextureCardContent className="p-5">
            <DuplicatePaymentsPanel
              isLoading={duplicatesQuery.isLoading}
              groups={duplicates?.items ?? []}
              inspectedPayments={duplicates?.meta.inspectedPayments}
              totalGroups={duplicates?.meta.totalGroups}
              reasonLabel={(reason) =>
                t(DUPLICATE_REASON_KEYS[reason] as Parameters<typeof t>[0])
              }
            />
          </TextureCardContent>
        </TextureCard>
      </div>

      <GeneralIncomeDialog
        orgId={orgId}
        branchId={branchId}
        open={incomeOpen}
        onOpenChange={setIncomeOpen}
      />
    </div>
  )
}

function PaymentFilters({
  orgId,
  branchId,
  page,
  limit,
  selectedStatus,
  selectedMethod,
  selectedKind,
  labelStatus,
  labelMethod,
  labelKind,
}: {
  orgId: string
  branchId: string
  page: number
  limit: number
  selectedStatus?: PaymentStatus
  selectedMethod?: PaymentMethod
  selectedKind?: PaymentKind
  labelStatus: (status: PaymentStatus) => string
  labelMethod: (method: PaymentMethod) => string
  labelKind: (kind: PaymentKind) => string
}) {
  const t = useTranslations('billing.payments')
  const base = `/org/${orgId}/branches/${branchId}/billing/payments`

  const hrefFor = ({
    status,
    method,
    paymentKind,
  }: {
    status?: PaymentStatus
    method?: PaymentMethod
    paymentKind?: PaymentKind
  }) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    })
    if (status) params.set('status', status)
    if (method) params.set('method', method)
    if (paymentKind) params.set('paymentKind', paymentKind)
    return `${base}?${params}`
  }

  return (
    <div className="space-y-3">
      <FilterRow>
        <FilterLink
          href={hrefFor({ method: selectedMethod, paymentKind: selectedKind })}
          active={!selectedStatus}
        >
          {t('filters.allStatuses')}
        </FilterLink>
        {PAYMENT_STATUSES.map((status) => (
          <FilterLink
            key={status}
            href={hrefFor({
              status,
              method: selectedMethod,
              paymentKind: selectedKind,
            })}
            active={selectedStatus === status}
          >
            {labelStatus(status)}
          </FilterLink>
        ))}
      </FilterRow>

      <FilterRow>
        <FilterLink
          href={hrefFor({ status: selectedStatus, paymentKind: selectedKind })}
          active={!selectedMethod}
        >
          {t('filters.allMethods')}
        </FilterLink>
        {PAYMENT_METHODS.map((method) => (
          <FilterLink
            key={method}
            href={hrefFor({
              status: selectedStatus,
              method,
              paymentKind: selectedKind,
            })}
            active={selectedMethod === method}
          >
            {labelMethod(method)}
          </FilterLink>
        ))}
      </FilterRow>

      <FilterRow>
        <FilterLink
          href={hrefFor({ status: selectedStatus, method: selectedMethod })}
          active={!selectedKind}
        >
          {t('filters.allKinds')}
        </FilterLink>
        {PAYMENT_KINDS.map((kind) => (
          <FilterLink
            key={kind}
            href={hrefFor({
              status: selectedStatus,
              method: selectedMethod,
              paymentKind: kind,
            })}
            active={selectedKind === kind}
          >
            {labelKind(kind)}
          </FilterLink>
        ))}
      </FilterRow>
    </div>
  )
}

function FilterRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>
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

function PaymentsTable({
  isLoading,
  rows,
  total,
  page,
  limit,
  orgId,
  branchId,
  status,
  method,
  paymentKind,
  labelStatus,
  labelMethod,
  labelKind,
}: {
  isLoading: boolean
  rows: ReturnType<typeof toPaymentsListVM>['items']
  total?: number
  page: number
  limit: number
  orgId: string
  branchId: string
  status?: PaymentStatus
  method?: PaymentMethod
  paymentKind?: PaymentKind
  labelStatus: (status: PaymentStatus) => string
  labelMethod: (method: PaymentMethod) => string
  labelKind: (kind: PaymentKind) => string
}) {
  const t = useTranslations('billing.payments')

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
  const base = `/org/${orgId}/branches/${branchId}/billing/payments`
  const pageHref = (nextPage: number) => {
    const params = new URLSearchParams({
      page: String(nextPage),
      limit: String(limit),
    })
    if (status) params.set('status', status)
    if (method) params.set('method', method)
    if (paymentKind) params.set('paymentKind', paymentKind)
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
              <th className="font-medium pb-2">{t('recordedAt')}</th>
              <th className="font-medium pb-2">{t('student')}</th>
              <th className="font-medium pb-2">{t('kindLabel')}</th>
              <th className="font-medium pb-2">{t('method')}</th>
              <th className="font-medium pb-2">{t('grossAmount')}</th>
              <th className="font-medium pb-2">{t('netAmount')}</th>
              <th className="font-medium pb-2">{t('statusLabel')}</th>
              <th className="font-medium pb-2">{t('description')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((payment) => (
              <tr
                key={payment.id}
                className="transition-colors hover:bg-muted/30"
              >
                <td className="py-2.5 tabular-nums text-muted-foreground">
                  {payment.recordedAtFormatted}
                </td>
                <td className="py-2.5 text-muted-foreground">
                  {payment.studentName ?? t('generalIncomeStudent')}
                </td>
                <td className="py-2.5 text-muted-foreground">
                  {labelKind(payment.paymentKind)}
                </td>
                <td className="py-2.5 text-muted-foreground">
                  {labelMethod(payment.method)}
                </td>
                <td className="py-2.5 tabular-nums text-muted-foreground">
                  {payment.grossAmountFormatted}
                </td>
                <td className="py-2.5 tabular-nums text-muted-foreground">
                  {payment.netAmountFormatted}
                </td>
                <td className="py-2.5">
                  <PaymentStatusBadge
                    status={payment.status}
                    label={labelStatus(payment.status)}
                  />
                </td>
                <td className="py-2.5 text-muted-foreground">
                  {payment.description ?? payment.externalReference ?? '—'}
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

function PaymentStatusBadge({
  status,
  label,
}: {
  status: PaymentStatus
  label: string
}) {
  const className =
    status === 'APPROVED'
      ? 'border-primary/30 bg-primary/10 text-primary'
      : status === 'PENDING'
        ? 'border-border text-muted-foreground'
        : 'border-destructive/30 bg-destructive/10 text-destructive'

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  )
}

function DuplicatePaymentsPanel({
  isLoading,
  groups,
  inspectedPayments,
  totalGroups,
  reasonLabel,
}: {
  isLoading: boolean
  groups: ReturnType<typeof toPossibleDuplicatePaymentsVM>['items']
  inspectedPayments?: number
  totalGroups?: number
  reasonLabel: (reason: PossibleDuplicateReason) => string
}) {
  const t = useTranslations('billing.payments.duplicates')

  return (
    <section className="space-y-4">
      <div>
        <h2 className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
          <CircleAlert className="h-4 w-4" />
          {t('title')}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {t('summary', {
            groups: totalGroups ?? 0,
            payments: inspectedPayments ?? 0,
          })}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-20 rounded-md bg-muted animate-pulse" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="space-y-3">
          {groups.slice(0, 5).map((group, index) => (
            <div key={`${group.reason}-${index}`} className="rounded-md border border-border p-3">
              <p className="text-xs font-medium text-foreground">
                {reasonLabel(group.reason)}
              </p>
              <div className="mt-2 space-y-2">
                {group.payments.map((payment) => (
                  <div key={payment.id} className="text-xs text-muted-foreground">
                    <div className="flex items-center justify-between gap-3">
                      <span>{payment.studentName ?? t('generalIncome')}</span>
                      <span className="tabular-nums">
                        {payment.grossAmountFormatted}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-3">
                      <span>{payment.externalReference ?? payment.description ?? payment.id}</span>
                      <span className="tabular-nums">
                        {payment.recordedAtFormatted}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
