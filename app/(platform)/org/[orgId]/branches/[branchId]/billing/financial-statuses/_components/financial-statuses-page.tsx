'use client'

import Link from 'next/link'
import { useFormatter, useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react'
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
  BranchStudentFinancialStatusItem,
  StudentFinancialStatus,
} from '@/lib/api/billing.types'
import { STUDENT_FINANCIAL_STATUSES } from '@/lib/api/billing.types'
import {
  toBranchStudentFinancialStatusesVM,
} from '@/lib/billing'
import {
  useBranch,
  useBranchFinancialStatuses,
  useCapabilities,
} from '@/lib/hooks'
import { cn } from '@/lib/utils'

interface FinancialStatusesPageProps {
  orgId: string
  branchId: string
  page: number
  limit: number
  status?: StudentFinancialStatus
}

const STATUS_LABEL_KEYS = {
  CURRENT: 'financialStatus.CURRENT',
  DUE_SOON: 'financialStatus.DUE_SOON',
  OVERDUE: 'financialStatus.OVERDUE',
  RESTRICTED: 'financialStatus.RESTRICTED',
  FROZEN: 'financialStatus.FROZEN',
} as const satisfies Record<StudentFinancialStatus, string>

export function FinancialStatusesPage({
  orgId,
  branchId,
  page,
  limit,
  status,
}: FinancialStatusesPageProps) {
  const t = useTranslations('billing')
  const tn = useTranslations('navigation')
  const format = useFormatter()

  const branchQuery = useBranch(orgId, branchId)
  const capabilitiesQuery = useCapabilities(orgId)
  const canReadBilling =
    capabilitiesQuery.data?.capabilities.billing?.canReadBilling ?? false
  const hasCapabilities = Boolean(capabilitiesQuery.data)
  const billingEnabled = hasCapabilities && canReadBilling

  const statusesQuery = useBranchFinancialStatuses(
    orgId,
    branchId,
    { page, limit, financialStatus: status },
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

  const rows = statusesQuery.data
    ? toBranchStudentFinancialStatusesVM(statusesQuery.data, {
        displayCurrency: null,
        unknownCurrencyLabel: t('currency.unknown'),
        formatDateTime,
      })
    : null

  const forbiddenByCapabilities = hasCapabilities && !canReadBilling
  const forbiddenByBackend =
    statusesQuery.error instanceof ApiError && statusesQuery.error.status === 403
  const error =
    capabilitiesQuery.error ??
    (!forbiddenByBackend ? statusesQuery.error : null)
  const isLoading =
    capabilitiesQuery.isLoading || (billingEnabled && statusesQuery.isLoading)

  const retry = () => {
    void capabilitiesQuery.refetch()
    void statusesQuery.refetch()
  }

  const header = (
    <PageHeader
      breadcrumbs={[
        { label: tn('labels.organization'), href: `/org/${orgId}` },
        { label: branchQuery.data?.name ?? tn('labels.branch') },
        { label: t('sections.financialStatuses.title') },
      ]}
      title={t('sections.financialStatuses.title')}
      subtitle={t('sections.financialStatuses.subtitle')}
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

      <FinancialStatusFilters
        orgId={orgId}
        branchId={branchId}
        page={page}
        limit={limit}
        selected={status}
        labelFor={(value) =>
          t(STATUS_LABEL_KEYS[value] as Parameters<typeof t>[0])
        }
        allLabel={t('dashboard.filters.allStatuses')}
      />

      <TextureCard>
        <TextureCardContent className="p-5">
          <FinancialStatusesTable
            isLoading={isLoading}
            rows={rows?.items ?? []}
            total={rows?.meta.total}
            page={page}
            limit={limit}
            orgId={orgId}
            branchId={branchId}
            status={status}
            labelFor={(value) =>
              t(STATUS_LABEL_KEYS[value] as Parameters<typeof t>[0])
            }
            restrictionLabel={(item) => restrictionLabel(item, t)}
            formatNumber={(value) => format.number(value)}
            emptyTitle={t('financialStatuses.emptyTitle')}
            emptyDescription={t('financialStatuses.emptyDescription')}
          />
        </TextureCardContent>
      </TextureCard>
    </div>
  )
}

function FinancialStatusFilters({
  orgId,
  branchId,
  page,
  limit,
  selected,
  labelFor,
  allLabel,
}: {
  orgId: string
  branchId: string
  page: number
  limit: number
  selected?: StudentFinancialStatus
  labelFor: (status: StudentFinancialStatus) => string
  allLabel: string
}) {
  const base = `/org/${orgId}/branches/${branchId}/billing/financial-statuses`

  const hrefFor = (status?: StudentFinancialStatus) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    })
    if (status) params.set('financialStatus', status)
    return `${base}?${params}`
  }

  return (
    <div className="flex flex-wrap gap-2">
      <FilterLink href={hrefFor()} active={!selected}>
        {allLabel}
      </FilterLink>
      {STUDENT_FINANCIAL_STATUSES.map((status) => (
        <FilterLink
          key={status}
          href={hrefFor(status)}
          active={selected === status}
        >
          {labelFor(status)}
        </FilterLink>
      ))}
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

function FinancialStatusesTable({
  isLoading,
  rows,
  total,
  page,
  limit,
  orgId,
  branchId,
  status,
  labelFor,
  restrictionLabel,
  formatNumber,
  emptyTitle,
  emptyDescription,
}: {
  isLoading: boolean
  rows: ReturnType<typeof toBranchStudentFinancialStatusesVM>['items']
  total?: number
  page: number
  limit: number
  orgId: string
  branchId: string
  status?: StudentFinancialStatus
  labelFor: (status: StudentFinancialStatus) => string
  restrictionLabel: (item: BranchStudentFinancialStatusItem) => string
  formatNumber: (value: number) => string
  emptyTitle: string
  emptyDescription: string
}) {
  const t = useTranslations('billing.financialStatuses')
  const totalPages = total == null ? 1 : Math.max(1, Math.ceil(total / limit))

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((item) => (
          <div key={item} className="h-12 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title={emptyTitle}
        description={emptyDescription}
        dense
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{t('total', { count: total ?? rows.length })}</span>
        <span>
          {t('page', { page, totalPages })}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="font-medium pb-2">{t('student')}</th>
              <th className="font-medium pb-2">{t('status')}</th>
              <th className="font-medium pb-2">{t('membership')}</th>
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
                <td className="py-2.5 text-muted-foreground">
                  {row.membership?.status ?? t('withoutMembership')}
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

      <PaginationControls
        orgId={orgId}
        branchId={branchId}
        page={page}
        limit={limit}
        totalPages={totalPages}
        status={status}
      />
    </div>
  )
}

function PaginationControls({
  orgId,
  branchId,
  page,
  limit,
  totalPages,
  status,
}: {
  orgId: string
  branchId: string
  page: number
  limit: number
  totalPages: number
  status?: StudentFinancialStatus
}) {
  const t = useTranslations('billing.financialStatuses')
  const base = `/org/${orgId}/branches/${branchId}/billing/financial-statuses`
  const hrefFor = (targetPage: number) => {
    const params = new URLSearchParams({
      page: String(targetPage),
      limit: String(limit),
    })
    if (status) params.set('financialStatus', status)
    return `${base}?${params}`
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Button asChild variant="outline" size="sm" disabled={page <= 1}>
        <Link
          href={hrefFor(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          tabIndex={page <= 1 ? -1 : undefined}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {t('previous')}
        </Link>
      </Button>
      <Button
        asChild
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
      >
        <Link
          href={hrefFor(Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          tabIndex={page >= totalPages ? -1 : undefined}
        >
          {t('next')}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </Button>
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
