'use client'

import { useMemo } from 'react'
import { useFormatter, useTranslations } from 'next-intl'
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  CreditCard,
  FileWarning,
  RefreshCw,
  ShieldAlert,
  Users,
  WalletCards,
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
import type {
  BranchBillingSummaryQuery,
  BranchStudentFinancialStatusItem,
  StudentFinancialStatus,
} from '@/lib/api/billing.types'
import { STUDENT_FINANCIAL_STATUSES } from '@/lib/api/billing.types'
import {
  resolveBillingCurrency,
  toBranchBillingSummaryVM,
  toBranchStudentFinancialStatusesVM,
} from '@/lib/billing'
import {
  useBranch,
  useBranchBillingSummary,
  useBranchFinancialStatuses,
  useCapabilities,
} from '@/lib/hooks'
import { cn } from '@/lib/utils'

interface BillingDashboardProps {
  orgId: string
  branchId: string
  filters: BranchBillingSummaryQuery
}

const STATUS_LABEL_KEYS = {
  CURRENT: 'financialStatus.CURRENT',
  DUE_SOON: 'financialStatus.DUE_SOON',
  OVERDUE: 'financialStatus.OVERDUE',
  RESTRICTED: 'financialStatus.RESTRICTED',
  FROZEN: 'financialStatus.FROZEN',
} as const satisfies Record<StudentFinancialStatus, string>

export function BillingDashboard({
  orgId,
  branchId,
  filters,
}: BillingDashboardProps) {
  const t = useTranslations('billing')
  const tn = useTranslations('navigation')
  const format = useFormatter()

  const normalizedFilters = useMemo(
    () => ({
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      currency: filters.currency?.trim().toUpperCase() || undefined,
    }),
    [filters.dateFrom, filters.dateTo, filters.currency]
  )

  const branchQuery = useBranch(orgId, branchId)
  const capabilitiesQuery = useCapabilities(orgId)
  const canReadBilling =
    capabilitiesQuery.data?.capabilities.billing?.canReadBilling ?? false
  const hasCapabilities = Boolean(capabilitiesQuery.data)
  const billingEnabled = hasCapabilities && canReadBilling

  const summaryQuery = useBranchBillingSummary(
    orgId,
    branchId,
    normalizedFilters,
    { enabled: billingEnabled }
  )
  const displayCurrency = resolveBillingCurrency(
    summaryQuery.data?.currency,
    { queryCurrency: normalizedFilters.currency }
  )
  const financialStatusesQuery = useBranchFinancialStatuses(
    orgId,
    branchId,
    { page: 1, limit: 20 },
    { enabled: billingEnabled }
  )

  const formatDateOnly = (value: string) => {
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

  const summary = summaryQuery.data
    ? toBranchBillingSummaryVM(summaryQuery.data, {
        queryCurrency: normalizedFilters.currency,
        unknownCurrencyLabel: t('currency.unknown'),
      })
    : null

  const financialStatuses = financialStatusesQuery.data
    ? toBranchStudentFinancialStatusesVM(financialStatusesQuery.data, {
        displayCurrency,
        unknownCurrencyLabel: t('currency.unknown'),
        formatDateTime,
      })
    : null

  const forbiddenByCapabilities = hasCapabilities && !canReadBilling
  const forbiddenByBackend =
    isForbidden(summaryQuery.error) || isForbidden(financialStatusesQuery.error)

  const isLoading =
    capabilitiesQuery.isLoading ||
    (billingEnabled &&
      (summaryQuery.isLoading || financialStatusesQuery.isLoading))

  const error =
    capabilitiesQuery.error ??
    (!forbiddenByBackend ? summaryQuery.error : null) ??
    (!forbiddenByBackend ? financialStatusesQuery.error : null)

  const retry = () => {
    void capabilitiesQuery.refetch()
    void summaryQuery.refetch()
    void financialStatusesQuery.refetch()
  }

  if (forbiddenByCapabilities || forbiddenByBackend) {
    return (
      <div className="p-6 space-y-6">
        <Header
          orgId={orgId}
          branchName={branchQuery.data?.name}
          title={t('dashboard.title')}
          subtitle={t('dashboard.subtitle')}
          branchLabel={tn('labels.branch')}
          orgLabel={tn('labels.organization')}
        />
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
        <Header
          orgId={orgId}
          branchName={branchQuery.data?.name}
          title={t('dashboard.title')}
          subtitle={t('dashboard.subtitle')}
          branchLabel={tn('labels.branch')}
          orgLabel={tn('labels.organization')}
        />
        <ErrorState error={error} onRetry={retry} />
      </div>
    )
  }

  const period = summary?.period
    ? `${formatDateOnly(summary.period.dateFrom)} - ${formatDateOnly(summary.period.dateTo)}`
    : '—'
  const currencyLabel = summary?.currencyLabel ?? displayCurrency ?? t('currency.unknown')
  const counts = summary?.financialStatusCounts
  const rows = financialStatuses?.items ?? []
  const noActivity =
    Boolean(summary && financialStatuses) &&
    rows.length === 0 &&
    Number(summary?.grossTotal ?? 0) === 0 &&
    Number(summary?.netTotal ?? 0) === 0 &&
    (summary?.approvedPaymentsCount ?? 0) === 0 &&
    (summary?.pendingPaymentsCount ?? 0) === 0 &&
    (summary?.pendingChargesCount ?? 0) === 0 &&
    (summary?.overdueChargesCount ?? 0) === 0 &&
    (summary?.paidChargesCount ?? 0) === 0

  return (
    <div className="p-6 space-y-6">
      <Header
        orgId={orgId}
        branchName={branchQuery.data?.name}
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        branchLabel={tn('labels.branch')}
        orgLabel={tn('labels.organization')}
        actions={
          <Button variant="outline" size="sm" onClick={retry}>
            <RefreshCw className="h-3.5 w-3.5" />
            {t('dashboard.actions.refresh')}
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-md border border-border bg-muted/30 px-2.5 py-1">
          {t('dashboard.filters.period')}: {period}
        </span>
        <span className="rounded-md border border-border bg-muted/30 px-2.5 py-1">
          {t('dashboard.filters.currency')}: {currencyLabel}
        </span>
      </div>

      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label={t('dashboard.metrics.grossTotal')}
          value={summary?.grossTotalFormatted}
          icon={Banknote}
          isLoading={isLoading}
        />
        <MetricCard
          label={t('dashboard.metrics.netTotal')}
          value={summary?.netTotalFormatted}
          icon={WalletCards}
          isLoading={isLoading}
        />
        <MetricCard
          label={t('dashboard.metrics.approvedPayments')}
          value={formatNumber(summary?.approvedPaymentsCount, format)}
          icon={CheckCircle2}
          isLoading={isLoading}
        />
        <MetricCard
          label={t('dashboard.metrics.pendingPayments')}
          value={formatNumber(summary?.pendingPaymentsCount, format)}
          icon={CreditCard}
          isLoading={isLoading}
        />
        <MetricCard
          label={t('dashboard.metrics.pendingCharges')}
          value={formatNumber(summary?.pendingChargesCount, format)}
          icon={FileWarning}
          isLoading={isLoading}
        />
        <MetricCard
          label={t('dashboard.metrics.overdueCharges')}
          value={formatNumber(summary?.overdueChargesCount, format)}
          icon={AlertTriangle}
          isLoading={isLoading}
          tone="warning"
        />
        <MetricCard
          label={t('dashboard.metrics.paidCharges')}
          value={formatNumber(summary?.paidChargesCount, format)}
          icon={CheckCircle2}
          isLoading={isLoading}
        />
        <MetricCard
          label={t('dashboard.metrics.possibleDuplicates')}
          value={formatNumber(summary?.possibleDuplicatesCount, format)}
          icon={ShieldAlert}
          isLoading={isLoading}
          tone="warning"
        />
      </section>

      {noActivity && (
        <EmptyState
          icon={CreditCard}
          title={t('dashboard.states.emptyTitle')}
          description={t('dashboard.states.emptyDescription')}
          dense
        />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <SectionCard
          className="xl:col-span-5"
          title={t('dashboard.sections.financialStatus')}
          subtitle={t('dashboard.sections.financialStatusSubtitle')}
          icon={Users}
        >
          <FinancialStatusBars
            counts={counts}
            isLoading={isLoading}
            labelFor={(status) =>
              t(STATUS_LABEL_KEYS[status] as Parameters<typeof t>[0])
            }
            formatNumber={(value) => format.number(value)}
          />
        </SectionCard>

        <SectionCard
          className="xl:col-span-7"
          title={t('dashboard.sections.operationalRestrictions')}
          subtitle={
            summary
              ? t('dashboard.sections.snapshot', {
                  date: formatDateTime(summary.operationalSnapshot.asOf),
                })
              : t('dashboard.sections.snapshotLoading')
          }
          icon={ShieldAlert}
        >
          <div className="grid grid-cols-3 gap-3">
            <RestrictionMetric
              label={t('dashboard.restrictions.overdueStudents')}
              value={summary?.operationalSnapshot.overdueStudentsCount}
              isLoading={isLoading}
              formatNumber={(value) => format.number(value)}
            />
            <RestrictionMetric
              label={t('dashboard.restrictions.dueSoonStudents')}
              value={summary?.operationalSnapshot.dueSoonStudentsCount}
              isLoading={isLoading}
              formatNumber={(value) => format.number(value)}
            />
            <RestrictionMetric
              label={t('dashboard.restrictions.restrictedStudents')}
              value={summary?.operationalSnapshot.restrictedStudentsCount}
              isLoading={isLoading}
              formatNumber={(value) => format.number(value)}
            />
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title={t('dashboard.sections.students')}
        subtitle={t('dashboard.sections.studentsSubtitle')}
        icon={Users}
      >
        <FinancialStatusesTable
          rows={rows}
          isLoading={isLoading}
          total={financialStatuses?.meta.total}
          labelFor={(status) =>
            t(STATUS_LABEL_KEYS[status] as Parameters<typeof t>[0])
          }
          restrictionLabel={(item) => restrictionLabel(item, t)}
          formatNumber={(value) => format.number(value)}
          emptyTitle={t('dashboard.states.emptyTitle')}
          emptyDescription={t('dashboard.states.emptyDescription')}
        />
      </SectionCard>
    </div>
  )
}

function Header({
  orgId,
  branchName,
  title,
  subtitle,
  branchLabel,
  orgLabel,
  actions,
}: {
  orgId: string
  branchName?: string
  title: string
  subtitle: string
  branchLabel: string
  orgLabel: string
  actions?: React.ReactNode
}) {
  return (
    <PageHeader
      breadcrumbs={[
        { label: orgLabel, href: `/org/${orgId}` },
        { label: branchName ?? branchLabel },
        { label: title },
      ]}
      title={title}
      subtitle={subtitle}
      actions={actions}
    />
  )
}

function MetricCard({
  label,
  value,
  icon: Icon,
  isLoading,
  tone = 'neutral',
}: {
  label: string
  value?: string
  icon: React.ComponentType<{ className?: string }>
  isLoading: boolean
  tone?: 'neutral' | 'warning'
}) {
  return (
    <TextureCard>
      <TextureCardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="label-mono">{label}</p>
          <span
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md',
              tone === 'warning'
                ? 'surface-warning'
                : 'bg-primary/10 text-primary'
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        </div>
        {isLoading ? (
          <div className="mt-4 h-8 w-28 rounded-md bg-muted animate-pulse" />
        ) : (
          <p className="mt-4 text-2xl font-medium tabular-nums text-foreground">
            {value ?? '—'}
          </p>
        )}
      </TextureCardContent>
    </TextureCard>
  )
}

function SectionCard({
  title,
  subtitle,
  icon: Icon,
  className,
  children,
}: {
  title: string
  subtitle?: string
  icon?: React.ComponentType<{ className?: string }>
  className?: string
  children: React.ReactNode
}) {
  return (
    <TextureCard className={className}>
      <TextureCardContent className="p-5 space-y-4">
        <div className="flex items-start gap-2.5">
          {Icon && (
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </span>
          )}
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {children}
      </TextureCardContent>
    </TextureCard>
  )
}

function FinancialStatusBars({
  counts,
  isLoading,
  labelFor,
  formatNumber,
}: {
  counts?: Record<StudentFinancialStatus, number>
  isLoading: boolean
  labelFor: (status: StudentFinancialStatus) => string
  formatNumber: (value: number) => string
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {STUDENT_FINANCIAL_STATUSES.map((status) => (
          <div key={status} className="h-8 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  const max = Math.max(
    ...STUDENT_FINANCIAL_STATUSES.map((status) => counts?.[status] ?? 0),
    1
  )

  return (
    <div className="space-y-3">
      {STUDENT_FINANCIAL_STATUSES.map((status) => {
        const value = counts?.[status] ?? 0
        const width = Math.max(4, Math.round((value / max) * 100))
        return (
          <div key={status} className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-muted-foreground">{labelFor(status)}</span>
              <span className="font-mono tabular-nums text-foreground">
                {formatNumber(value)}
              </span>
            </div>
            <div className="h-2 rounded-sm bg-muted overflow-hidden">
              <div
                className="h-full rounded-sm bg-primary"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function RestrictionMetric({
  label,
  value,
  isLoading,
  formatNumber,
}: {
  label: string
  value?: number
  isLoading: boolean
  formatNumber: (value: number) => string
}) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <p className="label-mono">{label}</p>
      {isLoading ? (
        <div className="mt-2 h-7 w-12 rounded-md bg-muted animate-pulse" />
      ) : (
        <p className="mt-2 text-2xl font-medium tabular-nums text-foreground">
          {formatNumber(value ?? 0)}
        </p>
      )}
    </div>
  )
}

function FinancialStatusesTable({
  rows,
  isLoading,
  total,
  labelFor,
  restrictionLabel,
  formatNumber,
  emptyTitle,
  emptyDescription,
}: {
  rows: ReturnType<typeof toBranchStudentFinancialStatusesVM>['items']
  isLoading: boolean
  total?: number
  labelFor: (status: StudentFinancialStatus) => string
  restrictionLabel: (item: BranchStudentFinancialStatusItem) => string
  formatNumber: (value: number) => string
  emptyTitle: string
  emptyDescription: string
}) {
  const t = useTranslations('billing.dashboard.table')

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
        icon={Users}
        title={emptyTitle}
        description={emptyDescription}
        dense
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">
        {t('total', { count: total ?? rows.length })}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="font-medium pb-2">{t('student')}</th>
              <th className="font-medium pb-2">{t('status')}</th>
              <th className="font-medium pb-2">{t('totalDue')}</th>
              <th className="font-medium pb-2">{t('nextDueDate')}</th>
              <th className="font-medium pb-2">{t('restriction')}</th>
              <th className="font-medium pb-2 text-right">
                {t('daysOverdue')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr
                key={row.student.id}
                className="transition-colors hover:bg-muted/30"
              >
                <td className="py-2.5 font-medium text-foreground">
                  {row.studentName}
                </td>
                <td className="py-2.5">
                  <FinancialStatusBadge
                    status={row.financialStatus}
                    label={labelFor(row.financialStatus)}
                  />
                </td>
                <td className="py-2.5 tabular-nums text-muted-foreground">
                  {row.totalDueFormatted}
                </td>
                <td className="py-2.5 tabular-nums text-muted-foreground">
                  {row.nextDueDateFormatted ?? '—'}
                </td>
                <td className="py-2.5 text-muted-foreground">
                  {restrictionLabel(row)}
                </td>
                <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                  {formatNumber(row.daysOverdue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FinancialStatusBadge({
  status,
  label,
}: {
  status: StudentFinancialStatus
  label: string
}) {
  const className: Record<StudentFinancialStatus, string> = {
    CURRENT: 'border-primary/30 bg-primary/10 text-primary',
    DUE_SOON: 'surface-warning',
    OVERDUE: 'border-destructive/40 bg-destructive/10 text-destructive',
    RESTRICTED: 'border-destructive/50 bg-destructive/10 text-destructive',
    FROZEN: 'border-border text-muted-foreground',
  }

  return (
    <Badge variant="outline" className={className[status]}>
      {label}
    </Badge>
  )
}

function formatNumber(
  value: number | undefined,
  format: ReturnType<typeof useFormatter>
) {
  return value == null ? undefined : format.number(value)
}

function isForbidden(error: unknown) {
  return error instanceof ApiError && error.status === 403
}

function restrictionLabel(
  item: BranchStudentFinancialStatusItem,
  t: ReturnType<typeof useTranslations<'billing'>>
) {
  const attendance = item.activeRestrictionFlags.attendanceRestricted
  const app = item.activeRestrictionFlags.appUsageRestricted
  if (attendance && app) return t('dashboard.restrictions.both')
  if (attendance) return t('dashboard.restrictions.attendance')
  if (app) return t('dashboard.restrictions.app')
  return t('dashboard.restrictions.none')
}
